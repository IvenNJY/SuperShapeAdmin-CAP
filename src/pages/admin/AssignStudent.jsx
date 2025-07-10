import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { db } from '../../../backend/firebaseConfig';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc, addDoc } from 'firebase/firestore';
import Navbar from './Navbar';
import ConfirmPopup from '../../components/ConfirmPopup';

export default function AssignStudent() {
  const { classid } = useParams();
  const navigate = useNavigate();
  const [classTitle, setClassTitle] = useState('');
  const [slot, setSlot] = useState(0);
  const [waitingList, setWaitingList] = useState([]);
  const [bookedStudents, setBookedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarMode, setSidebarMode] = useState('waiting'); // 'waiting' or 'booked'
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState([]); // filtered users for dropdown
  const [selectedUsers, setSelectedUsers] = useState([]); // users to add
  const [allUsers, setAllUsers] = useState([]); // all users for search
  const [adding, setAdding] = useState(false);
  const [credit, setCredit] = useState(0);
  const [classType, setClassType] = useState('');
  const [classType2, setClassType2] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false); // for fade animation
  const [showConfirm, setShowConfirm] = useState(false); // for add confirmation

  // Fetch class title and slot
  useEffect(() => {
    async function fetchClassTitle() {
      if (!classid) return;
      try {
        const classDoc = await getDoc(doc(db, 'class', classid));
        if (classDoc.exists()) {
          const data = classDoc.data();
          setClassTitle(data.title || 'Class');
          setSlot(data.slot || 0);
          setCredit(data.credit || 0);
          setClassType(data.class_type || '');
          setClassType2(data.type || '');
        } else {
          setClassTitle('Class');
          setSlot(0);
          setCredit(0);
          setClassType('');
          setClassType2('');
        }
      } catch (e) {
        setClassTitle('Class');
        setSlot(0);
        setCredit(0);
        setClassType('');
        setClassType2('');
      }
    }
    fetchClassTitle();
  }, [classid]);

  // Fetch Waiting List (include users with booking status 'waiting')
  useEffect(() => {
    async function fetchWaitingList() {
      try {
        const waitingListRef = collection(db, 'class', classid, 'Waiting_lists');
        const snapshot = await getDocs(waitingListRef);
        let waiting = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Also include users who have a booking for this class with status 'waiting'
        const usersSnapshot = await getDocs(collection(db, 'users'));
        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          // Skip if already in waiting list
          if (waiting.some(w => w.userId === userId)) continue;
          const bookingsRef = collection(db, 'users', userId, 'bookings');
          const bookingsSnapshot = await getDocs(bookingsRef);
          bookingsSnapshot.forEach(bookingDoc => {
            const booking = bookingDoc.data();
            if (booking.classid === classid && (booking.Status === 'Waiting' || booking.status === 'Waiting')) {
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
        setWaitingList(waiting);
      } catch (e) {
        setWaitingList([]);
        console.error("Error fetching waiting list:", e);
      }
    }
    fetchWaitingList();
  }, [classid]);

  // Fetch Booked Students (exclude those in Waiting_lists or with booking status 'waiting' or 'Cancelled')
  useEffect(() => {
    async function fetchBookedStudents() {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        // Get waiting user IDs for exclusion
        const waitingUserIds = new Set(waitingList.map(w => w.userId));
        const students = [];
        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const bookingsRef = collection(db, 'users', userId, 'bookings');
          const bookingsSnapshot = await getDocs(bookingsRef);
          bookingsSnapshot.forEach(bookingDoc => {
            const booking = bookingDoc.data();
            const status = (booking.Status || booking.status || '').toLowerCase();
            if (
              booking.classid === classid &&
              status !== 'waiting' &&
              status !== 'cancelled' &&
              !waitingUserIds.has(userId)
            ) {
              students.push({
                userId,
                bookingId: bookingDoc.id,
                ...userDoc.data(),
                ...booking
              });
            }
          });
        }
        setBookedStudents(students);
      } catch (e) {
        setBookedStudents([]);
        throw e;
      } finally {
        setLoading(false);
      }
    }
    fetchBookedStudents();
  }, [classid, waitingList]);

  // Notification: when bookedStudents.length < slot, send SYSTEM announcement to all waiting list users
  useEffect(() => {
    async function sendSystemAnnouncement() {
      if (loading) return;
      if (bookedStudents.length < slot && waitingList.length > 0) {
        // Accept both userId and userid (case-insensitive)
        const usersToNotify = waitingList.filter(u => (u.userId || u.userid) && !u.fromBooking);
        if (usersToNotify.length === 0) {
          return;
        }
        const userIdsToNotify = usersToNotify.map(u => u.userId || u.userid);
        // Use a unique tag for this class/slot notification
        const notificationTag = `slot-available-${classid}`;
        // Check if a notification with this tag already exists
        const existing = await getDocs(collection(db, 'Notification'));
        const existingDoc = existing.docs.find(doc => doc.data().tag === notificationTag);
        if (existingDoc) {
          // If the waiting list has grown, update the notification's 'to' field
          const existingTo = Array.isArray(existingDoc.data().to) ? existingDoc.data().to : [];
          const newTo = Array.from(new Set([...existingTo, ...userIdsToNotify]));
          if (newTo.length > existingTo.length) {
            await updateDoc(doc(db, 'Notification', existingDoc.id), { to: newTo });
            console.log('Updated notification recipients for available slot:', newTo);
          }
          return;
        }
        const notification = {
          announcement: `A slot has opened up for the class: ${classTitle}. Please book now to secure your spot.`,
          by: "SYSTEM",
          subject: "Slot Available in Class",
          timestamp: new Date(),
          to: userIdsToNotify,
          type: "Users",
          tag: notificationTag
        };
        try {
          await addDoc(collection(db, 'Notification'), notification);
          console.log('System notification for available slot sent to:', userIdsToNotify);
        } catch (err) {
          console.error('Error sending system notification:', err);
        }
      }
    }
    sendSystemAnnouncement();
  }, [bookedStudents.length, slot, waitingList, classTitle, loading]);

  // Fetch all users for waiting list search
  useEffect(() => {
    async function fetchAllUsers() {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      setAllUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchAllUsers();
  }, []);

  // Filter users for waiting list sidebar
  useEffect(() => {
    if (sidebarMode === 'waiting') {
      setUserOptions(
        allUsers.filter(u =>
          u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) &&
          !waitingList.some(w => w.userId === u.id) &&
          !selectedUsers.some(s => s.id === u.id)
        )
      );
    }
  }, [userSearch, allUsers, waitingList, selectedUsers, sidebarMode]);

  // Filter users for booked students sidebar
  useEffect(() => {
    async function filterBookableUsers() {
      if (sidebarMode !== 'booked' || !classid || !classTitle) return;
      const eligible = [];
      for (const user of allUsers) {
        const creditRemainsSnap = await getDocs(collection(db, 'users', user.id, 'Credit_Remains'));
        let found = false;
        for (const crDoc of creditRemainsSnap.docs) {
          const cr = crDoc.data();
          if (
            cr.credits_remaining > credit &&
            cr.validUntil && new Date(cr.validUntil.toDate ? cr.validUntil.toDate() : cr.validUntil) > new Date()
          ) {
            // Check package
            const pkgDoc = await getDoc(doc(db, 'Credit_Packages', cr.packageId));
            if (pkgDoc.exists()) {
              const pkg = pkgDoc.data();
              if (
                pkg.class_type === classType &&
                pkg.type === classType2
              ) {
                eligible.push({ ...user, creditRemainsId: crDoc.id, packageId: cr.packageId, credits_remaining: cr.credits_remaining });
                found = true;
                break;
              }
            }
          }
        }
        if (found) continue;
      }
      setUserOptions(
        eligible.filter(u =>
          (u.full_name || u.name || '').toLowerCase().includes(userSearch.toLowerCase()) &&
          !bookedStudents.some(b => b.userId === u.id) &&
          !selectedUsers.some(s => s.id === u.id)
        )
      );
    }
    if (sidebarMode === 'booked') { filterBookableUsers(); }
  }, [userSearch, allUsers, bookedStudents, selectedUsers, sidebarMode, classid, classTitle, credit, classType, classType2]);

  // Sidebar open/close with fade
  function openSidebar(mode) {
    setSidebarMode(mode);
    setShowSidebar(true);
    setTimeout(() => setSidebarVisible(true), 10); // trigger fade-in
  }
  function closeSidebar() {
    setSidebarVisible(false);
    setTimeout(() => {
      setShowSidebar(false);
      setSelectedUsers([]);
      setUserSearch('');
    }, 200); // match transition duration
  }

  // Add students to waiting list (with confirmation)
  async function handleAddToWaitingListConfirmed() {
    setShowConfirm(false);
    setAdding(true);
    try {
      const batch = [];
      for (const user of selectedUsers) {
        const docRef = doc(db, 'class', classid, 'Waiting_lists', user.id);
        batch.push(setDoc(docRef, {
          fullname: user.full_name || user.name || '-',
          email: user.email || '',
          added_at: new Date(),
          userId: user.id,
        }, { merge: true }));
      }
      await Promise.all(batch);
      closeSidebar();
    } catch (err) {
      console.error('Error adding to waiting list:', err);
    } finally {
      setAdding(false);
    }
  }

  // Add students to booked list (with confirmation)
  async function handleAddToBookedConfirmed() {
    setShowConfirm(false);
    setAdding(true);
    try {
          // Fetch class data for booking fields
      const classDoc = await getDoc(doc(db, 'class', classid));
      const classData = classDoc.exists() ? classDoc.data() : {};
      for (const user of selectedUsers) {
        // Deduct credit
        const crRef = doc(db, 'users', user.id, 'Credit_Remains', user.creditRemainsId);
        await updateDoc(crRef, { credits_remaining: user.credits_remaining - 1 });
        // Add booking
        const booking = {
          Status: 'Booked',
          booked_time: new Date(),
          classid: classid,
          credit_deducted_from: user.creditRemainsId || '',
          credit_used: 1,
          date: classData.start_date_time && classData.start_date_time.toDate ? classData.start_date_time.toDate().toISOString().slice(0,10) : '',
          paymentId: '', // Fill if you have payment logic
          price: classData.price || 0,
          time: classData.start_date_time && classData.start_date_time.toDate ? classData.start_date_time.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
          title: classData.title || '',
          type: classData.type || '',
        };
        await setDoc(doc(collection(db, 'users', user.id, 'bookings')), booking);
      }
      closeSidebar();
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar for adding students - overlay moved above Navbar to cover everything */}
      {showSidebar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-gray-300/50 transition-opacity"
          style={{ transition: 'opacity 0.2s', opacity: sidebarVisible ? 1 : 0 }}
          onClick={closeSidebar}
        >
          <div
            className={`bg-white w-full max-w-md h-full shadow-xl p-6 flex flex-col relative transition-all duration-200 ${sidebarVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
            style={{ pointerEvents: sidebarVisible ? 'auto' : 'none' }}
            onClick={e => e.stopPropagation()}
          >
            <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={closeSidebar}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold mb-4">Add Student to {sidebarMode === 'waiting' ? 'Waiting List' : 'Booked Students'}</h3>
            <input
              type="text"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4 w-full"
              placeholder="Search by name..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
            <div className="mb-4 max-h-48 overflow-y-auto">
              {userOptions.length === 0 ? (
                <div className="text-gray-400 text-sm">No users found.</div>
              ) : (
                userOptions.map(u => (
                  <div key={u.id} className="flex items-center justify-between py-2 px-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => setSelectedUsers([...selectedUsers, u])}>
                    <span>{u.full_name || u.name || '-'}</span>
                    <span className="text-xs text-gray-500">{u.email}</span>
                  </div>
                )))
              }
            </div>
            <div className="mb-4">
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(u => (
                    <span key={u.id} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                      {u.full_name || u.name || '-'}
                      <button className="ml-1 text-blue-700 hover:text-blue-900" onClick={() => setSelectedUsers(selectedUsers.filter(su => su.id !== u.id))}>&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              disabled={adding || selectedUsers.length === 0}
              onClick={() => setShowConfirm(true)}
            >
              {adding ? 'Adding...' : 'Add Selected'}
            </button>
          </div>
        </div>
      )}
      <Navbar />
      <main className="flex-1 p-6 md:p-8 md:ml-64">
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4 mb-1">
            <h1 className="text-2xl font-semibold text-gray-800">Assign Students to: {classTitle}</h1>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-2">Manage the students assigned to this class. You can add students to the waiting list or directly to the booked list if there are available slots.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Waiting List Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Waiting List</h2>
              <button onClick={() => openSidebar('waiting')} className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Add Student</button>
            </div>
            <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3">Full Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Booking ID</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {waitingList.length === 0 ? (
                    <tr><td className="px-6 py-3 text-gray-400" colSpan={4}>No students in waiting list.</td></tr>
                  ) : (
                    waitingList.map(w => (
                      <tr key={w.id}>
                        <td className="px-6 py-3">{w.fullname}</td>
                        <td className="px-6 py-3">{w.email || '-'}</td>
                        <td className="px-6 py-3">{w.fromBooking ? w.id.replace('_booking_waiting', '') : '-'}</td>
                        <td className="px-6 py-3">
                          {/* You can add a remove-from-waiting-list action here if needed */}
                        </td>
                      </tr>
                    )))
                  }
                </tbody>
              </table>
            </div>
          </div>
          {/* Booked Students Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-semibold">Booked Students</h2>
                <div className="text-sm text-gray-600 mt-1">{bookedStudents.length} / {slot} booked</div>
              </div>
              <button onClick={() => openSidebar('booked')} className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Add Student</button>
            </div>
            <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3">Full Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Booking ID</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookedStudents.length === 0 ? (
                    <tr><td className="px-6 py-3 text-gray-400" colSpan={4}>No students booked for this class.</td></tr>
                  ) : (
                    bookedStudents.map(s => (
                      <tr key={s.bookingId}>
                        <td className="px-6 py-3">{s.full_name || s.name || '-'}</td>
                        <td className="px-6 py-3">{s.email || '-'}</td>
                        <td className="px-6 py-3">{s.bookingId}</td>
                        <td className="px-6 py-3">
                          <button
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() => navigate(`/admin/user/${s.userId}?highlightBooking=${s.bookingId}`)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    )))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Confirmation Popup */}
        <ConfirmPopup
          open={showConfirm}
          title={`Add to ${sidebarMode === 'waiting' ? 'Waiting List' : 'Booked Students'}?`}
          message={`Are you sure you want to add the selected user(s) to the ${sidebarMode === 'waiting' ? 'waiting list' : 'booked students'}?`}
          onCancel={() => setShowConfirm(false)}
          onConfirm={sidebarMode === 'waiting' ? handleAddToWaitingListConfirmed : handleAddToBookedConfirmed}
        />
      </main>
    </div>
  );
}
