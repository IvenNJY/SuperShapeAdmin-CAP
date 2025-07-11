import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import Navbar from "./Navbar";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import NewAnnouncement from "./NewAnnouncemnet"; // Import NewAnnouncement

export default function Announcement() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [modalVisible, setModalVisible] = useState(false); // for animation
    const [showAddForm, setShowAddForm] = useState(false); // State to control view
    const [filterBy, setFilterBy] = useState("");
    const [filterType, setFilterType] = useState("ALL");
    const [filterDate, setFilterDate] = useState(""); // New: filter by date (YYYY-MM-DD)
    const [filterByWho, setFilterByWho] = useState("ALL"); // New: filter by Admin/SYSTEM
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const db = getFirestore();
            const querySnapshot = await getDocs(collection(db, "Notification"));
            const data = querySnapshot.docs.map(doc => {
                const docData = doc.data();
                // Map Firestore fields to lower-case keys for consistency
                return {
                    id: doc.id,
                    by: docData.BY || docData.by || "",
                    subject: docData.SUBJECT || docData.subject || "",
                    announcement: docData.ANNOUNCEMENT || docData.announcement || "",
                    to: docData.TO || docData.to || "",
                    type: docData.TYPE || docData.type || "",
                    timestamp: docData.timestamp ? (docData.timestamp.toDate ? docData.timestamp.toDate() : new Date(docData.timestamp.seconds ? docData.timestamp.seconds * 1000 : docData.timestamp)) : null
                };
            });
            console.log("Fetched announcements:", data); // debug
            setAnnouncements(data);
        } catch (err) {
            setError("Error loading announcements. Please try again.");
            console.error("Error fetching announcements:", err); // debug
        } finally {
            setLoading(false);
        }
    }, []); // Added empty dependency array for useCallback

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Call fetchData and include it in dependencies

    // Set default filters: By Who = ADMIN, Date = today
    useEffect(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        setFilterByWho('ADMIN');
        setFilterDate(`${yyyy}-${mm}-${dd}`);
    }, []);

    const openDetailsModal = (announcement) => {
        console.log("Opening modal for announcement:", announcement); // debug
        setSelected(announcement);
        setModalOpen(true);
        setTimeout(() => setModalVisible(true), 10); // allow render before animating in
    };

    const closeDetailsModal = () => {
        console.log("Closing modal"); // debug
        setModalVisible(false);
        setTimeout(() => {
            setModalOpen(false);
            setSelected(null);
        }, 300); // match transition duration
    };

    const handleShowAddForm = () => {
        setShowAddForm(true);
    };

    const handleCloseAddForm = () => {
        setShowAddForm(false);
        // Optionally, refresh announcements list if a new one was added
        fetchData(); 
    };

    // Filtered announcements
    const filteredAnnouncements = announcements.filter(a => {
        // Removed byMatch (text input)
        const typeMatch = filterType === "ALL" || (a.type && a.type.toLowerCase() === filterType.toLowerCase());
        const dateMatch = !filterDate || (a.timestamp && a.timestamp.toISOString().slice(0, 10) === filterDate);
        const byWhoMatch = a.by && a.by.toUpperCase() === filterByWho;
        return typeMatch && dateMatch && byWhoMatch;
    });

    const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
    const paginatedAnnouncements = filteredAnnouncements.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <>
            <Navbar />
            <div className="flex bg-gray-100 text-sm text-gray-800 min-h-screen">
                {/* Sidebar placeholder */}
                <div className="block w-64" />
                {/* Main Content */}
                <main className="flex-1 p-6 md:p-8 space-y-6">
                    {showAddForm ? (
                        <NewAnnouncement onFormClose={handleCloseAddForm} />
                    ) : (
                        <>
                            {/* Header */}
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-800">Announcement Board</h1>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleShowAddForm}
                                    className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Add New Announcement
                                </button>
                            </div>
                            {/* Filter Controls + Pagination */}
                            <div className="flex flex-wrap gap-4 mb-4 items-end justify-between">
                                <div className="flex gap-4 flex-wrap">
                                    <div>
                                        <select
                                            value={filterType}
                                            onChange={e => setFilterType(e.target.value)}
                                            className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                                            style={{ minWidth: 120 }}
                                        >
                                            <option value="ALL">ALL</option>
                                            <option value="Class">Class</option>
                                            <option value="Users">Users</option>
                                        </select>
                                    </div>
                                    <div>
                                        <input
                                            type="date"
                                            value={filterDate}
                                            onChange={e => setFilterDate(e.target.value)}
                                            className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                                            style={{ minWidth: 150 }}
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={filterByWho}
                                            onChange={e => setFilterByWho(e.target.value)}
                                            className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                                            style={{ minWidth: 120 }}
                                        >
                                            <option value="ADMIN">Admin</option>
                                            <option value="SYSTEM">SYSTEM</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-x-2">
                                    <label className="flex items-center gap-x-2 text-sm text-gray-700">
                                        <span>Rows:</span>
                                        <select
                                            className="py-2 px-3 pr-6 block border bg-white border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                                            value={itemsPerPage}
                                            onChange={e => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            style={{ minWidth: 60 }}
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </label>
                                    <nav className="flex items-center gap-x-1 ml-2" aria-label="Pagination">
                                        <button
                                            type="button"
                                            className="min-h-9.5 min-w-9.5 py-2 px-2.5 inline-flex justify-center items-center gap-x-2 text-sm rounded-lg text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
                                            aria-label="Previous"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <svg className="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m15 18-6-6 6-6"></path>
                                            </svg>
                                            <span className="sr-only">Previous</span>
                                        </button>
                                        <div className="flex items-center gap-x-1">
                                            <span className="bg-white min-h-9.5 min-w-9.5 flex justify-center items-center border border-gray-200 text-gray-800 py-2 px-3 text-sm rounded-lg focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none">
                                                {totalPages === 0 ? 0 : currentPage}
                                            </span>
                                            <span className="min-h-9.5 flex justify-center items-center text-gray-500 py-2 px-1.5 text-sm">of</span>
                                            <span className="min-h-9.5 flex justify-center items-center text-gray-500 py-2 px-1.5 text-sm">
                                                {totalPages}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="min-h-9.5 min-w-9.5 py-2 px-2.5 inline-flex justify-center items-center gap-x-2 text-sm rounded-lg text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
                                            aria-label="Next"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages || totalPages === 0}
                                        >
                                            <span className="sr-only">Next</span>
                                            <svg className="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m9 18 6-6-6-6"></path>
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                            {/* Announcements Table */}
                            <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">BY</th>
                                            <th className="px-6 py-3 font-medium">SUBJECT</th>
                                            <th className="px-6 py-3 font-medium">ANNOUNCEMENT</th>
                                            <th className="px-6 py-3 font-medium">TYPE</th>
                                            <th className="px-6 py-3 font-medium">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-4">Loading...</td>
                                            </tr>
                                        ) : error ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-4 text-red-500">{error}</td>
                                            </tr>
                                        ) : paginatedAnnouncements.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-4">No announcements found.</td>
                                            </tr>
                                        ) : (
                                            paginatedAnnouncements.map((announcement, idx) => (
                                                <tr key={announcement.id || idx} className="hover:bg-gray-50">
                                                    {/* Removed border-b to remove underline */}
                                                    <td className="px-6 py-3">{announcement.by}</td>
                                                    <td className="px-6 py-3">{announcement.subject}</td>
                                                    <td className="px-6 py-3 truncate max-w-xs">{announcement.announcement}</td>
                                                    <td className="px-6 py-3">{announcement.type || ''}</td>
                                                    <td className="px-6 py-3">
                                                        <button
                                                            className="text-blue-600 hover:underline"
                                                            onClick={() => {
                                                                console.log("Details button clicked for:", announcement); // debug
                                                                openDetailsModal(announcement);
                                                            }}
                                                        >
                                                            Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </main>
                {/* Offcanvas Modal for Announcement Details */}
                {modalOpen && selected && (
                    <div
                        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transition-transform duration-300 ${
                            modalVisible ? "translate-x-0" : "translate-x-full"
                        }`}
                        style={{ willChange: "transform" }}
                    >
                        <div className="p-6 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Announcement Details</h2>
                                <button
                                    onClick={closeDetailsModal}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="space-y-4 flex-grow">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-1">By</label>
                                    <input
                                        type="text"
                                        className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                                        value={selected.by || ""}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-1">To</label>
                                    <input
                                        type="text"
                                        className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                                        value={selected.type || ""}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-1">Subject</label>
                                    <input
                                        type="text"
                                        className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                                        value={selected.subject || ""}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-1">Announcement</label>
                                    <textarea
                                        rows={10}
                                        className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                                        value={selected.announcement || ""}
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="mt-auto pt-4">
                                <button
                                    onClick={closeDetailsModal}
                                    className="bg-white hover:bg-gray-100 border-neutral-200 border text-gray-800 w-full py-2 px-4 rounded focus:outline-none"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
