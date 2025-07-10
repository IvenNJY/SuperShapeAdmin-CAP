import { doc, getDoc, updateDoc, deleteDoc, increment } from "firebase/firestore";
import { db, auth } from "../../../backend/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import ConfirmPopup from "../../components/ConfirmPopup";
import Navbar from "./Navbar";
import React, { useEffect, useState } from "react";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import ViewMoreModal from "../../components/ViewMoreModal";
import { useLocation, useNavigate, useParams } from "react-router";

const pingStyle = `
  .ping-outer {
    position: absolute;
    left: -12px;
    top: -12px;
    width: calc(100% + 24px);
    height: calc(100% + 24px);
    pointer-events: none;
    z-index: 1;
  }
  .ping-outer .ping {
    position: absolute;
    left: 0; top: 0; right: 0; bottom: 0;
    border-radius: 0.75rem;
    border: 3px solid #3b82f6;
    opacity: 0.7;
    animation: ping-glow 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  @keyframes ping-glow {
    0% { transform: scale(1); opacity: 0.7; }
    60% { transform: scale(1.25); opacity: 0.2; }
    100% { transform: scale(1.4); opacity: 0; }
  }
`;

export default function UserDetails() {
  const { uid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showDeclaration, setShowDeclaration] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [creditRemains, setCreditRemains] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showCreditRemainsModal, setShowCreditRemainsModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  // Add state for editing bookings and credits
  const [editingBookings, setEditingBookings] = useState(false);
  const [editingCredits, setEditingCredits] = useState(false);
  const [editedBookings, setEditedBookings] = useState([]);
  const [editedCreditRemains, setEditedCreditRemains] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!uid || typeof uid !== "string" || uid.trim() === "") {
        setError("No user ID provided (param: " + String(uid) + ").");
        return;
      }
      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser(docSnap.data());
          setForm(docSnap.data());
          setError(""); // clear error if previously set
        } else {
          setError("User not found.");
        }
      } catch (err) {
        setError("Failed to fetch user.");
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, [uid]);

  useEffect(() => {
    // Fetch email for this UID from authentication (requires backend endpoint)
    async function fetchAuthEmail() {
      try {
        const res = await fetch(`/api/getUserEmailById?uid=${uid}`);
        if (res.ok) {
          const data = await res.json();
          setAuthEmail(data.email || "");
          setForm(f => ({ ...f, email: data.email || "" })); // Always set form.email from auth
        }
      } catch {
        // fallback: do nothing
      }
    }
    if (uid) fetchAuthEmail();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    // Fetch Credit_Remains
    const fetchCreditRemains = async () => {
      try {
        const colRef = collection(db, "users", uid, "Credit_Remains");
        const snap = await getDocs(colRef);
        setCreditRemains(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch {
        // ignore for now
      }
    };
    // Fetch bookings
    const fetchBookings = async () => {
      try {
        const colRef = collection(db, "users", uid, "bookings");
        const snap = await getDocs(colRef);
        setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch {
        // ignore for now
      }
    };
    fetchCreditRemains();
    fetchBookings();
  }, [uid]);

  useEffect(() => {
    setEditedBookings(bookings);
    setEditedCreditRemains(creditRemains);
  }, [bookings, creditRemains]);

  const handleEdit = () => setEditMode(true);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Helper to upload or overwrite image in Firebase Storage
  const uploadImage = async (file, path, existingUrl) => {
    if (!file) return existingUrl || "";
    const storage = getStorage();
    let fileRef;
    if (existingUrl) {
      // Overwrite existing file by extracting the path from the URL
      const match = decodeURIComponent(existingUrl).match(/\/o\/(.+)\?/);
      const existingPath = match ? match[1] : path;
      fileRef = storageRef(storage, existingPath);
    } else {
      fileRef = storageRef(storage, path);
    }
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleProfileImageChange = e => {
    if (e.target.files && e.target.files[0]) {
      setProfileImageFile(e.target.files[0]);
      setForm(f => ({ ...f, photo_url: URL.createObjectURL(e.target.files[0]) }));
    }
  };

  const handleCoverImageChange = e => {
    if (e.target.files && e.target.files[0]) {
      setCoverImageFile(e.target.files[0]);
      setForm(f => ({ ...f, coverPhoto_url: URL.createObjectURL(e.target.files[0]) }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let photo_url = form.photo_url || "";
      let coverPhoto_url = form.coverPhoto_url || "";

      // Upload/overwrite profile image if changed or added
      if (profileImageFile) {
        photo_url = await uploadImage(
          profileImageFile,
          `users/${uid}_profile.jpg`,
          user.photo_url
        );
      }
      // Upload/overwrite cover image if changed or added
      if (coverImageFile) {
        coverPhoto_url = await uploadImage(
          coverImageFile,
          `users/${uid}_cover.jpg`,
          user.coverPhoto_url
        );
      }
      const docRef = doc(db, "users", uid);
      const updateFields = {
        full_name: form.full_name || form.name || "",
        phone: form.phone || form.phoneNo || "",
        email: form.email || "",
        dob: form.dob || "",
        role: form.role || "",
        bio: form.bio || "",
        certifications: form.certifications || [],
        classType: form.classType || [],
        experienceYears: form.experienceYears !== undefined && form.experienceYears !== null && form.experienceYears !== ""
          ? (typeof form.experienceYears === 'number' ? form.experienceYears : Number(form.experienceYears))
          : "",
        photo_url,
        coverPhoto_url,
      };
      if (form.role === "student") {
        updateFields.declaration_pdf_url = form.declaration_pdf_url || "";
      }
      await updateDoc(docRef, updateFields);
      setUser({ ...user, ...updateFields });
      setEditMode(false);
      setProfileImageFile(null);
      setCoverImageFile(null);
    } catch (err) {
      setError("Failed to save user.");
      console.error("Failed to save user:", err);
    }
    setSaving(false);
  };

  const handleDeleteUser = async () => {
    try {
      // NOTE: This only deletes the Firestore document.
      // For a full deletion, you must also delete the user from Firebase Auth.
      // This typically requires a backend function (e.g., Cloud Function)
      // that can be called from the client to perform the deletion securely.
      const docRef = doc(db, "users", uid);
      await deleteDoc(docRef);
      navigate("/admin/users"); // Redirect after deletion
    } catch (err) {
      setError("Failed to delete user.");
      console.error("Failed to delete user:", err);
    }
  };

  // Remove booking handler
  const handleRemoveBooking = async (bookingId, creditDeductedFrom, creditUsed) => {
    try {
      // Get the booking document first to retrieve classid
      const bookingDocRef = doc(db, "users", uid, "bookings", bookingId);
      const bookingDocSnap = await getDoc(bookingDocRef);
      let classid = null;
      if (bookingDocSnap.exists()) {
        classid = bookingDocSnap.data().classid;
      }
      // Remove booking from Firestore
      await deleteDoc(bookingDocRef);
      // Refund credits to the correct Credit_Remains doc
      if (creditDeductedFrom) {
        const creditDocRef = doc(db, "users", uid, "Credit_Remains", creditDeductedFrom);
        const creditDocSnap = await getDoc(creditDocRef);
        if (creditDocSnap.exists()) {
          const current = creditDocSnap.data().credits_remaining || 0;
          await updateDoc(creditDocRef, { credits_remaining: current + (creditUsed || 1) });
        }
      }
      // Decrement 'booked' in class document if classid exists
      if (classid) {
        const classDocRef = doc(db, "class", classid);
        await updateDoc(classDocRef, { booked: increment(-1) });
      }
      // Refresh bookings and credits
      const snap = await getDocs(collection(db, "users", uid, "bookings"));
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const creditSnap = await getDocs(collection(db, "users", uid, "Credit_Remains"));
      setCreditRemains(creditSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setError("Failed to remove booking and refund credit.");
    }
  };

  // Edit credits handler
  const handleEditCredit = async (creditId, newAmount) => {
    try {
      const creditDocRef = doc(db, "users", uid, "Credit_Remains", creditId);
      await updateDoc(creditDocRef, { credits_remaining: newAmount });
      // Refresh credits
      const creditSnap = await getDocs(collection(db, "users", uid, "Credit_Remains"));
      setCreditRemains(creditSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setError("Failed to update credit amount.");
    }
  };

  // Get highlightBooking param from URL
  const highlightBooking = new URLSearchParams(location.search).get("highlightBooking");

  useEffect(() => {
    if (highlightBooking) {
      setTimeout(() => {
        const el = document.getElementById(`booking-${highlightBooking}`) || document.getElementById(`booking-modal-${highlightBooking}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [highlightBooking, bookings]);

  if (error) return <div className="text-red-600 p-4">{error}</div>;
  if (!user) return <div>Loading...</div>;

  // Dummy data for class history and credits (replace with real data if available)
  const classHistory = user.classHistory || [];
  const creditHistory = user.creditHistory || [];

  // Glowing ping effect for highlighted booking
  const pingGlow = (
    <style>{`
      .ping-glow {
        position: relative;
        z-index: 1;
      }
      .ping-glow::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        border-radius: 0.5rem; /* match rounded-lg */
        box-shadow: 0 0 0 0 rgba(59,130,246,0.5);
        animation: ping-glow-anim 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
        z-index: -1;
      }
      @keyframes ping-glow-anim {
        0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
        70% { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
        100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
      }
    `}</style>
  );

  // Helper: check if any required field is blank (except declaration_pdf_url)
  const isAnyRequiredFieldBlank = () => {
    // Required fields for all roles
    const requiredFields = [
      'full_name',
      'phone',
      'dob',
      'role',
    ];
    // Instructor extra fields
    if (form.role === 'instructor') {
      requiredFields.push('bio');
    }
    // Check all required fields are not blank
    for (const field of requiredFields) {
      if (!form[field] || String(form[field]).trim() === "") return true;
    }
    // For instructor: certifications and classType must not be empty arrays or have empty strings
    if (form.role === 'instructor') {
      if (!Array.isArray(form.certifications) || form.certifications.length === 0 || form.certifications.some(c => !c || c.trim() === "")) return true;
      if (!Array.isArray(form.classType) || form.classType.length === 0 || form.classType.some(c => !c || c.trim() === "")) return true;
    }
    return false;
  };

  // Helper: check if a field is required and blank
  const isFieldInvalid = (field) => {
    if (field === 'declaration_pdf_url') return false;
    if (field === 'bio' && form.role !== 'instructor') return false;
    if (['certifications', 'classType'].includes(field) && form.role !== 'instructor') return false;
    if (field === 'certifications' && form.role === 'instructor') {
      return !Array.isArray(form.certifications) || form.certifications.length === 0 || form.certifications.some(c => !c || c.trim() === "");
    }
    if (field === 'classType' && form.role === 'instructor') {
      return !Array.isArray(form.classType) || form.classType.length === 0 || form.classType.some(c => !c || c.trim() === "");
    }
    return !form[field] || String(form[field]).trim() === "";
  };

  return (
    <>
      {pingGlow}
      <Navbar />
      <div className="flex flex-row bg-gray-100 text-sm text-gray-800 min-h-screen">
        <div className="block w-64" />
        <main className="flex-1 p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">
              User Details{form.full_name || form.name ? ` - ${form.full_name || form.name}` : ""}
            </h1>
            <div>
              <button
                type="button"
                onClick={() => {
                  if (editMode) setShowCancelConfirm(true);
                  else navigate(-1);
                }}
                className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              {editMode ? (
                <button
                  type="button"
                  className={
                    "py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent ml-2 " +
                    (saving || isAnyRequiredFieldBlank()
                      ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600")
                  }
                  onClick={() => setShowSaveConfirm(true)}
                  disabled={saving || isAnyRequiredFieldBlank()}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-500 text-white hover:bg-blue-600 ml-2"
                    onClick={handleEdit}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-red-500 text-white hover:bg-red-600 ml-2"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete User
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* User Information Card */}
              <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">User Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      id="full_name"
                      value={form.full_name || form.name || ""}
                      readOnly={!editMode}
                      onChange={handleChange}
                      className={
                        "py-2 px-3 block w-full border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 " +
                        (editMode
                          ? (!form.full_name || String(form.full_name).trim() === "")
                            ? "border-red-500 bg-white text-gray-800"
                            : "border-gray-300 bg-white text-gray-800"
                          : "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed")
                      }
                    />
                  </div>
                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      value={form.phone || form.phoneNo || ""}
                      readOnly={!editMode}
                      onChange={handleChange}
                      className={
                        "py-2 px-3 block w-full border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 " +
                        (editMode
                          ? (!form.phone || String(form.phone).trim() === "")
                            ? "border-red-500 bg-white text-gray-800"
                            : "border-gray-300 bg-white text-gray-800"
                          : "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed")
                      }
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={form.email || authEmail || ""}
                      readOnly={true}
                      disabled={true}
                      className={
                        "py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                      }
                    />
                  </div>
                  {/* Date of Birth */}
                  <div>
                    <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      id="dob"
                      value={form.dob || ""}
                      readOnly={!editMode}
                      onChange={handleChange}
                      className={
                        "py-2 px-3 block w-full border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 " +
                        (editMode
                          ? (!form.dob || String(form.dob).trim() === "")
                            ? "border-red-500 bg-white text-gray-800"
                            : "border-gray-300 bg-white text-gray-800"
                          : "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed")
                      }
                    />
                  </div>
                  {/* Role & Experience Years (Instructor only) */}
                  {form.role === "instructor" ? (
                    <div className="md:col-span-2 flex gap-4 items-center">
                      {/* Remove role dropdown, only show label and value */}
                      <div className="flex-1">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                          Role
                        </label>
                        <div className="py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed">
                          {form.role}
                        </div>
                      </div>
                      <div className="flex-1">
                        <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700 mb-1">
                          Experience Years
                        </label>
                        <input
                          type="number"
                          name="experienceYears"
                          id="experienceYears"
                          value={form.experienceYears || ""}
                          readOnly={!editMode}
                          onChange={handleChange}
                          className={
                            "py-2 px-3 block w-full border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 " +
                            (editMode
                              ? "bg-white text-gray-800"
                              : "bg-gray-50 text-gray-500 cursor-not-allowed")
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <div className="py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed">
                        {form.role}
                      </div>
                    </div>
                  )}
                  {/* Student fields */}
                  {form.role === "student" && (
                    <>
                      {/* Declaration PDF */}
                      <div className="md:col-span-2">
                        <label htmlFor="declaration_pdf_url" className="block text-sm font-medium text-gray-700 mb-1">
                          Declaration PDF
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            name="declaration_pdf_url"
                            id="declaration_pdf_url"
                            value={form.declaration_pdf_url || ""}
                            readOnly={true}
                            disabled={true}
                            className={
                              "py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                            }
                          />
                          {form.declaration_pdf_url && (
                            <button
                              type="button"
                              className="py-2 px-3 text-sm rounded-lg border border-gray-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                              onClick={() => setShowDeclaration(true)}
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Student: Bookings (below user info, not in right column) */}
              {form.role === "student" && (
                <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">Bookings</h2>
                    <div className="flex gap-2">
                      <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => setShowBookingsModal(true)} disabled={bookings.length === 0}>
                        View More
                      </button>
                      {editMode && (
                        <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => setEditingBookings(!editingBookings)}>
                          {editingBookings ? "Done" : "Edit Bookings"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {bookings.length > 0 ? (
                      bookings.slice(0, 3).map((b) => {
                        const isEvent = b.type && b.type.toLowerCase() === "event";
                        const isProtected = isEvent && ["completed", "cancelled", "booked"].includes((b.Status || "").toLowerCase());
                        const highlight = highlightBooking && b.id === highlightBooking;
                        return (
                          <div key={b.id} className={`flex justify-between items-center p-3 rounded-lg ${isProtected ? 'bg-gray-200 opacity-60' : 'bg-gray-50'} ${highlight ? 'ring-2 ring-blue-400 ring-offset-2 ping-glow' : ''}`}
                            id={highlight ? `booking-${b.id}` : undefined}
                          >
                            <div>
                              <p className="font-semibold text-gray-700">{b.title}</p>
                              <p className="text-xs text-gray-500">{b.type} | {b.date} {b.time}</p>
                              <p className="text-xs text-gray-500">Status: {b.Status}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="ml-2 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">{b.credit_used} credit{b.credit_used > 1 ? 's' : ''}</span>
                              {editingBookings && (
                                <button
                                  className="ml-2 text-red-500 hover:text-red-700 text-xs border border-red-200 rounded px-2 py-1"
                                  onClick={() => handleRemoveBooking(b.id, b.credit_deducted_from, b.credit_used)}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500">No bookings.</p>
                    )}
                  </div>
                </div>
              )}
              {/* Instructor: Bio, Certifications, Class Types Section */}
              {form.role === "instructor" && (
                <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mt-6">
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">Instructor Bio</h2>
                  {/* Bio */}
                  <div className="mb-4">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      id="bio"
                      rows={3}
                      value={form.bio || ""}
                      readOnly={!editMode}
                      onChange={handleChange}
                      className={
                        "py-2 px-3 block w-full border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 " +
                        (editMode
                          ? (!form.bio || String(form.bio).trim() === "")
                            ? "border-red-500 bg-white text-gray-800"
                            : "border-gray-300 bg-white text-gray-800"
                          : "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed")
                      }
                    />
                  </div>
                  {/* Certifications */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certifications
                    </label>
                    {editMode ? (
                      <div>
                        {Array.isArray(form.certifications) && form.certifications.map((cert, idx) => (
                          <div key={idx} className="flex items-center mb-2 gap-2">
                            <input
                              type="text"
                              value={cert}
                              onChange={e => {
                                const newCerts = [...form.certifications];
                                newCerts[idx] = e.target.value;
                                setForm(f => ({ ...f, certifications: newCerts }));
                              }}
                              className={
                                "py-2 px-3 block w-full border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-800 " +
                                ((editMode && (!cert || cert.trim() === "")) ? "border-red-500" : "border-gray-300")
                              }
                            />
                            <button
                              type="button"
                              className="text-red-500 p-1 rounded hover:bg-red-100"
                              onClick={() => {
                                const newCerts = form.certifications.filter((_, i) => i !== idx);
                                setForm(f => ({ ...f, certifications: newCerts }));
                              }}
                              aria-label="Remove"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="mt-2 p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          onClick={() => setForm(f => ({ ...f, certifications: [...(f.certifications || []), ""] }))}
                          aria-label="Add"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(form.certifications || []).map((cert, idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={cert}
                            readOnly
                            className="py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Class Types */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class Types
                    </label>
                    {editMode ? (
                      <div>
                        {Array.isArray(form.classType) && form.classType.map((ct, idx) => (
                          <div key={idx} className="flex items-center mb-2 gap-2">
                            <input
                              type="text"
                              value={ct}
                              onChange={e => {
                                const newCT = [...form.classType];
                                newCT[idx] = e.target.value;
                                setForm(f => ({ ...f, classType: newCT }));
                              }}
                              className={
                                "py-2 px-3 block w-full border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-800 " +
                                ((editMode && (!ct || ct.trim() === "")) ? "border-red-500" : "border-gray-300")
                              }
                            />
                            <button
                              type="button"
                              className="text-red-500 p-1 rounded hover:bg-red-100"
                              onClick={() => {
                                const newCT = form.classType.filter((_, i) => i !== idx);
                                setForm(f => ({ ...f, classType: newCT }));
                              }}
                              aria-label="Remove"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="mt-2 p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          onClick={() => setForm(f => ({ ...f, classType: [...(f.classType || []), ""] }))}
                          aria-label="Add"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(form.classType || []).map((ct, idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={ct}
                            readOnly
                            className="py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Remove old Credit Remains and Bookings boxes for all roles */}
            </div>
            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Instructor: Profile Image & Cover Page */}
              {form.role === "instructor" && (
                <>
                  <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Profile Picture</h2>
                    <img
                      src={form.photo_url || "https://via.placeholder.com/150"}
                      alt="Profile"
                      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                    />
                    {editMode && (
                      <>
                        <label htmlFor="profile-image-file" className="sr-only">Choose profile image</label>
                        <input
                          type="file"
                          name="profile-image-file"
                          id="profile-image-file"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                          className="block w-full border border-gray-200 rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 file:bg-gray-50 file:border-0 file:me-4 file:py-2 file:px-4"
                        />
                      </>
                    )}
                    <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Cover Page</h2>
                    <img
                      src={form.coverPhoto_url || "https://via.placeholder.com/300x100"}
                      alt="Cover"
                      className="w-full h-24 rounded-lg object-cover mb-2"
                    />
                    {editMode && (
                      <>
                        <label htmlFor="cover-image-file" className="sr-only">Choose cover image</label>
                        <input
                          type="file"
                          name="cover-image-file"
                          id="cover-image-file"
                          accept="image/*"
                          onChange={handleCoverImageChange}
                          className="block w-full border border-gray-200 rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 file:bg-gray-50 file:border-0 file:me-4 file:py-2 file:px-4"
                        />
                      </>
                    )}
                  </div>
                  {/* Removed Class & Event History Card for instructor */}
                </>
              )}
              {/* Student: Credit Remains (was Credit History) */}
              {form.role === "student" && (
                <div className="bg-white p-6 rounded-xl shadow border border-gray-200 ">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">Credit Remains</h2>
                    <div className="flex gap-2">
                      <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => setShowCreditRemainsModal(true)} disabled={creditRemains.length === 0}>
                        View More
                      </button>
                      {editMode && (
                        <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => setEditingCredits(!editingCredits)}>
                          {editingCredits ? "Done" : "Edit Credits"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {creditRemains.length > 0 ? (
                      creditRemains.slice(0, 5).map((cr) => (
                        <div key={cr.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-semibold text-gray-700">{cr.title}</p>
                            <p className="text-xs text-gray-500">{cr.classType} | {editingCredits ? (
                              <input
                                type="number"
                                min="0"
                                className="w-16 border rounded px-1 text-xs"
                                value={cr.credits_remaining}
                                onChange={e => setCreditRemains(creditRemains.map(c => c.id === cr.id ? { ...c, credits_remaining: Number(e.target.value) } : c))}
                                onBlur={e => handleEditCredit(cr.id, Number(e.target.value))}
                              />
                            ) : (
                              `${cr.credits_remaining} / ${cr.credits_total} credits`
                            )}</p>
                            <p className="text-xs text-gray-500">Valid Until: {cr.validUntil && cr.validUntil.toDate ? cr.validUntil.toDate().toLocaleDateString() : (cr.validUntil?.toDateString?.() || String(cr.validUntil))}</p>
                          </div>
                          {cr.is_active ? (
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>
                          ) : (
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-500">Expired</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No credit remains.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {/* Declaration PDF Modal */}
      {showDeclaration && (
        <div className="fixed inset-0 z-100 flex items-center justify-center" style={{ background: "rgba(128,128,128,0.2)" }}>
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowDeclaration(false)}
            >
              &times;
            </button>
            <h3 className="text-lg font-semibold mb-4">Declaration PDF</h3>
            <iframe
              src={form.declaration_pdf_url}
              title="Declaration PDF"
              className="w-full h-[70vh] rounded"
            />
          </div>
        </div>
      )}
      {/* Save Confirmation Popup */}
      <ConfirmPopup
        open={showSaveConfirm}
        title="Confirm Save"
        message="Are you sure you want to save your changes?"
        onConfirm={() => {
          setShowSaveConfirm(false);
          handleSave();
        }}
        onCancel={() => setShowSaveConfirm(false)}
        confirmText="Save"
        cancelText="Cancel"
      />
      {/* Cancel Confirmation Popup */}
      <ConfirmPopup
        open={showCancelConfirm}
        title="Discard Changes?"
        message="Are you sure you want to discard your changes? Unsaved changes will be lost."
        onConfirm={() => {
          setShowCancelConfirm(false);
          setEditMode(false);
          setForm(user);
          setProfileImageFile(null);
          setCoverImageFile(null);
          // Do not send or update any data here
        }}
        onCancel={() => setShowCancelConfirm(false)}
        confirmText="Discard"
        cancelText="Keep Editing"
        color="red"
      />
      {/* Delete User Confirmation Popup */}
      <ConfirmPopup
        open={showDeleteConfirm}
        title="Delete User"
        message="Are you sure you want to delete this user? This action is permanent and cannot be undone."
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDeleteUser();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        cancelText="Cancel"
        color="red"
      />
      {/* Credit Remains Modal */}
      <ViewMoreModal open={showCreditRemainsModal} onClose={() => setShowCreditRemainsModal(false)} title="All Credit Remains">
        <div className="space-y-3">
          {creditRemains.length > 0 ? (
            creditRemains.map((cr) => (
              <div key={cr.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-700">{cr.title}</p>
                  <p className="text-xs text-gray-500">{cr.classType} | {editingCredits ? (
                    <input
                      type="number"
                      min="0"
                      className={
                        `w-16 rounded px-1 text-xs` + (editingCredits ? ' border' : ' border-none')
                      }
                      value={cr.credits_remaining}
                      onChange={e => setCreditRemains(creditRemains.map(c => c.id === cr.id ? { ...c, credits_remaining: Number(e.target.value) } : c))}
                      onBlur={e => handleEditCredit(cr.id, Number(e.target.value))}
                    />
                  ) : (
                    `${cr.credits_remaining} / ${cr.credits_total} credits`
                  )}</p>
                  <p className="text-xs text-gray-500">Valid Until: {cr.validUntil && cr.validUntil.toDate ? cr.validUntil.toDate().toLocaleDateString() : (cr.validUntil?.toDateString?.() || String(cr.validUntil))}</p>
                </div>
                {cr.is_active ? (
                  <span className="ml-2 px-2 py-1 text-xs rounded bg-green-100 text-green-700">Active</span>
                ) : (
                  <span className="ml-2 px-2 py-1 text-xs rounded bg-gray-200 text-gray-500">Expired</span>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No credit remains.</p>
          )}
        </div>
        {editMode && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-500 text-white hover:bg-blue-600"
              onClick={() => setEditingCredits(!editingCredits)}
            >
              {editingCredits ? "Done" : "Edit Credits"}
            </button>
          </div>
        )}
      </ViewMoreModal>
      {/* Bookings Modal */}
      <ViewMoreModal open={showBookingsModal} onClose={() => setShowBookingsModal(false)} title="All Bookings">
        <div className="space-y-3">
          {bookings.length > 0 ? (
            bookings.map((b) => {
              const isEvent = b.type && b.type.toLowerCase() === "event";
              const isProtected = isEvent && ["completed", "cancelled", "booked"].includes((b.Status || "").toLowerCase());
              const highlight = highlightBooking && b.id === highlightBooking;
              return (
                <div key={b.id} className={`p-3 rounded-lg border border-gray-200 flex justify-between items-center ${isProtected ? 'bg-gray-200 opacity-60' : 'bg-gray-50'} ${highlight ? 'ring-2 ring-blue-400 ring-offset-2 ping-glow' : ''}`}
                  id={highlight ? `booking-modal-${b.id}` : undefined}
                >
                  <div>
                    <p className="font-semibold text-gray-700">{b.title}</p>
                    <p className="text-xs text-gray-500">{b.type} | {b.date} {b.time}</p>
                    <p className="text-xs text-gray-500">Status: {b.Status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="ml-2 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">{b.credit_used} credit{b.credit_used > 1 ? 's' : ''}</span>
                    {editingBookings && (
                      <button
                        className="ml-2 text-red-500 hover:text-red-700 text-xs border border-red-200 rounded px-2 py-1"
                        onClick={() => handleRemoveBooking(b.id, b.credit_deducted_from, b.credit_used)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">No bookings.</p>
          )}
        </div>
        {editMode && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-500 text-white hover:bg-blue-600"
              onClick={() => setEditingBookings(!editingBookings)}
            >
              {editingBookings ? "Done" : "Edit Bookings"}
            </button>
          </div>
        )}
      </ViewMoreModal>
    </>
  );
}