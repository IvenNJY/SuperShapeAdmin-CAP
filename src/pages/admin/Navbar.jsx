import '../../index.css'
import { signOut } from 'firebase/auth'
import { auth } from '../../../backend/firebaseConfig.js'
import { useState, useEffect } from 'react';
import ConfirmPopup from "../../components/ConfirmPopup";

export default function Navbar() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false); // Dropdown state
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => console.log("User signed out successfully"))
      .catch((error) => console.error("Error signing out:", error));
  };

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
        <div className="hs-accordion-group pb-0 px-2 w-full flex flex-col flex-wrap h-full" data-hs-accordion-always-open>
          <ul className="space-y-1 flex-1">
            <li>
              <a className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 transition-all duration-200 ease-in-out ${window.location.pathname === '/admin/dashboard' ? 'bg-gray-100' : ''}`} href="/admin/dashboard">
                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Dashboard
              </a>
            </li>

            {/* Dropdown for Class and Events and Assign Students is now disabled */}
            {false && (
            <li className="hs-accordion" id="account-accordion">
              <button
                type="button"
                className="hs-accordion-toggle w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100"
                aria-expanded={openDropdown ? "true" : "false"}
                aria-controls="account-accordion-sub-1-collapse-1"
                onClick={() => setOpenDropdown((prev) => !prev)}
              >
                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m21.7 16.4-.9-.3"/><path d="m15.2 13.9-.9-.3"/><path d="m16.6 18.7.3-.9"/><path d="m19.1 12.2.3-.9"/><path d="m19.6 18.7-.4-1"/><path d="m16.8 12.3-.4-1"/><path d="m14.3 16.6 1-.4"/><path d="M20.7 13.8 21.7 13.4"/></svg>
                Class and Events

                {/* Up arrow when open, down arrow when closed */}
                <svg className={`ms-auto size-4 text-gray-600 group-hover:text-gray-500 ${openDropdown ? "block" : "hidden"}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                <svg className={`ms-auto size-4 text-gray-600 group-hover:text-gray-500 ${openDropdown ? "hidden" : "block"}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>

              <div
                id="account-accordion-sub-1-collapse-1"
                className={`hs-accordion-content w-full overflow-hidden transition-all duration-300 ${openDropdown ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
                style={{ transitionProperty: "max-height, opacity" }}
                role="region"
                aria-labelledby="account-accordion"
              >
                <ul className="pt-1 ps-7 space-y-1">
                  <li>
                    <a className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100" href="/admin/classes">
                      <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                      Manage Classes and Events
                    </a>
                  </li>
                  <li>
                    <a className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100" href="assign-manager.html">
                      <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg>
                      Assign Students
                    </a>
                  </li>
                </ul>
              </div>
            </li>
            )}
            <li>
              <a className={`w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg transition-all duration-200 ease-in-out ${window.location.pathname === '/admin/classes' ? 'bg-gray-100 text-gray-800' : 'text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100'}`} href="/admin/classes">
                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                Manage Classes and Events
              </a>
            </li>

            <li>
              <a className={`w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg transition-all duration-200 ease-in-out ${window.location.pathname === '/admin/packages' ? 'bg-gray-100 text-gray-800' : 'text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100'}`} href="/admin/packages">
                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3.3.5-.7.5-1.1V6.5L15.5 2z"/><path d="M3 7.6v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8"/><path d="M15 2v5h5"/></svg>
                Manage Packages
              </a>
            </li>

            <li>
              <a className={`w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg transition-all duration-200 ease-in-out ${window.location.pathname === '/admin/credits' ? 'bg-gray-100 text-gray-800' : 'text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100'}`} href="/admin/credits">
                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                Manage Credit
              </a>
            </li>

            <li>
              <a className={`w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg transition-all duration-200 ease-in-out ${window.location.pathname === '/admin/users' ? 'bg-gray-100 text-gray-800' : 'text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100'}`} href="/admin/users">
                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Users
              </a>
            </li>

            <li>
              <a className={`w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg transition-all duration-200 ease-in-out ${window.location.pathname === '/admin/announcements' ? 'bg-gray-100 text-gray-800' : 'text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100'}`} href="/admin/announcements">
                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                Announcements
              </a>
            </li>
            
            <li>
              <a className={`w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg transition-all duration-200 ease-in-out ${window.location.pathname === '/admin/settings' ? 'bg-gray-100 text-gray-800' : 'text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100'}`} href="/admin/settings">
                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.58-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.49.49 0 0 0-.49-.42h-3.84a.49.49 0 0 0-.49-.42l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.58.22L2.32 8.81a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.07.64-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32a.49.49 0 0 0 .58.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54a.49.49 0 0 0 .49.42h3.84a.49.49 0 0 0 .49-.42l.36-2.54c.59-.24 1.13-.57 1.62.94l2.39.96a.49.49 0 0 0 .58-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Settings
              </a>
            </li>

            {/* ...existing nav items... */}
          </ul>
          <div className="flex-1 flex flex-col justify-end">
            <ul>
              <li>
                <a onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-x-3.5 py-2  my-3  px-2.5 text-sm text-red-500 rounded-lg hover:cursor-pointer hover:bg-red-50 focus:outline-hidden focus:bg-gray-100 transition-all duration-200 ease-in-out" >
                  <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                  Logout
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      {/* End Body */}
  </div>
</div>
      <ConfirmPopup
        open={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
        confirmText="Logout"
        cancelText="Cancel"
        color="red"
      />
    </>
    )
}