// Netlify Scheduled Function using ESM/default export style (plain JS)
// This file is for Netlify Functions only. Vite env vars (VITE_*) are not available here.
// Use Netlify.env.get for all secrets. Console logs are added for all major steps.
import admin from "firebase-admin";

// Netlify Functions: use Netlify.env.get for environment variables
const getEnv = (key) => Netlify.env.get(key);

console.log('[DEBUG] Netlify function cold start at', new Date().toISOString());

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const privateKey = getEnv("FIREBASE_PRIVATE_KEY");
  if (privateKey) {
    console.log("[DEBUG] Initializing Firebase Admin SDK...");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: getEnv("FIREBASE_PROJECT_ID"),
        clientEmail: getEnv("FIREBASE_CLIENT_EMAIL"),
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log("[DEBUG] Firebase Admin SDK initialized.");
  } else {
    console.error("[DEBUG] FIREBASE_PRIVATE_KEY environment variable not set. Firebase Admin SDK cannot be initialized.");
  }
}

const db = admin.firestore();

export default async function handler(req, context) {
  console.log(`[DEBUG] notifyWaitingList function triggered at ${new Date().toISOString()}`);
  if (!admin.apps.length) {
    const errorMessage = "Firebase Admin SDK is not initialized. Check server logs for configuration errors.";
    console.error(errorMessage);
    return new Response(errorMessage, { status: 500 });
  }

  try {
    // Get all classes
    const classesSnap = await db.collection('class').get();
    const usersSnap = await db.collection('users').get();
    console.log(`[DEBUG] Fetched ${classesSnap.docs.length} classes and ${usersSnap.docs.length} users.`);
    for (const classDoc of classesSnap.docs) {
      const classid = classDoc.id;
      const classData = classDoc.data();
      const slot = classData.slot || 0;
      const classTitle = classData.title || 'Class';
      console.log(`[DEBUG] Processing class: ${classid} (${classTitle}), slot: ${slot}`);

      // Get waiting list users
      const waitingSnap = await db.collection('class').doc(classid).collection('Waiting_lists').get();
      let waitingUsers = waitingSnap.docs.map(doc => doc.data().userId);
      console.log(`[DEBUG] Waiting list for class ${classid}:`, waitingUsers);

      // Also include users with booking status 'waiting'
      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        if (waitingUsers.includes(userId)) continue;
        const bookingsSnap = await db.collection('users').doc(userId).collection('bookings').get();
        for (const bookingDoc of bookingsSnap.docs) {
          const booking = bookingDoc.data();
          if (booking.classid === classid && (booking.Status === 'Waiting' || booking.status === 'Waiting')) {
            waitingUsers.push(userId);
            break;
          }
        }
      }
      console.log(`[DEBUG] Waiting list (after bookings) for class ${classid}:`, waitingUsers);

      // Get booked students (exclude those in waiting list or with booking status 'waiting')
      let bookedCount = 0;
      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        const bookingsSnap = await db.collection('users').doc(userId).collection('bookings').get();
        for (const bookingDoc of bookingsSnap.docs) {
          const booking = bookingDoc.data();
          if (
            booking.classid === classid &&
            !(booking.Status === 'waiting' || booking.status === 'waiting') &&
            !waitingUsers.includes(userId)
          ) {
            bookedCount++;
          }
        }
      }
      console.log(`[DEBUG] Booked count for class ${classid}: ${bookedCount}`);

      // Notification logic
      const notificationTag = `slot-available-${classid}`;
      const existingQuery = db.collection('Notification').where('tag', '==', notificationTag);

      if (bookedCount < slot && waitingUsers.length > 0) {
        const existingSnap = await existingQuery.get();
        console.log(`[DEBUG] Notification needed for class ${classid}. Existing notification: ${!existingSnap.empty}`);

        if (existingSnap.empty) {
          await db.collection('Notification').add({
            announcement: `A slot has opened up for the class: ${classTitle}. Please book now to secure your spot.`,
            by: "SYSTEM",
            subject: "Slot Available in Class",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            to: waitingUsers,
            type: "Users",
            tag: notificationTag
          });
          console.log(`[DEBUG] Notification sent for class ${classid}`);
        } else {
          const docRef = existingSnap.docs[0].ref;
          const existingTo = existingSnap.docs[0].data().to || [];
          const newTo = Array.from(new Set([...existingTo, ...waitingUsers]));
          if (newTo.length > existingTo.length) {
            await docRef.update({ to: newTo });
            console.log(`[DEBUG] Updated notification recipients for class ${classid}`);
          } else {
            console.log(`[DEBUG] No new recipients to update for class ${classid}`);
          }
        }
      } else {
        const existingSnap = await existingQuery.get();
        if (!existingSnap.empty) {
          for (const doc of existingSnap.docs) {
            await doc.ref.delete();
            console.log(`[DEBUG] Deleted stale notification for class ${classid}`);
          }
        } else {
          console.log(`[DEBUG] No notification to delete for class ${classid}`);
        }
      }
    }
    console.log(`[DEBUG] notifyWaitingList function completed at ${new Date().toISOString()}`);
    return new Response("Notifications checked.", { status: 200 });
  } catch (err) {
    console.error('[DEBUG] Error in scheduled notification:', err);
    return new Response('Error: ' + err.message, { status: 500 });
  }
}

export const config = {
  schedule: "0 0 * * *" // every day at midnight
};