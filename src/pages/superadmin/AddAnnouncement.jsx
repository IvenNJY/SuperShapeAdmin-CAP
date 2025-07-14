import React, { useRef, useState, useEffect } from "react";
import "../../index.css";
import { db, auth } from "../../../backend/firebaseConfig";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";

export default function NewAnnouncement({ onFormClose }) {
    const subjectRef = useRef(null);
    const messageRef = useRef(null);
    const [type, setType] = useState("ALL");
    const [sendTo, setSendTo] = useState([]); // Array of selected recipients
    const [allUsers, setAllUsers] = useState([]); // For Users dropdown
    const [allClasses, setAllClasses] = useState([]); // For Classes dropdown
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAnimatingIn, setIsAnimatingIn] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef();

    // Add state for subject and message for validation
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (type === "Users") {
            getDocs(collection(db, "users")).then(snapshot => {
                setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        } else if (type === "Class") {
            getDocs(collection(db, "class")).then(snapshot => {
                setAllClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        }
    }, [type]);

    useEffect(() => {
        if (isModalOpen) {
            setIsAnimatingIn(false);
            const timer = setTimeout(() => {
                setIsAnimatingIn(true);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setIsAnimatingIn(false);
        }
    }, [isModalOpen]);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleTypeChange = (e) => {
        setType(e.target.value);
        setSendTo([]);
        setSearchTerm("");
    };

    const handleSendToChange = (id) => {
        if (sendTo.includes(id)) {
            setSendTo(sendTo.filter(x => x !== id));
        } else {
            setSendTo([...sendTo, id]);
        }
        setShowDropdown(true);
    };
    const handleRemovePill = (id) => {
        setSendTo(sendTo.filter(x => x !== id));
    };
    const handleInputFocus = () => {
        if (type !== "ALL") setShowDropdown(true);
    };
    const handleInputBlur = (e) => {
        // Delay hiding dropdown to allow click
        setTimeout(() => setShowDropdown(false), 150);
    };

    const executeSend = async () => {
        let toArr = [];
        if (type === "ALL") {
            toArr = ["ALL"];
        } else {
            toArr = sendTo;
        }
        const user = auth.currentUser;
        if (user) {
            const newAnnouncement = {
                by: "Admin", // or user.email if you want
                subject: subject.trim(),
                announcement: message.trim(),
                to: toArr,
                type: type,
                timestamp: serverTimestamp(),
            };
            try {
                await addDoc(collection(db, "Notification"), newAnnouncement);
                setSubject("");
                setMessage("");
                setSendTo([]);
                closeModal();
                if (onFormClose) onFormClose();
            } catch (e) {
                alert('Failed to send announcement. Please try again.');
                closeModal();
            }
        } else {
            alert('You must be logged in to send announcements.');
            closeModal();
        }
    };

    // Validation logic
    const isSubjectEmpty = subject.trim() === "";
    const isMessageEmpty = message.trim() === "";
    const isRecipientInvalid = type !== "ALL" && sendTo.length === 0;
    const isFormInvalid = isSubjectEmpty || isMessageEmpty || isRecipientInvalid;

    const handleSendClick = () => {
        if (!isFormInvalid) {
            openModal();
        } else {
            // Focus first invalid field
            if (isSubjectEmpty && subjectRef.current) subjectRef.current.focus();
            else if (isMessageEmpty && messageRef.current) messageRef.current.focus();
        }
    };

    // Filtered options for Users/Classes
    const filteredUsers = allUsers.filter(u =>
        (u.full_name || u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredClasses = allClasses.filter(c =>
        (c.title || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex bg-gray-100 text-sm text-gray-800 min-h-screen">
            <main className="flex-1 ">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">Add New Announcement</h1>
                        <p className="text-sm text-gray-500">Write an announcement and send it here</p>
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={onFormClose}
                            className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSendClick}
                            disabled={isFormInvalid}
                            className={`py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent ml-2 ${isFormInvalid ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            Send
                        </button>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                id="type"
                                name="type"
                                value={type}
                                onChange={handleTypeChange}
                                className="form-select w-full border rounded-lg px-3 py-2 text-sm border-gray-300"
                            >
                                <option value="ALL">ALL</option>
                                <option value="Users">Users</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="sendTo" className="block text-sm font-medium text-gray-700 mb-1">Send To</label>
                            {type === "ALL" ? (
                                <input
                                    type="text"
                                    id="sendTo"
                                    name="sendTo"
                                    value="ALL"
                                    disabled
                                    className="form-input w-full border rounded-lg px-3 py-2 text-sm border-gray-200 bg-gray-100 cursor-not-allowed"
                                />
                            ) : (
                                <div className="relative">
                                    <div
                                        className="flex flex-wrap items-center gap-1 border rounded-lg px-3 py-2 text-sm border-gray-300 bg-white min-h-[42px] focus-within:ring-2 focus-within:ring-blue-200"
                                        onClick={() => inputRef.current && inputRef.current.focus()}
                                    >
                                        {sendTo.map(id => {
                                            const option = type === "Users"
                                                ? allUsers.find(u => u.id === id)
                                                : allClasses.find(c => c.id === id);
                                            if (!option) return null;
                                            return (
                                                <span key={id} className="flex items-center bg-blue-100 text-blue-800 rounded-full px-2 py-1 mr-1 mb-1 text-xs">
                                                    {type === "Users" ? (option.full_name || option.email) : option.title}
                                                    <button
                                                        type="button"
                                                        className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none"
                                                        onClick={e => { e.stopPropagation(); handleRemovePill(id); }}
                                                        aria-label="Remove"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            );
                                        })}
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            placeholder={`Search ${type === "Users" ? "users" : "classes"}...`}
                                            value={searchTerm}
                                            onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                                            onFocus={handleInputFocus}
                                            onBlur={handleInputBlur}
                                            className="flex-1 min-w-[120px] border-0 focus:ring-0 outline-none p-0 bg-transparent text-sm"
                                        />
                                    </div>
                                    {showDropdown && (searchTerm.length > 0 || (type === "Users" ? filteredUsers.length : filteredClasses.length) > 0) && (
                                        <div className="absolute left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto border rounded-lg border-gray-200 bg-white shadow-lg">
                                            {(type === "Users" ? filteredUsers : filteredClasses).filter(option => !sendTo.includes(option.id)).length === 0 ? (
                                                <div className="px-3 py-2 text-gray-400">No {type === "Users" ? "users" : "classes"} found.</div>
                                            ) : (
                                                (type === "Users" ? filteredUsers : filteredClasses)
                                                    .filter(option => !sendTo.includes(option.id))
                                                    .map(option => (
                                                        <div
                                                            key={option.id}
                                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
                                                            onMouseDown={() => handleSendToChange(option.id)}
                                                        >
                                                            {type === "Users" ? (
                                                                <span>{option.full_name || option.email} <span className="text-xs text-gray-400">({option.email})</span></span>
                                                            ) : (
                                                                <span>{option.title}</span>
                                                            )}
                                                        </div>
                                                    ))
                                            )}
                                        </div>
                                    )}
                                    {sendTo.length > 0 && (
                                        <div className="mt-2 text-xs text-gray-600">
                                            Selected: {sendTo.length}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                placeholder="Enter subject"
                                ref={subjectRef}
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className={`form-input w-full border rounded-lg px-3 py-2 text-sm ${isSubjectEmpty ? 'border-red-500' : 'border-gray-300'}`}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="announcementMessage" className="block text-sm font-medium text-gray-700 mb-1">Announcement Message</label>
                        <div className={`border rounded-lg ${isMessageEmpty ? 'border-red-500' : 'border-gray-300'}` }>
                            <textarea
                                id="announcementMessage"
                                name="announcementMessage"
                                rows={10}
                                placeholder="Type your message"
                                ref={messageRef}
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                className="form-textarea w-full p-3 text-sm border-0 focus:ring-0 rounded-lg resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>
                {isModalOpen && (
                    <div className={`
                        fixed inset-0 z-[80] flex items-center justify-center
                        transition-all duration-300 ease-out 
                        ${isAnimatingIn ? 'bg-gray-500/50' : 'bg-opacity-0'}
                    `}>
                        <div className={`
                            bg-white rounded-xl shadow-sm m-3 sm:max-w-lg sm:w-full
                            transform transition-all duration-500 ease-out
                            ${isAnimatingIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                        `}>
                            <div className="p-4 sm:p-7">
                                <div className="text-center">
                                    <h2 className="block text-xl font-semibold text-gray-800">Confirm Send</h2>
                                    <p className="mt-2 text-sm text-gray-600">
                                        Are you sure you want to send this announcement?
                                    </p>
                                </div>
                                <div className="mt-5 sm:mt-8 grid grid-cols-2 gap-x-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="py-2 px-3 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={executeSend}
                                        className="py-2 px-3 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Confirm Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}