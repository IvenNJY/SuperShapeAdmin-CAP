import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../backend/firebaseConfig";
import Navbar from "./Navbar";
import ConfirmPopup from "../../components/ConfirmPopup";

export default function UserDetails() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() });
          setForm(userDoc.data());
        } else {
          setError("User not found");
        }
      } catch (err) {
        setError("Failed to fetch user" + err.message);
      }
    };
    if (uid) fetchUser();
  }, [uid]);

  const handleEdit = () => setEditMode(true);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", uid), form);
      setUser(u => ({ ...u, ...form }));
      setEditMode(false);
      setShowSaveConfirm(false);
    } catch (err) {
      setError("Failed to save changes" + err.message);
    }
    setSaving(false);
  };

  const handleDeleteUser = async () => {
    try {
      await deleteDoc(doc(db, "users", uid));
      setShowDeleteConfirm(false);
      navigate("/superadmin/users");
    } catch (err) {
      setError("Failed to delete user" + err.message);
    }
  };

  // Validation for required fields
  const isFullNameEmpty = (form.full_name || "").trim() === "";
  const isEmailEmpty = (form.email || "").trim() === "";
  const isFormInvalid = isFullNameEmpty || isEmailEmpty;

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Navbar />
        <div className="text-red-500 font-semibold mt-8">{error}</div>
      </div>
    );
  if (!user)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Navbar />
        <div className="text-gray-500 mt-8">Loading user details...</div>
      </div>
    );

  return (
    <>
      <Navbar />
      <div className="flex flex-row bg-gray-100 text-sm text-gray-800 min-h-screen">
        <div className="block w-64" />
        <main className="flex-1 p-2 sm:p-4 md:p-8 space-y-4 sm:space-y-6 ">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">User Details</h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                View and edit user information
              </p>
            </div>
            {/* Buttons on the right of the title */}
            <div className="flex gap-2 mt-2 sm:mt-0">
              {editMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSaveConfirm(true)}
                    className={
                      "py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent " +
                      ((isFormInvalid || saving)
                        ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600")
                    }
                    disabled={isFormInvalid || saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(-1)} // Go back
                    className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete User
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name || ""}
                  onChange={handleChange}
                  readOnly={!editMode}
                  className={
                    "py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 " +
                    (editMode
                      ? "bg-white text-gray-800"
                      : "bg-gray-50 text-gray-500 cursor-not-allowed")
                  }
                />
                {editMode && isFullNameEmpty && <div className="text-red-500 text-xs mt-1">Full name is required.</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email || ""}
                  onChange={handleChange}
                  readOnly={true}
                  disabled={true}
                  className={
                    "py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                  }
                />
                {editMode && isEmailEmpty && <div className="text-red-500 text-xs mt-1">Email is required.</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone || ""}
                  onChange={handleChange}
                  readOnly={!editMode}
                  className={
                    "py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 " +
                    (editMode
                      ? "bg-white text-gray-800"
                      : "bg-gray-50 text-gray-500 cursor-not-allowed")
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={form.role || ""}
                  onChange={handleChange}
                  disabled={true}
                  className={
                    "py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
            </div>
          </div>
          <ConfirmPopup
            open={showSaveConfirm}
            title="Confirm Save"
            message="Are you sure you want to save changes to this user?"
            onConfirm={handleSave}
            onCancel={() => setShowSaveConfirm(false)}
            confirmText="Save"
            cancelText="Cancel"
            color="blue"
            disabled={isFormInvalid || saving}
          />
        </main>
      </div>
      <ConfirmPopup
        open={showCancelConfirm}
        title="Cancel Edit"
        message="Are you sure you want to cancel editing? Unsaved changes will be lost."
        onConfirm={() => {
          setEditMode(false);
          setForm(user);
          setShowCancelConfirm(false);
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />
      <ConfirmPopup
        open={showDeleteConfirm}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={handleDeleteUser}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
