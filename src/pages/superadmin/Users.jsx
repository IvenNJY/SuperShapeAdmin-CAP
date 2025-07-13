import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../../backend/firebaseConfig";
import Navbar from "./Navbar";
import { useNavigate } from "react-router";
import ConfirmPopup from "../../components/ConfirmPopup";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showAddSidebar, setShowAddSidebar] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "admin", // Only allow admin
    phone: "",
    dob: "",
  });
  const [addUserError, setAddUserError] = useState("");
  const [addUserSaving, setAddUserSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sidebarFadeOut, setSidebarFadeOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUsers();
  }, []);

  // Only show admin users
  const filteredUsers = users.filter(user => (user.role || "").toLowerCase() === "admin")
    .filter(user => {
      const name = (user.full_name || user.name || "").toLowerCase();
      return name.includes(search.toLowerCase());
    });

  // Add Admin Handlers
  const openAddSidebar = () => {
    setAddUserForm({
      full_name: "",
      email: "",
      password: "",
      role: "admin",
      phone: "",
      dob: "",
    });
    setAddUserError("");
    setSidebarFadeOut(false);
    setShowAddSidebar(true);
  };
  const closeAddSidebar = () => {
    setSidebarFadeOut(true);
    setTimeout(() => {
      setShowAddSidebar(false);
      setSidebarFadeOut(false);
    }, 300); // match animation duration
  };

  const handleAddUserChange = (e) => {
    const { name, value } = e.target;
    setAddUserForm(f => ({ ...f, [name]: value }));
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    setAddUserError("");
    setShowConfirm(true); // Show confirmation popup before adding
  };

  const handleConfirmAddUser = async () => {
    setAddUserSaving(true);
    try {
      // Prepare user info without password
      const { password, ...userInfo } = {
        ...addUserForm,
        role: "admin", // enforce admin
        created_at: new Date().toISOString(),
      };
      // Check for duplicate email
      if (users.some(u => (u.email || "").toLowerCase() === userInfo.email.toLowerCase())) {
        setAddUserError("A user with this email already exists.");
        setAddUserSaving(false);
        setShowConfirm(false);
        return;
      }
      // Create user in Firebase Auth using REST API (no session/token saved)
      const apiKey = db.app.options.apiKey;
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userInfo.email, password: addUserForm.password, returnSecureToken: false })
      });
      const data = await res.json();
      if (!res.ok || !data.localId) {
        setAddUserError(data.error?.message || 'Failed to add admin.');
        setAddUserSaving(false);
        setShowConfirm(false);
        return;
      }
      const uid = data.localId;
      // Add to Firestore with the same uid as doc id, but do NOT save password
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "users", uid), { ...userInfo, uid });
      setShowAddSidebar(false);
      setAddUserSaving(false);
      setShowConfirm(false);
      window.location.reload();
    } catch (err) {
      setAddUserError("Failed to add admin: " + (err.message || err));
      setAddUserSaving(false);
      setShowConfirm(false);
    }
  };

  // Validation for required fields
  const isFullNameEmpty = addUserForm.full_name.trim() === "";
  const isEmailEmpty = addUserForm.email.trim() === "";
  const isPasswordEmpty = addUserForm.password.trim() === "";
  const isFormInvalid = isFullNameEmpty || isEmailEmpty || isPasswordEmpty;

  return (
    <>
      <Navbar />
      <div className="flex flex-row bg-gray-100 text-sm text-gray-800 min-h-screen">
        <div className="block w-64" />
        <main className="flex-1 p-2 sm:p-4 md:p-8 space-y-4 sm:space-y-6 ">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Admin Users</h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                List of admin users in the system
              </p>
            </div>
            <button
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700"
              onClick={openAddSidebar}
            >
              + Add Admin
            </button>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
            <div className="flex-1 flex items-center gap-x-2">
              <input
                type="text"
                className="py-2 px-3 block w-full border border-gray-300 bg-white rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Search by Name"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      No admin users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.uid || user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {user.full_name || user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {user.phone || user.phoneNo || user.contact || user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          onClick={() => navigate(`/superadmin/user/${user.uid || user.id}`)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  )))
                }
              </tbody>
            </table>
          </div>
          {/* Add Admin Sidebar (slide-in from right, fade-in, overlay) */}
          {showAddSidebar && (
            <>
              {/* Overlay - fade in/out */}
              <div
                className={`fixed inset-0 z-[100] bg-gray-300/50 m-0 ${sidebarFadeOut ? 'animate-fadeOutBg' : 'animate-fadeInBg'}`}
                style={{ opacity: sidebarFadeOut ? 0 : 1, transition: 'opacity 0.3s cubic-bezier(0.4,0,0.2,1)' }}
                onClick={closeAddSidebar}
              />
              {/* Sidebar - fade in/out */}
              <div
                className={`fixed top-0 right-0 z-[110] h-full w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col p-6 ${sidebarFadeOut ? 'animate-fadeOutSidebar' : 'animate-fadeInSidebar'}`}
                style={{ borderTopLeftRadius: '1rem', borderBottomLeftRadius: '1rem' }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  onClick={closeAddSidebar}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h2 className="text-lg font-semibold mb-4">Add Admin</h2>
                <form onSubmit={handleAddUserSubmit} className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={addUserForm.full_name}
                      onChange={handleAddUserChange}
                      className="form-input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    {isFullNameEmpty && <div className="text-red-500 text-xs mt-1">Full name is required.</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={addUserForm.email}
                      onChange={handleAddUserChange}
                      className="form-input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    {isEmailEmpty && <div className="text-red-500 text-xs mt-1">Email is required.</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={addUserForm.password}
                      onChange={handleAddUserChange}
                      className="form-input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    {isPasswordEmpty && <div className="text-red-500 text-xs mt-1">Password is required.</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={addUserForm.phone}
                      onChange={handleAddUserChange}
                      className="form-input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={addUserForm.dob}
                      onChange={handleAddUserChange}
                      className="form-input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input
                      type="text"
                      name="role"
                      value="admin"
                      readOnly
                      className="form-input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  {addUserError && <div className="text-red-500 text-sm">{addUserError}</div>}
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      className="py-2 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      onClick={closeAddSidebar}
                      disabled={addUserSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`py-2 px-4 rounded-lg border border-transparent ${isFormInvalid || addUserSaving ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      disabled={isFormInvalid || addUserSaving}
                    >
                      {addUserSaving ? "Adding..." : "Add Admin"}
                    </button>
                  </div>
                </form>
              </div>
              {/* Custom fade-in/fade-out keyframes */}
              <style>{`
                @keyframes fadeInSidebar {
                  from { opacity: 0; transform: translateX(100%); }
                  to { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeOutSidebar {
                  from { opacity: 1; transform: translateX(0); }
                  to { opacity: 0; transform: translateX(100%); }
                }
                .animate-fadeInSidebar {
                  animation: fadeInSidebar 0.3s cubic-bezier(0.4,0,0.2,1);
                }
                .animate-fadeOutSidebar {
                  animation: fadeOutSidebar 0.3s cubic-bezier(0.4,0,0.2,1);
                }
              `}</style>
            </>
          )}
          {/* Confirmation Popup for Add Admin */}
          <ConfirmPopup
            open={showConfirm}
            title="Add Admin"
            message={`Are you sure you want to add this admin?`}
            onConfirm={handleConfirmAddUser}
            onCancel={() => setShowConfirm(false)}
            confirmText="Add"
            cancelText="Cancel"
          />
        </main>
      </div>
    </>
  );
}
