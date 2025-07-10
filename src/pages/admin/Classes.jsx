import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../backend/firebaseConfig'; // adjust if needed
import Navbar from './Navbar';
import { Link, useNavigate } from 'react-router';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [filters, setFilters] = useState({ instructor: '', type: '', date: '', status: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'start_date_time', direction: 'descending' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classCollection = collection(db, 'class');
        const classSnapshot = await getDocs(classCollection);
        const classList = classSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            start_date_time: data.start_date_time?.toDate ? data.start_date_time.toDate() : new Date(data.start_date_time),
          };
        });
        setClasses(classList);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleFilterChange = (e) => {
    const { id, value } = e.target;
    const filterKey = id.replace('class-', '').replace('-filter', '');
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedClasses = useMemo(() => {
    let filtered = [...classes].filter(cls => {
      const instructorMatch = filters.instructor ? cls.instructor?.toLowerCase().includes(filters.instructor.toLowerCase()) : true;
      const typeMatch = filters.type ? cls.class_type === filters.type : true;
      const dateMatch = filters.date ? cls.start_date_time.toISOString().slice(0, 10) === filters.date : true;
      const now = new Date();
      let status = 'Upcoming';
      if (cls.start_date_time < now) status = 'Ended';
      const statusMatch = filters.status ? status === filters.status : true;
      return instructorMatch && typeMatch && dateMatch && statusMatch;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [classes, filters, sortConfig]);

  // Header card values
  const activeClasses = useMemo(() => classes.filter(c => c.type === 'class' && c.start_date_time > new Date()).length, [classes]);
  const activeEvents = useMemo(() => classes.filter(c => c.type === 'event' && c.start_date_time > new Date()).length, [classes]);
  const upcomingClassesCount = useMemo(() => classes.filter(c => c.start_date_time > new Date()).length, [classes]);

  const formatDate = (date) => date.toLocaleDateString('en-CA');
  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (loading) return <div className="flex-1 p-6">Loading classes...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar/Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>
      {/* Main Content */}
      <main className="flex-1 p-6 md:ml-64">
        <h1 className="text-2xl font-semibold mb-2">Manage Classes and Events</h1>
        <p className="text-gray-600 mb-8">Manage all the details and settings of classes and events here</p>
        {/* Header Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <div className="block p-4 md:p-5 relative bg-white">
              <div className="flex md:flex flex-col lg:flex-row gap-y-3 gap-x-5">
                <svg className="shrink-0 size-5 text-gray-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <div className="grow">
                  <p className="text-xs uppercase font-medium text-gray-800">Active Classes</p>
                  <h3 className="mt-1 text-xl sm:text-2xl font-semibold text-green-600">{activeClasses}</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <div className="block p-4 md:p-5 relative bg-white">
              <div className="flex md:flex flex-col lg:flex-row gap-y-3 gap-x-5">
                <svg className="shrink-0 size-5 text-gray-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="15" y1="9" y2="9"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
                <div className="grow">
                  <p className="text-xs uppercase font-medium text-gray-800">Active Events</p>
                  <h3 className="mt-1 text-xl sm:text-2xl font-semibold text-green-600">{activeEvents}</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <div className="block p-4 md:p-5 relative bg-white">
              <div className="flex md:flex flex-col lg:flex-row gap-y-3 gap-x-5">
                <svg className="shrink-0 size-5 text-gray-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                <div className="grow">
                  <p className="text-xs uppercase font-medium text-gray-800">Upcoming Classes</p>
                  <h3 className="mt-1 text-xl sm:text-2xl font-semibold text-blue-600">{upcomingClassesCount}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Filters and Add Class Button */}
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
          <input type="text" id="class-instructor-filter" placeholder="Instructor" className="bg-white form-input border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-64 mb-2 sm:mb-0" onChange={handleFilterChange} />
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select id="class-type-filter" className="form-select border border-gray-300 rounded-lg px-2 py-1 bg-white w-full sm:w-auto" onChange={handleFilterChange}>
              <option value="">Type</option>
              <option value="Pilates Reformer">Pilates Reformer</option>
              <option value="yoga">Yoga</option>
              <option value="zumba">Zumba</option>
            </select>
            <input type="date" id="class-date-filter" className="form-input border border-gray-300 rounded-lg px-3 py-2 bg-white w-full sm:w-auto" onChange={handleFilterChange} />
            <select id="class-status-filter" className="form-select border border-gray-300 rounded-lg px-2 py-1 bg-white w-full sm:w-auto" onChange={handleFilterChange}>
              <option value="">Status</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Ended">Ended</option>
            </select>
            <button
              onClick={() => navigate('/admin/add-class')}
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
            >
              Add Class +
            </button>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sort-header cursor-pointer" onClick={() => handleSort('title')}>Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sort-header cursor-pointer" onClick={() => handleSort('class_type')}>Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sort-header cursor-pointer" onClick={() => handleSort('instructor')}>Instructor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sort-header cursor-pointer" onClick={() => handleSort('start_date_time')}>Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedClasses.map(cls => {
                const now = new Date();
                let status = 'Upcoming';
                let statusColor = 'bg-blue-100 text-blue-700';
                if (cls.start_date_time < now) {
                  status = 'Ended';
                  statusColor = 'bg-red-100 text-red-700';
                }
                // Example: parse start/end time from duration or add fields as needed
                const startTime = formatTime(cls.start_date_time);
                // For demo, just add 1 hour for end time
                const endTime = formatTime(new Date(cls.start_date_time.getTime() + 60 * 60 * 1000));
                return (
                  <tr key={cls.id}>
                    <td className="px-6 py-3">{cls.title}</td>
                    <td className="px-6 py-3">{cls.class_type}</td>
                    <td className="px-6 py-3">{cls.instructor}</td>
                    <td className="px-6 py-3">{formatDate(cls.start_date_time)}</td>
                    <td className="px-6 py-3">{startTime}</td>
                    <td className="px-6 py-3">{endTime}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>{status}</span>
                    </td>
                    <td className="px-6 py-3">
                      <Link to={`/admin/classes/${cls.id}`} className="text-blue-600 hover:underline">Details</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Add New Class Sidebar (panel, form, etc.) can be added here */}
      </main>
    </div>
  );
}

