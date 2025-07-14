import React, { useEffect, useState } from "react";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { db } from "../../../backend/firebaseConfig";
import { useNavigate } from "react-router";
import Navbar from "./Navbar";
import ConfirmPopup from "../../components/ConfirmPopup";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeApp, getApp, deleteApp } from "firebase/app";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Limiter for rows
  const [showAddSidebar, setShowAddSidebar] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "student",
    phone: "",
    dob: "",
    declaration_accepted: false,
    declaration_pdf_url: "",
    terms_accepted: false,
    signed_at: new Date().toISOString(),
  });
  const [addUserError, setAddUserError] = useState("");
  const [addUserSaving, setAddUserSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUsers();
  }, []);

  // Filtering
  const filteredUsers = users
    .filter(user => {
      // Disallow admin and superadmin
      const role = (user.role || "").toLowerCase();
      return role !== "admin" && role !== "superadmin";
    })
    .filter(user => {
      const name = (user.full_name || user.name || "").toLowerCase();
      const role = (user.role || "").toLowerCase();
      const searchMatch = name.includes(search.toLowerCase());
      const roleMatch = roleFilter ? role === roleFilter.toLowerCase() : true;
      return searchMatch && roleMatch;
    });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function getRoleClass(role) {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "instructor":
        return "bg-green-100 text-green-800";
      case "student":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // Sidebar open/close handlers
  const openAddSidebar = () => {
    setShowAddSidebar(true);
    setFadeOut(false);
  };
  const closeAddSidebar = () => {
    setFadeOut(true);
    setTimeout(() => {
      setShowAddSidebar(false);
      setFadeOut(false);
    }, 300); // match fade duration
  };

  // Form change handler
  const handleAddUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddUserForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Form submit handler (placeholder, replace with Cloud Function call for production)
  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmAddUser = async () => {
    setShowConfirm(false);
    setAddUserError("");
    setAddUserSaving(true);

    const secondaryAppName = "userCreation";
    let secondaryApp;
    try {
      secondaryApp = initializeApp(getApp().options, secondaryAppName);
    } catch {
      secondaryApp = getApp(secondaryAppName);
    }
    
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // Create user in Firebase Authentication using the secondary app
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        addUserForm.email,
        addUserForm.password
      );
      const user = userCredential.user;

      // Now, add user data to Firestore with the UID from Auth
      const userData = {
        uid: user.uid,
        full_name: addUserForm.full_name,
        email: addUserForm.email,
        phone: addUserForm.phone,
        dob: addUserForm.dob,
        role: addUserForm.role,
        declaration_accepted: addUserForm.declaration_accepted,
        declaration_pdf_url: addUserForm.declaration_pdf_url,
        terms_accepted: addUserForm.terms_accepted,
        signed_at: addUserForm.signed_at,
        ...(addUserForm.role === 'instructor' && {
          photo_url: 'https://firebasestorage.googleapis.com/v0/b/supershape-wellness-apps.firebasestorage.app/o/users%2FDefaultAvatar.png?alt=media&token=26226a19-87cb-4027-80c2-421b613e9853',
          coverPhoto_url: 'https://firebasestorage.googleapis.com/v0/b/supershape-wellness-apps.firebasestorage.app/o/users%2Fapp_logo.png?alt=media&token=b919e392-95e7-4944-9f7b-df202d6775ab'
        })
      };
      await setDoc(doc(db, "users", user.uid), userData);
      setAddUserSaving(false);
      closeAddSidebar();
      setAddUserForm({
        full_name: "",
        email: "",
        password: "",
        role: "student",
        phone: "",
        dob: "",
        declaration_accepted: false,
        declaration_pdf_url: "",
        terms_accepted: false,
        signed_at: new Date().toISOString(),
      });
      // Optionally, refresh user list
      const querySnapshot = await getDocs(collection(db, "users"));
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setAddUserError(err.message || "Failed to add user.");
      setAddUserSaving(false);
    } finally {
      // Clean up the secondary app
      if (secondaryApp) {
        deleteApp(secondaryApp);
      }
    }
  };

  return (
    <>
          {/* Navbar */}
      <Navbar className="w-70" />

    <div className="flex flex-row bg-gray-100 text-sm text-gray-800 min-h-screen">
                {/* Sidebar placeholder */}
                <div className="block w-64" />
      {/* Main Content */}
      <main className="flex-1 p-2 sm:p-4 md:p-8 space-y-4 sm:space-y-6 ">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">User Management</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Students assigned by instructors pending approval to be added into classes
            </p>
          </div>
          <button
            type="button"
            className="w-full sm:w-auto py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700"
            onClick={openAddSidebar}
          >
            + Add User
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
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
              value={roleFilter}
              onChange={e => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Roles</option>
              <option value="Student">Student</option>
              <option value="Instructor">Instructor</option>
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

        {/* Users Table - Grouped by Instructor and Student */}
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Group instructors first, then students, no group header rows */}
              {(() => {
                const instructors = paginatedUsers.filter(u => (u.role || '').toLowerCase() === 'instructor');
                const students = paginatedUsers.filter(u => (u.role || '').toLowerCase() === 'student');
                const allGrouped = [...instructors, ...students];
                if (allGrouped.length === 0) {
                  return (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        No users found.
                      </td>
                    </tr>
                  );
                }
                return allGrouped.map(user => (
                  <tr key={user.uid || user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {user.full_name || user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {user.phone || user.phoneNo || user.contact || user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        onClick={() => navigate(`/admin/user/${user.uid || user.id}`)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </main>
    </div>
    {showAddSidebar && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-end ${fadeOut ? "animate-fadeOut" : "animate-fadeIn"}`}> {/* z-[100] ensures overlay is above navbar */}
          {/* Overlay covers entire viewport, including above navbar */}
          <div className="fixed inset-0 bg-gray-300" style={{ opacity: 0.5 }} onClick={closeAddSidebar}></div>
          <div className={`relative bg-white w-full max-w-md h-full shadow-2xl rounded-l-2xl transform transition-all duration-300 ${fadeOut ? "animate-slideOutRight" : "animate-slideInRight"} flex flex-col z-[110]`}>
            <div className="flex justify-between items-center p-6">
              <h2 className="text-lg font-semibold">Add User</h2>
              <button className="text-gray-500 hover:text-gray-700 text-2xl font-bold" onClick={closeAddSidebar}>&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1" style={{ maxHeight: "calc(100vh - 64px)" }}>
              <form className="space-y-6" onSubmit={handleAddUserSubmit}>
                <input type="text" name="full_name" value={addUserForm.full_name} onChange={handleAddUserChange} required placeholder="Full Name" className="py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm" />
                <input type="email" name="email" value={addUserForm.email} onChange={handleAddUserChange} required placeholder="Email" className="py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm" />
                <input type="password" name="password" value={addUserForm.password} onChange={handleAddUserChange} required minLength={6} placeholder="Password" className="py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm" />
                <select name="role" value={addUserForm.role} onChange={handleAddUserChange} className="py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm">
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  {/* <option value="admin">Admin</option> */}
                </select>
                <input type="text" name="phone" value={addUserForm.phone} onChange={handleAddUserChange} placeholder="Phone" className="py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm" />
                <input type="date" name="dob" value={addUserForm.dob} onChange={handleAddUserChange} className="py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm" />
                {/* Hidden fields for declaration, terms, etc. */}
                <input type="hidden" name="declaration_accepted" value={addUserForm.declaration_accepted} />
                <input type="hidden" name="declaration_pdf_url" value={addUserForm.declaration_pdf_url} />
                <input type="hidden" name="terms_accepted" value={addUserForm.terms_accepted} />
                <input type="hidden" name="signed_at" value={addUserForm.signed_at} />
                {addUserError && <p className="text-red-600 text-sm">{addUserError}</p>}
                <div className="flex justify-end">
                  <button type="submit" className="py-2 px-6 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-500 text-white hover:bg-blue-600" disabled={addUserSaving}>
                    {addUserSaving ? "Adding..." : "Add User"}
                  </button>
                </div>
              </form>
            </div>
            <style>{`
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              .animate-fadeIn { animation: fadeIn 0.3s; }
              @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
              .animate-fadeOut { animation: fadeOut 0.3s; }
              @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
              .animate-slideInRight { animation: slideInRight 0.3s; }
              @keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
              .animate-slideOutRight { animation: slideOutRight 0.3s; }
            `}</style>
          </div>
        </div>
      )}
      {/* Confirm Add User Popup */}
      <ConfirmPopup
        open={showConfirm}
        title="Confirm Add User"
        message="Are you sure you want to add this user?"
        onConfirm={handleConfirmAddUser}
        onCancel={() => setShowConfirm(false)}
        confirmText="Add User"
        cancelText="Cancel"
        color="blue"
      />
    </>
  );
}