import '../../index.css'
import { signOut } from 'firebase/auth'
import { auth } from '../../../backend/firebaseConfig.js'
import { useState } from 'react';
import ConfirmPopup from '../../components/ConfirmPopup.jsx';

export default function Navbar() {

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    signOut(auth)
      .then(() => console.log("User signed out successfully"))
      .catch((error) => console.error("Error signing out:", error));
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

    // Wrap both sidebar and ConfirmPopup in a React fragment so both render at root
    return (
      <>
        <div id="hs-sidebar-collapsible-group" className="lg:block lg:translate-x-0 lg:end-auto lg:bottom-0 w-64
hs-overlay-open:translate-x-0
translate-x-0 transition-all duration-300 transform
h-full
fixed top-0 start-0 bottom-0 z-60
bg-white border-e border-gray-200" role="dialog" tabIndex="-1" aria-label="Sidebar" >
  <div className="relative flex flex-col h-full max-h-full ">
      {/* Header */}
      <header className="p-4 flex justify-center items-center">
        <a className="flex-none focus:outline-hidden focus:opacity-80 w-full flex justify-center" href="#" aria-label="Brand">
          <img src="/logo.PNG" alt="Brand Logo" style={{width:"60%"}} className="flex flex-col h-auto"/>
        </a>
      </header>
      {/* End Header */}

      {/* Body */}
      <nav className="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300">
        <div className="hs-accordion-group pb-0 px-2  w-full flex flex-col flex-wrap" data-hs-accordion-always-open>
          <ul className="space-y-1">
            {/* <li>
              <a className="flex items-center gap-x-3.5 py-2 px-2.5 bg-gray-100 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100" href="/superadmin/dashboard">
                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Dashboard
              </a>
            </li> */}

            <li>
              <a className="w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100" href="/superadmin/users">
                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Users
              </a>
            </li>

            <li>
              <a className="w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100" href="/superadmin/announcements">
                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                Announcements
              </a>
            </li>
            
            <li>
              <a className="w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100" href="/superadmin/settings">
                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.58-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.49.49 0 0 0-.49-.42h-3.84a.49.49 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.58.22L2.32 8.81a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.07.64-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32a.49.49 0 0 0 .58.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54a.49.49 0 0 0 .49.42h3.84a.49.49 0 0 0 .49-.42l.36-2.54c.59-.24 1.13-.57 1.62.94l2.39.96a.49.49 0 0 0 .58-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Settings
              </a>
            </li>

            <li>
              <a onClick={handleLogout} className="w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-red-500 rounded-lg hover:cursor-pointer hover:bg-red-50 focus:outline-hidden focus:bg-gray-100" >
                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                Logout
              </a>
            </li>
            
          </ul>
        </div>
      </nav>
      {/* End Body */}
  </div>
</div>
        <ConfirmPopup
          open={showLogoutConfirm}
          title="Confirm Logout"
          message="Are you sure you want to log out?"
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
          confirmText="Logout"
          cancelText="Cancel"
          color="red"
        />
      </>
    )
}