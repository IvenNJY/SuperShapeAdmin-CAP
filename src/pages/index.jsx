import '../index.css'
import { useState, useEffect } from 'react'
import { Navigate } from 'react-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../../backend/firebaseConfig.js'
import { doc, getDoc } from 'firebase/firestore'
import ToastInjector, { showToast } from '../components/toast'

function Index({ user }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      setLoading(true);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setRole(userDocSnap.data().role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      setLoading(false);
    };
    fetchUserRole();
  }, [user]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setShowError(true);
      return;
    }
    setShowError(false);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in:', userCredential.user);
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Error signing in:', errorCode, errorMessage);
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        showToast({ message: "Invalid email or password.", type: "error" });
      }
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (showError) setShowError(false);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (showError) setShowError(false);
  };

  if (user) {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (role === "superadmin") {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    
    // Fallback for logged-in users without a specific role or dashboard
    const handleLogout = async () => {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      window.location.reload();
    };
    return (
      <div className="fixed inset-0 flex items-center justify-center z-10 bg-gray-100">
        <div className="relative w-full max-w-md bg-white border border-gray-200 shadow-lg rounded-2xl p-8 mx-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome!</h1>
          <p className="text-gray-600 mb-6">You are logged in, but you do not have access to an admin dashboard.</p>
          <button
            onClick={handleLogout}
            className="py-2 px-4 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastInjector />
      <div className="fixed inset-0 w-screen h-screen">
        <img src="/pilates.png" alt="Pilates" className="object-cover w-full h-full opacity-70" />
      </div>
      <div className="fixed inset-0 flex items-center justify-center z-10">
        <div className="relative w-full max-w-md bg-white bg-opacity-95 border border-gray-200 shadow-2xl rounded-2xl p-8 mx-4">
          <div className="flex justify-center mb-6">
            <img src="/logo.PNG" alt="Logo" className="max-h-32 object-contain" />
          </div>
          <div>
            <h1 className="block text-3xl font-bold text-gray-800 text-left mb-2">Sign in</h1>
            <p className="text-gray-500 text-sm mb-4">Welcome back! Please enter your credentials.</p>
          </div>
          <div className="mt-5">
            <form onSubmit={handleSignIn}>
              <div className="grid gap-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm mb-2">Email address</label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className={`border ${showError && !email ? 'border-red-500' : 'border-gray-300'} py-2.5 sm:py-3 px-4 block w-full rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none`}
                      required
                      aria-describedby="email-error"
                      onChange={handleEmailChange}
                      value={email}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-sm mb-2">Password</label>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className={`border ${showError && !password ? 'border-red-500' : 'border-gray-300'} py-2.5 sm:py-3 px-4 block w-full rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none`}
                      required
                      aria-describedby="password-error"
                      onChange={handlePasswordChange}
                      value={password}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default Index;
