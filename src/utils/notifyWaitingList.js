import { db } from '../../backend/firebaseConfig';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';

/**
 * Scans all upcoming classes and sends notifications to waiting list users if slots are available.
 * Skips classes that have ended.
 * Prevents duplicate notifications by using a unique tag per class.
 */
export async function scanAndNotifyWaitingLists() {
  try {
    const now = new Date();
    const classesSnapshot = await getDocs(collection(db, 'class'));
    for (const classDoc of classesSnapshot.docs) {
      const classData = classDoc.data();
      const classId = classDoc.id;
      // Skip ended classes
      if (!classData.start_date_time) continue;
      const classEnd = classData.end_date_time
        ? (classData.end_date_time.toDate ? classData.end_date_time.toDate() : new Date(classData.end_date_time))
        : (classData.start_date_time.toDate ? classData.start_date_time.toDate() : new Date(classData.start_date_time));
      if (classEnd < now) continue;
      const slot = classData.slot || 0;
      const title = classData.title || 'Class';
      // Fetch waiting list
      const waitingListRef = collection(db, 'class', classId, 'Waiting_lists');
      const waitingSnapshot = await getDocs(waitingListRef);
      let waiting = waitingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Also include users with booking status 'waiting'
      const usersSnapshot = await getDocs(collection(db, 'users'));
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        if (waiting.some(w => w.userId === userId)) continue;
        const bookingsRef = collection(db, 'users', userId, 'bookings');
        const bookingsSnapshot = await getDocs(bookingsRef);
        bookingsSnapshot.forEach(bookingDoc => {
          const booking = bookingDoc.data();
          if (booking.classid === classId && (booking.Status === 'Waiting' || booking.status === 'Waiting')) {
            waiting.push({
              id: userId + '_booking_waiting',
              fullname: userDoc.data().full_name || userDoc.data().name || '-',
              email: userDoc.data().email || '',
              userId,
              fromBooking: true
            });
          }
        });
      }
      // Fetch booked students (exclude waiting list)
      const waitingUserIds = new Set(waiting.map(w => w.userId));
      let bookedCount = 0;
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const bookingsRef = collection(db, 'users', userId, 'bookings');
        const bookingsSnapshot = await getDocs(bookingsRef);
        bookingsSnapshot.forEach(bookingDoc => {
          const booking = bookingDoc.data();
          if (
            booking.classid === classId &&
            !(booking.Status === 'waiting' || booking.status === 'waiting') &&
            !waitingUserIds.has(userId)
          ) {
            bookedCount++;
          }
        });
      }
      // If slots available, notify waiting list
      if (bookedCount < slot && waiting.length > 0) {
        const usersToNotify = waiting.filter(u => (u.userId || u.userid) && !u.fromBooking);
        if (usersToNotify.length === 0) continue;
        const userIdsToNotify = usersToNotify.map(u => u.userId || u.userid);
        const notificationTag = `slot-available-${classId}`;
        // Check for existing notification
        const existing = await getDocs(collection(db, 'Notification'));
        const existingDoc = existing.docs.find(doc => doc.data().tag === notificationTag);
        if (existingDoc) {
          const existingTo = Array.isArray(existingDoc.data().to) ? existingDoc.data().to : [];
          const newTo = Array.from(new Set([...existingTo, ...userIdsToNotify]));
          if (newTo.length > existingTo.length) {
            await updateDoc(doc(db, 'Notification', existingDoc.id), { to: newTo });
            console.log(`[notifyWaitingList] Updated notification recipients for class ${classId}:`, newTo);
          }
          continue;
        }
        const notification = {
          announcement: `A slot has opened up for the class: ${title}. Please book now to secure your spot.`,
          by: 'SYSTEM',
          subject: 'Slot Available in Class',
          timestamp: new Date(),
          to: userIdsToNotify,
          type: 'Users',
          tag: notificationTag
        };
        await addDoc(collection(db, 'Notification'), notification);
        console.log(`[notifyWaitingList] Notification sent for class ${classId} to:`, userIdsToNotify);
      }
    }
  } catch (err) {
    console.error('[notifyWaitingList] Error:', err);
  }
}
