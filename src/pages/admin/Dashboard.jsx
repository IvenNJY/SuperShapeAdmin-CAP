import React, { useEffect, useState } from 'react';
import Navbar from "./Navbar";
import { Link } from 'react-router'; // Fixed import
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../../backend/firebaseConfig';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement, // Needed for Doughnut charts
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [instructorCount, setInstructorCount] = useState(0);
  const [totalPackages, setTotalPackages] = useState(0);
  const [paymentStatusCounts, setPaymentStatusCounts] = useState({ Pending: 0, Approved: 0, Rejected: 0 });
  const [classStatusCounts, setClassStatusCounts] = useState({ Ended: 0, Active: 0, Upcoming: 0 });
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state
  const [userFullName, setUserFullName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Pending Payments (from Credits.jsx logic)
        const paymentsQuery = query(
          collection(db, "Payment"),
          where("Status", "==", "Pending"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const pendingPaymentsRaw = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch user and package info for pending payments
        const userIds = Array.from(new Set(pendingPaymentsRaw.map(p => p.userId || p.uid || p.UserID || p.userid).filter(Boolean)));
        const packageIds = Array.from(new Set(pendingPaymentsRaw.map(p => p.PackageID || p.packageId || p.packageID).filter(Boolean)));
        // Fetch users
        let userMap = {};
        if (userIds.length > 0) {
          const usersSnapshot = await getDocs(collection(db, "users"));
          usersSnapshot.docs.forEach(doc => {
            const d = doc.data();
            userMap[doc.id] = d.full_name || d.name || d.email || doc.id;
            if (d.uid) userMap[d.uid] = d.full_name || d.name || d.email || d.uid;
          });
        }
        // Fetch packages
        let packageMap = {};
        if (packageIds.length > 0) {
          const packagesSnapshot = await getDocs(collection(db, "Credit_Packages"));
          packagesSnapshot.docs.forEach(doc => {
            const d = doc.data();
            packageMap[doc.id] = d.title || d.name || doc.id;
          });
        }
        // Attach names to pendingPayments
        const pendingPayments = pendingPaymentsRaw.map(p => ({
          ...p,
          userName: userMap[p.userId || p.uid || p.UserID || p.userid] || '-',
          packageTitle: packageMap[p.PackageID || p.packageId || p.packageID] || '-',
        }));
        setPendingPayments(pendingPayments);

        // All Payments for status graph
        const allPaymentsSnapshot = await getDocs(collection(db, "Payment"));
        const statusCounts = { Pending: 0, Approved: 0, Rejected: 0 };
        allPaymentsSnapshot.docs.forEach(doc => {
          const status = (doc.data().Status || '').toString();
          if (statusCounts[status] !== undefined) statusCounts[status]++;
        });
        setPaymentStatusCounts(statusCounts);

        // Users (from Users.jsx logic)
        const usersSnapshot = await getDocs(collection(db, "users"));
        setTotalUsers(usersSnapshot.size);
        setStudentCount(usersSnapshot.docs.filter(u => (u.data().role || '').toLowerCase() === 'student').length);
        setInstructorCount(usersSnapshot.docs.filter(u => (u.data().role || '').toLowerCase() === 'instructor').length);

        // Classes (from Classes.jsx logic)
        const classesSnapshot = await getDocs(collection(db, "class"));
        const now = new Date();
        let ended = 0, active = 0, upcoming = 0;
        const upcomingArr = [];
        classesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // Parse start_date_time
          const start = data.start_date_time ? (data.start_date_time.seconds ? new Date(data.start_date_time.seconds * 1000) : new Date(data.start_date_time)) : null;
          // Parse duration (can be number in minutes or string like "2 hour", "90 min")
          let durationMin = 0;
          if (typeof data.duration === 'number') {
            durationMin = data.duration;
          } else if (typeof data.duration === 'string') {
            const match = data.duration.match(/(\d+(?:\.\d+)?)/);
            if (match) {
              let num = parseFloat(match[1]);
              if (/hour|hr/i.test(data.duration)) {
                durationMin = num * 60;
              } else {
                durationMin = num;
              }
            }
          }
          let end = null;
          if (start && durationMin) {
            end = new Date(start.getTime() + durationMin * 60000);
          }
          if (start && end) {
            if (end < now) {
              ended++;
            } else if (start <= now && now < end) {
              active++;
              upcomingArr.push({ id: doc.id, ...data, status: 'Active', start, end, durationMin });
            } else if (start > now) {
              upcoming++;
              upcomingArr.push({ id: doc.id, ...data, status: 'Upcoming', start, end, durationMin });
            }
          } else if (start) {
            if (start > now) {
              upcoming++;
              upcomingArr.push({ id: doc.id, ...data, status: 'Upcoming', start, end: null, durationMin });
            } else {
              ended++;
            }
          } else {
            ended++;
          }
        });
        setClassStatusCounts({ Ended: ended, Active: active, Upcoming: upcoming });
        // Only show next 3 upcoming/active classes
        setUpcomingClasses(upcomingArr.sort((a, b) => {
          const aTime = a.start ? a.start.getTime() : 0;
          const bTime = b.start ? b.start.getTime() : 0;
          return aTime - bTime;
        }).slice(0, 3));

        // Packages (from Packages.jsx logic)
        const packagesSnapshot = await getDocs(collection(db, "Credit_Packages"));
        setTotalPackages(packagesSnapshot.size);

        // Fetch current user's full name
        let currentUser = auth.currentUser;
        if (!currentUser && window.firebase && window.firebase.auth) {
          currentUser = window.firebase.auth().currentUser;
        }
        if (currentUser) {
          const userDocSnap = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)));
          if (!userDocSnap.empty) {
            const userData = userDocSnap.docs[0].data();
            setUserFullName(userData.full_name || "");
          }
        }
      } catch (error) {
        setError(error.message || 'Failed to fetch dashboard data.');
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  function StatusBadge({ status }) {
    // Preline UI badge styles for class status
    let color = 'bg-gray-100 text-gray-800 border-gray-200';
    let label = status;
    if (status === 'Active') color = 'bg-green-100 text-green-800';
    if (status === 'Upcoming') color = 'bg-yellow-100 text-yellow-800';
    if (status === 'Ended') color = 'bg-red-100 text-red-800';
    return (
      <span className={`inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium ${color}`}>{label}</span>
    );
  }

  // Chart.js data for Classes by Status (Doughnut)
  const classStatusData = {
    labels: ['Active', 'Upcoming', 'Ended'],
    datasets: [
      {
        label: 'Classes',
        data: [classStatusCounts.Active, classStatusCounts.Upcoming, classStatusCounts.Ended],
        backgroundColor: [
          '#4DD4A7', // Green for Active
          '#6FA3F8', // Blue for Upcoming
          '#F47A7A', // Red for Ended
        ],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };
  const classStatusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
      title: { display: false },
    },
    cutout: '70%',
  };

  // SVG icons for summary cards
  const icons = {
    users: (
      <svg className="shrink-0 size-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
    students: (
        <svg className="shrink-0 size-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
    ),
    instructors: (
      <svg className="shrink-0 size-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    ),
    packages: (
      <svg className="shrink-0 size-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6"/></svg>
    ),
    payments: (
      <svg className="shrink-0 size-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12" y1="16" y2="16"/></svg>
    ),
     classes: ( // Added classes icon from home.html
      <svg className="shrink-0 size-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0H3" /></svg>
    )
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Main content is now a separate element with margin for the navbar */}
      <main className="md:ml-64 max-w-[100rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-10">
        <h1 className="text-2xl font-semibold mb-2 text-gray-800">Admin Dashboard</h1>
        {userFullName && (
          <p className="text-gray-600 mb-8">Welcome back <b className="font-semibold text-gray-800">{userFullName}</b></p>
        )}
        {loading && (
          <div className="mb-6 text-blue-600 text-center">Loading dashboard data...</div>
        )}
        {error && (
          <div className="mb-6 text-red-600 text-center font-semibold">{error}</div>
        )}
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <SummaryCard title="Total Users" value={totalUsers} icon={icons.users} />
          <SummaryCard title="Total Instructors" value={instructorCount} icon={icons.instructors} />
          <SummaryCard title="Total Students" value={studentCount} icon={icons.students} />
          <SummaryCard title="Total Packages" value={totalPackages} icon={icons.packages} />
          <SummaryCard title="Payment Pending" value={paymentStatusCounts.Pending} icon={icons.payments} />
        </div>

        {/* First Row: Class Status Chart and Pending Payments Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Class Status Overview</h3>
                 <div className="relative w-full h-64">
                    <Doughnut data={classStatusData} options={classStatusOptions} />
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                 <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Recent Pending Payments</h2>
                    <a href="/admin/credits" className="text-blue-600 hover:text-blue-900 text-sm font-medium">View More</a>
                </div>
                <div className="-m-1.5 overflow-x-auto">
                    <div className="p-1.5 min-w-full inline-block align-middle">
                        <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 bg-white">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {pendingPayments.length === 0 ? (
                                  <tr><td className="px-6 py-4 text-center text-gray-500" colSpan={4}>No pending payments.</td></tr>
                                ) : (
                                  pendingPayments.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{p.userName || p.full_name || p.name || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{p.packageTitle || p.PackageID || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">RM{p.amount || p.Amount || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.createdAt ? new Date(p.createdAt.seconds ? p.createdAt.seconds * 1000 : p.createdAt).toLocaleDateString() : '-'}</td>
                                    </tr>
                                  )))}
                              </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Second Row: Upcoming Classes Table */}
        <div className="grid grid-cols-1 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming & Active Classes</h2>
                {upcomingClasses.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No upcoming or active classes.</div>
                ) : (
                    <ul className="space-y-3">
                    {upcomingClasses.map(c => (
                        <li key={c.id} className="border-b last:border-b-0 pb-3 flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-gray-800">{c.title || '-'}</div>
                            <div className="text-sm text-gray-500">{c.start_date_time ? new Date(c.start_date_time.seconds ? c.start_date_time.seconds * 1000 : c.start_date_time).toLocaleString() : '-'}</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <StatusBadge status={c.status} />
                            <a href={`/admin/classes/${c.id}`} className="text-blue-600 hover:underline text-sm font-medium">Details</a>
                        </div>
                        </li>
                    ))}
                    </ul>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ title, value, icon }) {
  return (
    // Matched styling from home.html
    <div className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <a className="block p-4 md:p-5 relative bg-white hover:bg-gray-50" href="#">
            <div className="flex md:flex-col lg:flex-row gap-y-3 gap-x-5">
                {icon}
                <div className="grow">
                    <p className="text-xs uppercase font-medium text-gray-800">{title}</p>
                    <h3 className="mt-1 text-xl sm:text-2xl font-semibold text-blue-600">{value}</h3>
                </div>
            </div>
        </a>
    </div>
  );
}
