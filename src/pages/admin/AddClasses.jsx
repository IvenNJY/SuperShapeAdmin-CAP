import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../../backend/firebaseConfig";
import Navbar from "./Navbar";
import ConfirmPopup from "../../components/ConfirmPopup";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AddClasses() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    class_type: "",
    credit: 1,
    description: "",
    duration: "1 hour",
    instructor: "",
    instructor_id: "",
    instructor_image: "",
    placeholder_image: "",
    slot: 0,
    start_date_time: "",
    type: "group",
    booked: 0,
  });
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [placeholderImageFile, setPlaceholderImageFile] = useState(null);
  const [instructorImageFile, setInstructorImageFile] = useState(null);
  const [error, setError] = useState("");
  const [classTypeOptions, setClassTypeOptions] = useState([]);
  const [showCustomClassType, setShowCustomClassType] = useState(false);

  useEffect(() => {
    // Fetch all users with role instructor
    async function fetchInstructors() {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const instructorsList = usersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.role === "instructor");
        setInstructors(instructorsList);
      } catch (e) {
        setInstructors([]);
      }
    }
    fetchInstructors();

    // Fetch unique class_type from Credit_Packages
    async function fetchClassTypes() {
      try {
        const snap = await getDocs(collection(db, "Credit_Packages"));
        const types = Array.from(new Set(snap.docs.map(doc => doc.data().class_type).filter(Boolean)));
        setClassTypeOptions(types);
      } catch (e) {
        setClassTypeOptions([]);
      }
    }
    fetchClassTypes();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Handle instructor select
  const handleInstructorChange = e => {
    const selectedId = e.target.value;
    const selected = instructors.find(i => i.id === selectedId);
    setForm(f => ({
      ...f,
      instructor_id: selectedId,
      instructor: selected ? selected.full_name || selected.name : "",
      instructor_image: selected ? selected.photo_url : ""
    }));
  };

  // Handle image uploads
  const uploadImage = async (file, path) => {
    if (!file) return "";
    const storage = getStorage();
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handlePlaceholderImageChange = e => {
    if (e.target.files && e.target.files[0]) {
      setPlaceholderImageFile(e.target.files[0]);
    }
  };
  const handleInstructorImageChange = e => {
    if (e.target.files && e.target.files[0]) {
      setInstructorImageFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      let placeholder_image = form.placeholder_image;
      let instructor_image = form.instructor_image;
      if (placeholderImageFile) {
        placeholder_image = await uploadImage(placeholderImageFile, `class/${Date.now()}_cover.jpg`);
      }
      if (instructorImageFile) {
        instructor_image = await uploadImage(instructorImageFile, `class/${Date.now()}_instructor.jpg`);
      }
      // Parse start_date_time
      let start_date_time = form.start_date_time;
      if (typeof start_date_time === "string" && start_date_time) {
        // Expecting format: yyyy-mm-ddTHH:MM
        start_date_time = Timestamp.fromDate(new Date(start_date_time));
      }
      const newClass = {
        ...form,
        placeholder_image,
        instructor_image,
        start_date_time,
        booked: 0,
        credit: Number(form.credit),
        slot: Number(form.slot),
      };
      await addDoc(collection(db, "class"), newClass);
      navigate(-1);
    } catch (e) {
      setError("Failed to add class.");
    }
    setLoading(false);
    setShowSaveConfirm(false);
  };

  // Helper for end time
  const formatTime = date => date ? new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : "-";
  let endTime = "-";
  if (form.start_date_time && form.duration) {
    const start = new Date(form.start_date_time);
    const match = form.duration.match(/(\d+)\s*hour[s]?\s*(\d+)?/i);
    let minutes = 0;
    if (match) {
      minutes += parseInt(match[1] || "0") * 60;
      if (match[2]) minutes += parseInt(match[2]);
    }
    if (!match && /\d+/.test(form.duration)) {
      minutes = parseInt(form.duration);
    }
    const end = new Date(start.getTime() + minutes * 60000);
    endTime = formatTime(end);
  }

  // Validation for Add Class button
  const isFormValid =
    form.title.trim() !== "" &&
    form.class_type.trim() !== "" &&
    form.instructor_id.trim() !== "" &&
    form.slot > 0 &&
    form.start_date_time !== "" &&
    form.duration.trim() !== "" &&
    form.credit > 0 &&
    form.type.trim() !== "" &&
    form.description.trim() !== "";

  // State to track if user has tried to save, to show validation errors
  const [showValidation, setShowValidation] = useState(false);

  const handleAttemptSave = () => {
    setShowValidation(true); // Show validation feedback
    if (isFormValid) {
      setShowSaveConfirm(true); // If form is valid, show confirmation
    }
  };

  // Helper to get input classes
  const getInputClass = (field) => {
    let isValid = true;
    switch (field) {
      case 'title':
      case 'class_type':
      case 'instructor_id':
      case 'duration':
      case 'type':
      case 'description':
        isValid = form[field].trim() !== '';
        break;
      case 'slot':
        isValid = form.slot > 0;
        break;
      case 'start_date_time':
        isValid = form.start_date_time !== '';
        break;
      case 'credit':
        isValid = form.credit > 0;
        break;
      default:
        break;
    }
    return isValid ? "border-gray-200" : "border-red-500";
  };

  const handleClassTypeChange = e => {
    const value = e.target.value;
    if (value === "__other__") {
      setShowCustomClassType(true);
      setForm(f => ({ ...f, class_type: "" }));
    } else {
      setShowCustomClassType(false);
      setForm(f => ({ ...f, class_type: value }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Navbar />
      <main className="flex-1 p-6 md:p-8 space-y-6 md:ml-64">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Add Class</h1>
            <p className="text-sm text-gray-500">Create a new class</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-500 text-white hover:bg-blue-600 ${(!isFormValid || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleAttemptSave}
              disabled={loading || !isFormValid}
            >
              {loading ? "Saving..." : "Add Class"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Class Form */}
          <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow w-full max-w-4xl mx-auto" style={{ height: 'auto', minHeight: 0, alignSelf: 'flex-start' }}>
            <form className="space-y-8" onSubmit={e => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Title */}
                <div className="flex flex-col">
                  <label htmlFor="title-input" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    id="title-input"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('title')}`}
                  />
                </div>
                {/* Class Type Dropdown + Custom */}
                <div className="flex flex-col">
                  <label htmlFor="class-type-input" className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                  <select
                    id="class-type-input"
                    name="class_type"
                    value={form.class_type}
                    onChange={handleClassTypeChange}
                    className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('class_type')}`}
                  >
                    <option value="">Select Class Type</option>
                    {classTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {showCustomClassType && (
                    <input
                      type="text"
                      name="class_type"
                      placeholder="Enter custom class type"
                      value={form.class_type}
                      onChange={handleChange}
                      className={`mt-2 py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('class_type')}`}
                    />
                  )}
                </div>
                {/* Instructor */}
                <div className="flex flex-col">
                  <label htmlFor="instructor-input" className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                  <select
                    id="instructor-input"
                    name="instructor_id"
                    value={form.instructor_id}
                    onChange={handleInstructorChange}
                    className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('instructor_id')}`}
                  >
                    <option value="">Select Instructor</option>
                    {instructors.map(i => (
                      <option key={i.id} value={i.id}>{i.full_name || i.name}</option>
                    ))}
                  </select>
                </div>
                {/* Capacity */}
                <div className="flex flex-col">
                  <label htmlFor="capacity-input" className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    id="capacity-input"
                    name="slot"
                    value={form.slot}
                    onChange={handleChange}
                    className={`py-3 px-4 w-20 text-left border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 ${getInputClass('slot')}`}
                    style={{ textAlign: 'left' }}
                  />
                </div>
                {/* Date */}
                <div className="flex flex-col">
                  <label htmlFor="date-input" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    id="date-input"
                    name="date"
                    value={form.start_date_time ? (typeof form.start_date_time === 'string' ? form.start_date_time.split('T')[0] : new Date(form.start_date_time).toISOString().split('T')[0]) : ''}
                    onChange={e => {
                      setForm(prev => ({
                        ...prev,
                        start_date_time: e.target.value + 'T' + (form.start_date_time && typeof form.start_date_time === 'string' && form.start_date_time.includes('T') ? form.start_date_time.split('T')[1] : '00:00')
                      }));
                    }}
                    className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('start_date_time')}`}
                  />
                </div>
                {/* Start Time */}
                <div className="flex flex-col">
                  <label htmlFor="start-time-input" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    id="start-time-input"
                    name="start_time"
                    value={form.start_date_time && typeof form.start_date_time === 'string' && form.start_date_time.includes('T') ? form.start_date_time.split('T')[1].slice(0,5) : ''}
                    onChange={e => {
                      setForm(prev => ({
                        ...prev,
                        start_date_time: (form.start_date_time && typeof form.start_date_time === 'string' ? form.start_date_time.split('T')[0] : new Date().toISOString().split('T')[0]) + 'T' + e.target.value
                      }));
                    }}
                    className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('start_date_time')}`}
                  />
                </div>
                {/* End Time */}
                <div className="flex flex-col">
                  <label htmlFor="end-time-input" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="text"
                    id="end-time-input"
                    name="end-time"
                    value={endTime}
                    className="py-3 px-4 border border-gray-200 rounded-lg text-sm bg-gray-100 w-full"
                    readOnly
                  />
                </div>
                {/* Duration */}
                <div className="flex flex-col">
                  <label htmlFor="duration-input" className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    id="duration-input"
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('duration')}`}
                  />
                </div>
                {/* Credit */}
                <div className="flex flex-col">
                  <label htmlFor="credit-input" className="block text-sm font-medium text-gray-700 mb-1">Credit</label>
                  <input
                    type="number"
                    id="credit-input"
                    name="credit"
                    value={form.credit}
                    onChange={handleChange}
                    className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('credit')}`}
                  />
                </div>
                {/* Type (group/event) */}
                <div className="flex flex-col">
                  <label htmlFor="type-input" className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                  <select
                    id="type-input"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('type')}`}
                  >
                    <option value="group">Group</option>
                    <option value="private">Private</option>
                    <option value="trial">Trial</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                {/* Description (spans all columns) */}
                <div className="md:col-span-3 flex flex-col">
                  <label htmlFor="description-input" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="description-input"
                    name="description"
                    rows={4}
                    className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full min-h-[80px] ${getInputClass('description')}`}
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Images */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md w-full">
                {form.placeholder_image || placeholderImageFile ? (
                  <img
                    src={placeholderImageFile ? URL.createObjectURL(placeholderImageFile) : form.placeholder_image}
                    alt="Class Cover"
                    className="h-32 w-auto object-cover rounded"
                  />
                ) : (
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handlePlaceholderImageChange} className="mt-2" />
            </div>
            <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Image</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md w-full">
                {form.instructor_image || instructorImageFile ? (
                  <img
                    src={instructorImageFile ? URL.createObjectURL(instructorImageFile) : form.instructor_image}
                    alt="Instructor"
                    className="h-32 w-auto object-cover rounded"
                  />
                ) : (
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleInstructorImageChange} className="mt-2" />
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </main>
      {/* Save Confirm Popup */}
      <ConfirmPopup
        open={showSaveConfirm}
        title="Add Class"
        message="Are you sure you want to add this class?"
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirm(false)}
        confirmText="Add"
        color="blue"
        fade={true}
      />
    </div>
  );
}
