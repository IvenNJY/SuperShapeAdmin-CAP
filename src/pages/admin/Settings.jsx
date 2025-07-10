import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { db } from "../../../backend/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, updateProfile, updateEmail, updatePassword } from "firebase/auth";
import ConfirmPopup from "../../components/ConfirmPopup";

export default function Settings() {
  const auth = getAuth();
  const user = auth.currentUser;
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [password, setPassword] = useState({ new: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastOnline, setLastOnline] = useState("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.displayName || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
      });
      setLastOnline(user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : "");
      // Fetch Firestore username if available
      const fetchFirestoreName = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setForm(f => ({
            ...f,
            name: data.full_name || user.displayName || "",
            phone: data.phone || f.phone || ""
          }));
        }
      };
      fetchFirestoreName();
    }
  }, [user]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handlePasswordChange = e => {
    const { name, value } = e.target;
    setPassword(p => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    // Password field validation: if either password.new or password.confirm is filled, both must be filled
    if ((password.new && !password.confirm) || (!password.new && password.confirm)) {
      setError("Please fill in both password fields to change your password.");
      setLoading(false);
      return;
    }
    // Password length validation
    if (password.new && password.new.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    try {
      if (user) {
        await updateDoc(doc(db, "users", user.uid), { full_name: form.name, phone: form.phone });
        if (form.name !== user.displayName) {
          await updateProfile(user, { displayName: form.name });
        }
        if (form.email !== user.email) {
          await updateEmail(user, form.email);
        }
        // Only allow password change for email/password users
        const providerId = user.providerData[0]?.providerId;
        if (password.new) {
          if (providerId !== 'password') {
            setError("Password change is only available for email/password accounts.");
            setLoading(false);
            return;
          }
          if (password.new !== password.confirm) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
          }
          try {
            await updatePassword(user, password.new);
          } catch (err) {
            if (err.code === "auth/requires-recent-login") {
              setError("Sensitive changes require you to log in again. Please log out and log in, then try again.");
            } else {
              setError(err.message || "Failed to update password.");
            }
            setLoading(false);
            return;
          }
        }
        setSuccess("Settings updated successfully.");
      }
    } catch (err) {
      setError(err.message || "Failed to update settings.");
    }
    setLoading(false);
  };

  // Disable Save button if password fields are not empty and do not match
  const passwordMismatch = password.new && password.confirm && password.new !== password.confirm;

  return (
    <>
      <style>
        {`
          @keyframes flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.2; }
          }
          .flash-red {
            animation: flash 1s infinite;
          }
        `}
      </style>
      <Navbar />
      <div className="flex bg-gray-100 text-sm text-gray-800 min-h-screen">
        <div className="block w-64" />
        <main className="flex-1 p-6 md:p-8 space-y-6">
          <div className="flex-1 ">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold mb-2">Settings</h1>
              <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300" onClick={() => setShowSaveConfirm(true)} disabled={loading || passwordMismatch}>{loading ? "Saving..." : "Save"}</button>
            </div>
            <p className="text-gray-600 mb-8">Your Profile Settings</p>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {passwordMismatch && <p className="text-red-500 mb-4">Passwords do not match.</p>}
            {success && <p className="text-green-500 mb-4">{success}</p>}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="relative">
                    <input type="text" id="name" name="name" value={form.name} onChange={handleChange} className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <input type="text" id="phone" name="phone" value={form.phone} onChange={handleChange} className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <input type="email" id="email" name="email" value={form.email} onChange={handleChange} className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="new" className="block text-sm font-medium text-gray-700 mb-1">Change Password</label>
                  <div className="relative">
                    <input type="password" id="new" name="new" value={password.new} onChange={handlePasswordChange} className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input type="password" id="confirm" name="confirm" value={password.confirm} onChange={handlePasswordChange} className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-red-500 text-sm flash-red">Any saved changes made here will force you to logout to ensure security</p>
                <p className="text-sm text-gray-500">Last Online : {lastOnline}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <ConfirmPopup
        open={showSaveConfirm}
        title="Save Settings"
        message="Are you sure you want to save your changes?"
        onConfirm={async () => {
          setShowSaveConfirm(false);
          await handleSave();
          // Force logout after saving settings
          auth.signOut();
        }}
        onCancel={() => setShowSaveConfirm(false)}
        confirmText="Save"
        cancelText="Cancel"
      />
    </>
  );
}