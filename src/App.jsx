import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router'
import { onAuthStateChanged } from 'firebase/auth'


import { ProtectedRoute } from './components/protectedRoute.jsx'

import { auth } from '../backend/firebaseConfig.js'
import Index from './pages/index.jsx'
import SuperAdminDashboard from './pages/superadmin/Dashboard.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import ErrorPage from './pages/ErrorPage.jsx'
import Users from './pages/admin/Users.jsx'
import UserDetails from './pages/admin/UserDetails.jsx'
import Settings from './pages/admin/Settings.jsx'


import { useEffect , useState } from 'react'
import Announcement from './pages/admin/Announcement.jsx'
import Credits from './pages/admin/Credits.jsx'
import CreditDetails from './pages/admin/CreditDetails.jsx'
import Classes from './pages/admin/Classes.jsx'
import ClassDetails from './pages/admin/ClassDetails.jsx'
import Packages from './pages/admin/Packages.jsx'
import AssignStudent from './pages/admin/AssignStudent.jsx'
import AddClasses from './pages/admin/AddClasses.jsx'

import SuperAdminUsers from './pages/superadmin/Users.jsx'
import SuperAdminSettings from './pages/superadmin/Settings.jsx'
import SuperAdminUserDetails from './pages/superadmin/UserDetails.jsx'
import AddAnnouncement from './pages/superadmin/AddAnnouncement.jsx'
import SuperAdminAnnouncements from './pages/superadmin/Announcement.jsx'




function App() {

  const [user, setUser] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsFetching(false);
        return;
      }
      
      setUser(null);
      setIsFetching(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  },[])

  if (isFetching) {
    return (
      <div className="animate-spin inline-block size-8 border-3 border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  function protectedRoute(path, element) {
    return (
      <Route
        path={path}
        element={
          <ProtectedRoute user={user}>
            {element}
          </ProtectedRoute>
        }
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<ErrorPage />} />
        <Route path="/" element={<Index user={user} />} />

        {protectedRoute("/admin/dashboard", <AdminDashboard />)}
        {protectedRoute("/admin/announcements", <Announcement />)}
        {protectedRoute("/admin/users/", <Users />)}
        {protectedRoute("/admin/credits/", <Credits />)}
        {protectedRoute("/admin/credits/:uid", <CreditDetails />)}
        {protectedRoute("/admin/user/:uid", <UserDetails />)}
        {protectedRoute("/admin/settings/", <Settings />)}
        {protectedRoute("/admin/classes", <Classes />)}
        {protectedRoute("/admin/classes/:uid", <ClassDetails />)}
        {protectedRoute("/admin/assignstudent/:classid", <AssignStudent />)}
        {protectedRoute("/admin/packages", <Packages />)}
        {protectedRoute("/admin/add-class", <AddClasses />)}


        
        {protectedRoute("/superadmin/dashboard", <SuperAdminDashboard />)}
        {protectedRoute("/superadmin/users", <SuperAdminUsers />)}
        {protectedRoute("/superadmin/announcements", <SuperAdminAnnouncements />)}
        {protectedRoute("/superadmin/announcemnet/add", <AddAnnouncement />)}
        {protectedRoute("/superadmin/user/:uid", <SuperAdminUserDetails />)}
        {protectedRoute("/superadmin/settings", <SuperAdminSettings />)}
      </Routes>
    </BrowserRouter>
  )
}

export default App
