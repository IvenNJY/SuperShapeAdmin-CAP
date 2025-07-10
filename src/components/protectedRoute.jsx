import { Navigate, useLocation } from "react-router"
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../backend/firebaseConfig";

export const ProtectedRoute = ({ children, user }) => {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const fetchUserRole = async () => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setRole(userDocSnap.data().role);
                }
            }
            setLoading(false);
        };
        fetchUserRole();
    }, [user]);

    if (loading) {
        return <div>Loading...</div>; // Or a more sophisticated loading indicator
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (location.pathname.startsWith("/admin")) {
            if (role === "admin") return children;
            if (role === "superadmin") return <Navigate to="/superadmin/dashboard" replace />;
            return <Navigate to="/" replace />; // Redirect others to homepage
    }

    if (location.pathname.startsWith("/superadmin")) {
        if (role === "superadmin") return children;
        if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
        return <Navigate to="/" replace />; // Redirect others to homepage
    }
    
    return children;
};