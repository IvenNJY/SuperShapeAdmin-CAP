import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router";
import { doc, getDoc, updateDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../../backend/firebaseConfig";
import Navbar from "./Navbar";
import ConfirmPopup from "../../components/ConfirmPopup";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ClassDetails() {
  const params = useParams();
  const uid = params.uid;
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [waitingListCount, setWaitingListCount] = useState(0);
  const [instructors, setInstructors] = useState([]);
  const [showValidation, setShowValidation] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImageUploading, setCoverImageUploading] = useState(false);

  // Helper functions
  const formatDate = (date) =>
    date ? (date instanceof Date ? date.toLocaleDateString("en-CA") : new Date(date).toLocaleDateString("en-CA")) : "-";

  const formatTime = (date) =>
    date ? (date instanceof Date ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })) : "-";

  // Helper to get input classes for validation
  const getInputClass = (field) => {
    if (!showValidation) return "border-gray-200";
    let isValid = true;
    switch (field) {
      case 'title':
      case 'instructor_id':
      case 'duration':
      case 'description':
        isValid = form[field]?.trim() !== '';
        break;
      case 'slot':
        isValid = form.slot > 0;
        break;
      case 'start_date_time':
        isValid = !!form.start_date_time;
        break;
      default:
        break;
    }
    return isValid ? "border-gray-200" : "border-red-500";
  };

  // Fetch class and instructor data
  useEffect(() => {
    async function fetchClassAndInstructors() {
      try {
        // Fetch instructors first
        const usersSnap = await getDocs(collection(db, "users"));
        const instructorsList = usersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.role === "instructor");
        setInstructors(instructorsList);

        if (!uid) {
          console.warn("No class UID provided.");
          setClassData(null);
          setLoading(false);
          return;
        }
        const docRef = doc(db, "class", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setClassData({
            ...docSnap.data(),
            start_date_time: docSnap.data().start_date_time?.toDate
              ? docSnap.data().start_date_time.toDate()
              : new Date(docSnap.data().start_date_time),
          });
          // Fetch waiting list count
          try {
            const waitingListRef = collection(db, "class", uid, "Waiting_lists");
            const waitingListSnap = await getDocs(waitingListRef);
            setWaitingListCount(waitingListSnap.size || 0);
          } catch (err) {
            setWaitingListCount(0);
            throw err; // Re-throw to handle in outer catch
          }
        } else {
          console.log("Class not found with UID:", uid);
          setClassData(null);
          setWaitingListCount(0);
        }
      } catch (e) {
        console.error("Error fetching class:", e);
        setClassData(null);
        setWaitingListCount(0);
      } finally {
        setLoading(false);
      }
    }
    fetchClassAndInstructors();
  }, [uid]);

  // When classData loads, update form if not editing
  useEffect(() => {
    if (classData && !editMode) {
      setForm({
        title: classData.title || '',
        instructor: classData.instructor || '',
        instructor_id: classData.instructor_id || '',
        start_date_time: classData.start_date_time || '',
        duration: classData.duration || '',
        slot: classData.slot || 0,
        description: classData.description || '',
        placeholder_image: classData.placeholder_image || '',
        class_type: classData.class_type || '',
        type: classData.type || 'group',
      });
    }
  }, [classData, editMode]);

  // Calculate end time and if the class has ended
  const { endTime, classHasEnded } = useMemo(() => {
    const targetData = editMode ? form : classData;
    if (targetData && targetData.start_date_time && targetData.duration) {
      const start = targetData.start_date_time instanceof Date ? targetData.start_date_time : new Date(targetData.start_date_time);
      const match = String(targetData.duration).match(/(\d+)\s*hour[s]?\s*(\d+)?/i);
      let minutes = 0;
      if (match) {
        minutes += parseInt(match[1] || "0") * 60;
        if (match[2]) minutes += parseInt(match[2]);
      } else if (/\d+/.test(targetData.duration)) {
        minutes = parseInt(String(targetData.duration));
      }
      const end = new Date(start.getTime() + minutes * 60000);
      return { endTime: formatTime(end), classHasEnded: end < new Date() };
    }
    return { endTime: "-", classHasEnded: false };
  }, [classData, form, editMode]);

  // Validation for Save button
  const isFormValid = useMemo(() => {
    return (
      form.title?.trim() !== "" &&
      form.instructor_id?.trim() !== "" &&
      form.slot > 0 &&
      form.start_date_time &&
      form.duration?.trim() !== "" &&
      form.description?.trim() !== ""
    );
  }, [form]);

  const handleEdit = () => setEditMode(true);
  const handleRemove = () => setShowRemoveConfirm(true);
  const handleCancel = () => {
    if (editMode) {
      setShowDiscardConfirm(true);
    } else {
      setEditMode(false);
      if (classData) {
        setForm({
          title: classData.title || '',
          instructor: classData.instructor || '',
          instructor_id: classData.instructor_id || '',
          start_date_time: classData.start_date_time || '',
          duration: classData.duration || '',
          slot: classData.slot || 0,
          description: classData.description || '',
          placeholder_image: classData.placeholder_image || '',
        });
      }
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleInstructorChange = e => {
    const selectedId = e.target.value;
    const selected = instructors.find(i => i.id === selectedId);
    setForm(f => ({
      ...f,
      instructor_id: selectedId,
      instructor: selected ? selected.full_name || selected.name : "",
    }));
  };

  const handleSave = () => {
    setShowValidation(true);
    if (isFormValid) {
      setShowSaveConfirm(true);
    }
  };

  const handleConfirmSave = async () => {
    try {
      setLoading(true);
      let placeholderImageUrl = form.placeholder_image;
      if (coverImageFile && coverImageFile instanceof File) {
        placeholderImageUrl = await uploadCoverImage(coverImageFile, uid);
      }
      const docRef = doc(db, "class", uid);
      await updateDoc(docRef, {
        title: form.title,
        instructor: form.instructor,
        instructor_id: form.instructor_id,
        start_date_time: form.start_date_time instanceof Date ? Timestamp.fromDate(form.start_date_time) : Timestamp.fromDate(new Date(form.start_date_time)),
        duration: form.duration,
        slot: Number(form.slot),
        description: form.description,
        placeholder_image: placeholderImageUrl,
      });
      setClassData((prev) => ({ ...prev, ...form, placeholder_image: placeholderImageUrl }));
      setEditMode(false);
      setCoverImageFile(null);
    } catch (e) {
      alert("Failed to save changes.");
      throw e;
    } finally {
      setLoading(false);
      setShowSaveConfirm(false);
    }
  };
  const handleConfirmRemove = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "class", uid);
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(docRef); // Hard delete the class document
      window.history.back();
    } catch (e) {
      alert("Failed to remove class.");
      throw e; // Re-throw to handle in outer catch
    } finally {
      setLoading(false);
      setShowRemoveConfirm(false);
    }
  };
  const handleConfirmDiscard = () => {
    setEditMode(false);
    setShowDiscardConfirm(false);
    if (classData) {
      setForm({
        title: classData.title || '',
        instructor: classData.instructor || '',
        instructor_id: classData.instructor_id || '',
        start_date_time: classData.start_date_time || '',
        duration: classData.duration || '',
        slot: classData.slot || 0,
        description: classData.description || '',
        placeholder_image: classData.placeholder_image || '',
      });
    }
  };

  const handleCoverImageChange = e => {
    if (e.target.files && e.target.files[0]) {
      setCoverImageFile(e.target.files[0]);
      setForm(prev => ({ ...prev, placeholder_image: e.target.files[0] })); // Temporarily store file object
    }
  };

  const uploadCoverImage = async (file, classId) => {
    if (!file) return "";
    const storage = getStorage();
    const fileRef = storageRef(storage, `class/${classId}_cover.jpg`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Navbar />
        <main className="flex-1 p-6 md:p-8">Loading...</main>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Navbar />
        <main className="flex-1 p-6 md:p-8">
          <h1 className="text-2xl font-semibold text-gray-800">Class Not Found</h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Navbar />
      <main className="flex-1 p-6 md:p-8 space-y-6 md:ml-64">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{classData.title || "Class Details"}</h1>
            <p className="text-sm text-gray-500 mr-2 inline-block">{classData.class_type || classData.type || "Class"}</p>
            {classHasEnded && <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">Ended</span>}
          </div>
          <div className="flex space-x-3">
            {editMode ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={`py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-500 text-white hover:bg-blue-600 ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isFormValid}
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                {/* Only show Edit button if class has NOT ended */}
                {!classHasEnded && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Edit
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-red-500 text-white hover:bg-red-600"
              disabled={classHasEnded}
            >
              Remove
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
                  {editMode ? (
                    <input
                      type="text"
                      id="title-input"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('title')}`}
                    />
                  ) : (
                    <input
                      type="text"
                      id="title-input"
                      name="title"
                      value={classData.title || ""}
                      className="py-3 px-4 border border-gray-200 rounded-lg text-sm bg-gray-100 w-full"
                      readOnly
                    />
                  )}
                </div>
                {/* Type */}
                <div className="flex flex-col">
                  <label htmlFor="class-type-input" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <input
                    type="text"
                    id="class-type-input"
                    name="class-type"
                    value={classData.class_type || ""}
                    className="py-3 px-4 border border-gray-200 rounded-lg text-sm bg-gray-100 w-full"
                    readOnly
                  />
                </div>
                {/* Instructor */}
                <div className="flex flex-col">
                  <label htmlFor="instructor-input" className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                  {editMode ? (
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
                  ) : (
                    <input
                      type="text"
                      id="instructor-input"
                      name="instructor"
                      value={classData.instructor || ""}
                      className="py-3 px-4 border border-gray-200 rounded-lg text-sm bg-gray-100 w-full"
                      readOnly
                    />
                  )}
                </div>
                {/* Capacity */}
                <div className="flex flex-col">
                  <label htmlFor="capacity-input" className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  {editMode ? (
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="capacity-input"
                        name="slot"
                        value={form.slot}
                        onChange={handleChange}
                        className={`py-3 px-4 w-20 text-left border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 mr-2 ${getInputClass('slot')}`}
                        style={{ textAlign: 'left' }}
                      />
                      <button type="button" className="p-2 inline-flex items-center justify-center text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 mr-1" onClick={() => setForm(prev => ({ ...prev, slot: Math.max(0, Number(prev.slot) - 1) }))}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                        </svg>
                      </button>
                      <button type="button" className="p-2 inline-flex items-center justify-center text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50" onClick={() => setForm(prev => ({ ...prev, slot: Number(prev.slot) + 1 }))}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <input
                      type="number"
                      id="capacity-input"
                      name="capacity"
                      value={classData.slot || 0}
                      className="py-3 px-4 w-20 text-left border border-gray-200 rounded-lg text-sm bg-gray-100"
                      style={{ textAlign: 'left' }}
                      readOnly
                    />
                  )}
                </div>
                {/* Date */}
                <div className="flex flex-col">
                  <label htmlFor="date-input" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  {editMode ? (
                    <input
                      type="date"
                      id="date-input"
                      name="start_date_time"
                      value={form.start_date_time ? (typeof form.start_date_time === 'string' ? form.start_date_time.split('T')[0] : (form.start_date_time instanceof Date ? form.start_date_time.toISOString().split('T')[0] : '')) : ''}
                      onChange={e => setForm(prev => ({ ...prev, start_date_time: new Date(e.target.value + 'T' + (form.start_date_time instanceof Date ? form.start_date_time.toTimeString().slice(0,5) : '00:00')) }))}
                      className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('start_date_time')}`}
                    />
                  ) : (
                    <input
                      type="text"
                      id="date-input"
                      name="date"
                      value={formatDate(classData.start_date_time)}
                      className="py-3 px-4 border border-gray-200 rounded-lg text-sm bg-gray-100 w-full"
                      readOnly
                    />
                  )}
                </div>
                {/* Start Time */}
                <div className="flex flex-col">
                  <label htmlFor="start-time-input" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  {editMode ? (
                    <input
                      type="time"
                      id="start-time-input"
                      name="start_time"
                      value={form.start_date_time ? (typeof form.start_date_time === 'string' ? form.start_date_time.split('T')[1]?.slice(0,5) : (form.start_date_time instanceof Date ? form.start_date_time.toTimeString().slice(0,5) : '')) : ''}
                      onChange={e => setForm(prev => ({ ...prev, start_date_time: new Date((form.start_date_time instanceof Date ? form.start_date_time.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]) + 'T' + e.target.value) }))}
                      className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('start_date_time')}`}
                    />
                  ) : (
                    <input
                      type="text"
                      id="start-time-input"
                      name="start-time"
                      value={formatTime(classData.start_date_time)}
                      className="py-3 px-4 border border-gray-200 rounded-lg text-sm bg-gray-100 w-full"
                      readOnly
                    />
                  )}
                </div>
                {/* End Time */}
                <div className="flex flex-col">
                  <label htmlFor="end-time-input" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  {editMode ? (
                    <input
                      type="time"
                      id="end-time-input"
                      name="end_time"
                      value={form.end_time || (form.start_date_time && form.duration ? (() => {
                        const start = form.start_date_time instanceof Date ? form.start_date_time : new Date(form.start_date_time);
                        let minutes = 0;
                        const match = form.duration?.match(/(\d+)\s*hour[s]?\s*(\d+)?/i);
                        if (match) {
                          minutes += parseInt(match[1] || "0") * 60;
                          if (match[2]) minutes += parseInt(match[2]);
                        } else if (/\d+/.test(form.duration)) {
                          minutes = parseInt(form.duration);
                        }
                        const end = new Date(start.getTime() + minutes * 60000);
                        return end.toTimeString().slice(0,5);
                      })() : '')}
                      onChange={e => {
                        if (form.start_date_time) {
                          const start = form.start_date_time instanceof Date ? form.start_date_time : new Date(form.start_date_time);
                          const [endHour, endMin] = e.target.value.split(":").map(Number);
                          const end = new Date(start);
                          end.setHours(endHour, endMin, 0, 0);
                          let diff = (end - start) / 60000;
                          if (diff < 0) diff += 24 * 60;
                          const hours = Math.floor(diff / 60);
                          const mins = diff % 60;
                          setForm(prev => ({
                            ...prev,
                            end_time: e.target.value,
                            duration: `${hours > 0 ? hours + ' hour' + (hours > 1 ? 's' : '') : ''}${hours > 0 && mins > 0 ? ' ' : ''}${mins > 0 ? mins : ''}`.trim()
                          }));
                        }
                      }}
                      className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('end_time')}`}
                    />
                  ) : (
                    <input
                      type="text"
                      id="end-time-input"
                      name="end-time"
                      value={endTime}
                      className="py-3 px-4 border border-gray-200 rounded-lg text-sm bg-gray-100 w-full"
                      readOnly
                    />
                  )}
                </div>
                {/* Duration */}
                <div className="flex flex-col">
                  <label htmlFor="duration-input" className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  {editMode ? (
                    <input
                      type="text"
                      id="duration-input"
                      name="duration"
                      value={form.duration}
                      onChange={handleChange}
                      className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full ${getInputClass('duration')}`}
                    />
                  ) : (
                    <input
                      type="text"
                      id="duration-input"
                      name="duration"
                      value={classData.duration || ""}
                      className="py-3 px-4 border border-gray-200 rounded-lg text-sm bg-gray-100 w-full"
                      readOnly
                    />
                  )}
                </div>
                {/* Description (spans all columns) */}
                <div className="md:col-span-3 flex flex-col">
                  <label htmlFor="description-input" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  {editMode ? (
                    <textarea
                      id="description-input"
                      name="description"
                      rows={4}
                      className={`py-3 px-4 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 w-full min-h-[80px] ${getInputClass('description')}`}
                      value={form.description}
                      onChange={handleChange}
                    />
                  ) : (
                    <textarea
                      id="description-input"
                      name="description"
                      rows={4}
                      className="py-3 px-4 border border-gray-200 rounded-lg text-sm bg-gray-100 w-full min-h-[80px]"
                      value={classData.description || ""}
                      readOnly
                    />
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Class List */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
              <div className="mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md w-full">
                {editMode ? (
                  <>
                    {form.placeholder_image && form.placeholder_image instanceof File ? (
                      <img
                        src={URL.createObjectURL(form.placeholder_image)}
                        alt="Class Cover Preview"
                        className="h-32 w-auto object-cover rounded mb-2"
                      />
                    ) : form.placeholder_image ? (
                      <img
                        src={form.placeholder_image}
                        alt="Class Cover"
                        className="h-32 w-auto object-cover rounded mb-2"
                      />
                    ) : (
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="mt-2 border border-gray-300 rounded-lg py-2 px-3 w-full text-sm bg-white cursor-pointer"
                      style={{ textAlign: 'center' }}
                    />
                  </>
                ) : (
                  classData.placeholder_image ? (
                    <img
                      src={classData.placeholder_image}
                      alt="Class Cover"
                      className="h-32 w-auto object-cover rounded"
                    />
                  ) : (
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )
                )}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow flex flex-col gap-4 items-start">
              <div className="flex justify-between items-center w-full">
                <h3 className="text-lg font-medium text-gray-800">
                  Class Status
                </h3>
                <a
                  href={`/admin/assignstudent/${classData.id || uid}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Assign Students
                </a>
              </div>
              {/* Preline UI status bar */}
              <div className="w-full flex flex-col gap-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Capacity:</span>
                  <span className="font-semibold text-gray-800">{classData.booked || 0} / {classData.slot || 0}</span>
                </div>
                <div className="w-full mt-2">
                  {/* Preline UI progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${classData.booked >= classData.slot ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${classData.slot ? Math.min(100, (classData.booked / classData.slot) * 100) : 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs">
                    <span className={`font-semibold ${classData.booked >= classData.slot ? 'text-red-600' : 'text-green-600'}`}>{classData.booked >= classData.slot ? 'Full' : 'Open'}</span>
                    <span className="text-gray-500">{classData.slot || 0} slots</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Waiting List:</span>
                  <span className="font-semibold text-gray-800">{waitingListCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Remove Confirm Popup */}
      {showRemoveConfirm && (
        <ConfirmPopup
          open={showRemoveConfirm}
          title="Remove Class"
          message="Are you sure you want to remove this class? This action cannot be undone."
          onConfirm={handleConfirmRemove}
          onCancel={() => setShowRemoveConfirm(false)}
          confirmText="Remove"
          color="red"
          fade={true}
        />
      )}
      {/* Discard Confirm Popup */}
      {showDiscardConfirm && (
        <ConfirmPopup
          open={showDiscardConfirm}
          title="Discard Changes"
          message="Discard all unsaved changes?"
          onConfirm={handleConfirmDiscard}
          onCancel={() => setShowDiscardConfirm(false)}
          confirmText="Discard"
          color="red"
          fade={true}
        />
      )}
      {/* Save Confirm Popup */}
      {showSaveConfirm && (
        <ConfirmPopup
          open={showSaveConfirm}
          title="Save Changes"
          message="Are you sure you want to save these changes?"
          onConfirm={handleConfirmSave}
          onCancel={() => setShowSaveConfirm(false)}
          confirmText="Save"
          color="blue"
          fade={true}
        />
      )}
    </div>
  );
}
