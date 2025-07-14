import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import Navbar from "./Navbar";
import { db } from "../../../backend/firebaseConfig";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";

function getStatusClass(status) {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-800";
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function Credits() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setLoading(true);
    const paymentCollection = collection(db, "Payment");
    const unsubscribe = onSnapshot(paymentCollection, async (paymentSnapshot) => {
      const paymentList = await Promise.all(
        paymentSnapshot.docs.map(async (docSnap) => {
          const paymentData = {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate ? docSnap.data().createdAt.toDate().toLocaleString() : docSnap.data().createdAt,
          };
          let fullName = paymentData.userName || paymentData.full_name || "-";
          if (paymentData.userid) {
            try {
              const userRef = doc(db, "users", paymentData.userid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                fullName = userSnap.data().full_name || userSnap.data().name || fullName;
              }
            } catch {
              // ignore user fetch error, fallback to default
            }
          }
          return { ...paymentData, fullName };
        })
      );
      setPayments(paymentList);
      setError(null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtering and Sorting
  const filteredPayments = payments
    .filter(payment => {
      // Status filter
      const status = (payment.Status || "").toLowerCase();
      return statusFilter ? status === statusFilter.toLowerCase() : true;
    })
    .filter(payment => {
      // Search by transaction ID or name
      const id = (payment.id || "").toLowerCase();
      const name = (payment.fullName || "").toLowerCase();
      const searchTerm = search.toLowerCase();
      return id.includes(searchTerm) || name.includes(searchTerm);
    })
    .sort((a, b) => {
      // Sort: Pending first, then by createdAt descending
      if ((a.Status === 'Pending') && (b.Status !== 'Pending')) return -1;
      if ((a.Status !== 'Pending') && (b.Status === 'Pending')) return 1;
      // Fallback: sort by createdAt descending if available
      const aDate = new Date(a.createdAt);
      const bDate = new Date(b.createdAt);
      return bDate - aDate;
    });

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <Navbar />
      <div className="flex">
        <div className="block w-64" />
        <div className="flex-1 bg-gray-100 min-h-screen p-6 md:p-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold mb-2">Credit Management</h1>
            <p className="text-sm text-gray-600">
              Manage all of the Credits and Packages of users from here
            </p>
          </header>
          <div className="mb-6">
           {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 p-4 pb-0">
              <div className="flex-1 flex items-center gap-x-2">
                <input
                  type="text"
                  className="py-2 px-3 block w-full border bg-white rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Search by Name"
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-x-2">
                <select
                  className="py-2 px-3 pr-9 block w-full border bg-white border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={e => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
                {/* Rows controller */}
                <label className="flex items-center gap-x-2 text-sm text-gray-700">
                  <span>Rows:</span>
                  <select
                    className="py-2 px-3 pr-6 block border bg-white border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                    value={itemsPerPage}
                    onChange={e => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{ minWidth: 60 }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </label>
                {/* Pagination */}
                <nav className="flex items-center gap-x-1 ml-2" aria-label="Pagination">
                  <button
                    type="button"
                    className="min-h-9.5 min-w-9.5 py-2 px-2.5 inline-flex justify-center items-center gap-x-2 text-sm rounded-lg text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
                    aria-label="Previous"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <svg className="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6"></path>
                    </svg>
                    <span className="sr-only">Previous</span>
                  </button>
                  <div className="flex items-center gap-x-1">
                    <span className="bg-white min-h-9.5 min-w-9.5 flex justify-center items-center border border-gray-200 text-gray-800 py-2 px-3 text-sm rounded-lg focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none">
                      {totalPages === 0 ? 0 : currentPage}
                    </span>
                    <span className="min-h-9.5 flex justify-center items-center text-gray-500 py-2 px-1.5 text-sm">of</span>
                    <span className="min-h-9.5 flex justify-center items-center text-gray-500 py-2 px-1.5 text-sm">
                      {totalPages}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="min-h-9.5 min-w-9.5 py-2 px-2.5 inline-flex justify-center items-center gap-x-2 text-sm rounded-lg text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
                    aria-label="Next"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </button>
                </nav>
                {/* End Pagination */}
              </div>
            </div>
            {/* End Filters and Search */}
          </div>
          <div className="bg-white shadow overflow-x-auto rounded-lg">
           
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                   <tr>
                    <td colSpan={5} className="text-center py-4 text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className={`
                        ${payment.Status === 'Pending'
                          ? 'bg-yellow-50 border-l-4 border-yellow-400 group'
                          : 'hover:bg-gray-50'}
                        ${payment.Status === 'Pending' ? 'transition-colors' : ''}
                      `}
                      onMouseEnter={e => {
                        if (payment.Status === 'Pending') e.currentTarget.classList.add('!bg-yellow-100');
                      }}
                      onMouseLeave={e => {
                        if (payment.Status === 'Pending') e.currentTarget.classList.remove('!bg-yellow-100');
                      }}
                    >
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 font-medium flex items-center gap-2">
                        {payment.fullName}
                        {payment.Status === 'Pending' && (
                          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" title="Pending"></span>
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                            payment.Status
                          )}`}
                        >
                          {payment.Status}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        RM {payment.amount}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.createdAt}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/admin/credits/${payment.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
