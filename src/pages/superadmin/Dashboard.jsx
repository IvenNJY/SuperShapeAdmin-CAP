import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import Navbar from "./Navbar";

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/superadmin/users');
  }, [navigate]);

  return (<>
    <Navbar />

    <h1 className="text-2xl font-bold text-center mt-10">Super Admin Dashboard</h1>
  </>
  )
}