import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { db } from "../../../backend/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import ConfirmPopup from "../../components/ConfirmPopup";

export default function Settings() {
  // State for form fields
  const [studioName, setStudioName] = useState("Super ShapeWellness");
  const [phoneNumber, setPhoneNumber] = useState("012-1234567");
  const [email, setEmail] = useState("sswellness@gmail.com");
  const [operatingHours, setOperatingHours] = useState("08:00 - 22:00");
  const [activeTab, setActiveTab] = useState("declarations");
  const [declarations, setDeclarations] = useState([]);
  const [declarationsId, setDeclarationsId] = useState("");
  const [loadingDeclarations, setLoadingDeclarations] = useState(false);
  const [declarationsError, setDeclarationsError] = useState("");
  const [termsSections, setTermsSections] = useState([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [termsError, setTermsError] = useState("");

  // New states for studio settings save confirmation
  const [showStudioSaveConfirm, setShowStudioSaveConfirm] = useState(false);
  const [studioSaving, setStudioSaving] = useState(false);
  const [studioSaveError, setStudioSaveError] = useState("");

  useEffect(() => {
    // Fetch Declarations from Firestore (single doc, array field)
    const fetchDeclarations = async () => {
      setLoadingDeclarations(true);
      setDeclarationsError("");
      try {
        const querySnapshot = await getDocs(collection(db, "declarations"));
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          setDeclarations(docSnap.data().points || []); // Use 'points' field
          setDeclarationsId(docSnap.id);
        }
      } catch (err) {
        setDeclarationsError("Failed to load Declarations." + err.message);
      }
      setLoadingDeclarations(false);
    };
    fetchDeclarations();
  }, []);

  useEffect(() => {
    // Fetch Terms & Conditions sections from Firestore
    const fetchTerms = async () => {
      setLoadingTerms(true);
      setTermsError("");
      try {
        const querySnapshot = await getDocs(collection(db, "terms_and_conditions"));
        const docs = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        setTermsSections(docs);
      } catch (err) {
        setTermsError("Failed to load Terms & Conditions." + err.message);
      }
      setLoadingTerms(false);
    };
    fetchTerms();
  }, []);

  // Save Studio Settings
  const handleStudioSave = async () => {
    setStudioSaving(true);
    setStudioSaveError("");
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "General_Setting", "default"), {
        studioName,
        phoneNumber,
        email,
        operatingHours,
      });
      setShowStudioSaveConfirm(false);
    } catch (err) {
      setStudioSaveError("Failed to save studio settings: " + err.message);
    }
    setStudioSaving(false);
  };

  // Validation for studio fields
  const studioFields = [studioName, phoneNumber, email, operatingHours];
  const studioFieldsValid = studioFields.every(f => f && f.trim() !== "");

  return (
    <>
      <Navbar />
      <div className="flex flex-col md:flex-row bg-gray-100 text-sm text-gray-800 min-h-screen">
        <div className="block w-full md:w-64 mb-4 md:mb-0" />
        <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Studio Settings</h1>
              <p className="text-sm text-gray-500">The details for the studio</p>
            </div>
            <div className="w-full sm:w-auto">
              <button type="button" onClick={() => setShowStudioSaveConfirm(true)} disabled={!studioFieldsValid} className={`w-full sm:w-auto py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent ${studioFieldsValid ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}>
                Save
              </button>
            </div>
          </div>

          {/* Studio Details Form */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Studio Name</label>
                <div className="relative">
                  <input type="text" value={studioName} onChange={e => setStudioName(e.target.value)} className={`form-input w-full border rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${!studioName.trim() ? 'border-red-500' : 'border-gray-300'}`} />
                  {!studioName.trim() && <span className="text-xs text-red-500 absolute left-0 -bottom-5">Required</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className={`form-input w-full border rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${!phoneNumber.trim() ? 'border-red-500' : 'border-gray-300'}`} />
                  {!phoneNumber.trim() && <span className="text-xs text-red-500 absolute left-0 -bottom-5">Required</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={`form-input w-full border rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${!email.trim() ? 'border-red-500' : 'border-gray-300'}`} />
                  {!email.trim() && <span className="text-xs text-red-500 absolute left-0 -bottom-5">Required</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
                <div className="relative">
                  <input type="text" value={operatingHours} onChange={e => setOperatingHours(e.target.value)} className={`form-input w-full border rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${!operatingHours.trim() ? 'border-red-500' : 'border-gray-300'}`} />
                  {!operatingHours.trim() && <span className="text-xs text-red-500 absolute left-0 -bottom-5">Required</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Policies Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="md:col-span-1">
              <div className="bg-white p-4 rounded-lg shadow mb-4 md:mb-0">
                <ul className="space-y-1 flex md:block flex-row md:flex-col">
                  <li className="flex-1">
                    <button type="button" className={`block py-2 px-3 text-sm rounded-lg text-center md:text-left ${activeTab === 'declarations' ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setActiveTab('declarations')}>
                      Declarations
                    </button>
                  </li>
                  <li className="flex-1">
                    <button type="button" className={`block py-2 px-3 text-sm rounded-lg text-center md:text-left ${activeTab === 'terms' ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setActiveTab('terms')}>
                      Terms & Conditions
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:col-span-2">
              {activeTab === 'declarations' && (
                <div className="policy-content bg-white p-4 sm:p-6 rounded-lg shadow">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Declarations</label>
                  <div className="border rounded-lg p-4 bg-gray-50 space-y-6">
                    {loadingDeclarations && <div className="text-gray-500">Loading Declarations...</div>}
                    {declarationsError && <div className="text-red-500">{declarationsError}</div>}
                    {!loadingDeclarations && !declarationsError && (
                      <DeclarationsEditor
                        declarations={declarations}
                        onChange={setDeclarations}
                        onSave={async (newArr) => {
                          try {
                            const { doc, updateDoc } = await import("firebase/firestore");
                            await updateDoc(doc(db, "declarations", declarationsId), { points: newArr }); // Save to 'points' field
                            setDeclarations(newArr);
                          } catch (err) {
                            setDeclarationsError("Failed to save declarations: " + err.message);
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'terms' && (
                <div className="policy-content bg-white p-4 sm:p-6 rounded-lg shadow">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                  <div className="border rounded-lg p-4 bg-gray-50 space-y-6">
                    {loadingTerms && <div className="text-gray-500">Loading Terms & Conditions...</div>}
                    {termsError && <div className="text-red-500">{termsError}</div>}
                    {!loadingTerms && !termsError && termsSections.length === 0 && (
                      <div className="text-gray-500">No Terms & Conditions found.</div>
                    )}
                    {termsSections.map((section, idx) => (
                      <TermsSectionEditor
                        key={section.id || idx}
                        sectionDoc={section}
                        onSave={async (updatedSection) => {
                          try {
                            const { doc, updateDoc } = await import("firebase/firestore");
                            let docId = section.id;
                            if (!docId) throw new Error("Section document is missing an id field.");
                            await updateDoc(doc(db, "terms_and_conditions", docId), updatedSection);
                            setTermsSections(prev => prev.map((s, i) => i === idx ? { ...s, ...updatedSection } : s));
                          } catch (err) {
                            setTermsError("Failed to save section: " + err.message);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <ConfirmPopup
        open={showStudioSaveConfirm}
        title="Save Studio Settings"
        message="Are you sure you want to save the studio settings?"
        onConfirm={handleStudioSave}
        onCancel={() => setShowStudioSaveConfirm(false)}
        confirmText="Save"
        cancelText="Cancel"
        color="blue"
      />
      {studioSaveError && <div className="text-red-500 text-sm mt-2">{studioSaveError}</div>}
    </>
  );
}

// Add this component at the bottom of the file
function DeclarationsEditor({ declarations, onChange, onSave }) {
  const [arr, setArr] = useState(declarations || []);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => { setArr(declarations || []); }, [declarations]);

  const handleChange = (i, value) => {
    setArr(a => a.map((v, idx) => idx === i ? value : v));
    onChange(arr.map((v, idx) => idx === i ? value : v));
  };
  const handleAdd = () => {
    setArr(a => [...a, ""]);
    onChange([...arr, ""]);
  };
  const handleRemove = (i) => {
    setArr(a => a.filter((_, idx) => idx !== i));
    onChange(arr.filter((_, idx) => idx !== i));
  };
  const doSave = async () => {
    setSaving(true);
    await onSave(arr);
    setSaving(false);
    setShowConfirm(false);
  };
  return (
    <div>
      <ul className="space-y-2">
        {arr.map((val, i) => (
          <li key={i} className="flex gap-2 items-center">
            <input type="text" value={val} onChange={e => handleChange(i, e.target.value)} className="form-input flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
            <button type="button" onClick={() => handleRemove(i)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={handleAdd} className="mt-2 text-blue-600 hover:underline text-xs">+ Add Declaration</button>
      <button type="button" onClick={() => setShowConfirm(true)} disabled={saving} className="mt-2 ml-4 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
        {saving ? "Saving..." : "Save Declarations"}
      </button>
      <ConfirmPopup
        open={showConfirm}
        title="Save Declarations"
        message="Are you sure you want to save the declarations?"
        onConfirm={doSave}
        onCancel={() => setShowConfirm(false)}
        confirmText="Save"
        cancelText="Cancel"
        color="blue"
      />
    </div>
  );
}

function TermsSectionEditor({ sectionDoc, onSave }) {
  // Use all available fields in the document
  const [fields, setFields] = useState({ ...sectionDoc });
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setFields({ ...sectionDoc });
  }, [sectionDoc]);

  const handleFieldChange = (key, value) => {
    setFields(f => ({ ...f, [key]: value }));
  };

  const doSave = async () => {
    setSaving(true);
    await onSave(fields);
    setSaving(false);
    setShowConfirm(false);
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(fields).map(([key, value]) =>
          key === "id" || key === "order" ? null : (
            <div key={key} className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
              {typeof value === "string" ? (
                <input
                  type="text"
                  value={value}
                  onChange={e => handleFieldChange(key, e.target.value)}
                  className="form-input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              ) : Array.isArray(value) ? (
                <textarea
                  value={value.join("\n")}
                  onChange={e => handleFieldChange(key, e.target.value.split("\n"))}
                  className="form-textarea w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={Math.max(3, value.length)}
                />
              ) : null}
            </div>
          )
        )}
        {fields.order !== undefined && (
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <input type="number" value={fields.order} readOnly className="form-input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed" />
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={() => setShowConfirm(true)} disabled={saving} className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save Section"}
        </button>
        <ConfirmPopup
          open={showConfirm}
          title="Save Section"
          message="Are you sure you want to save this section?"
          onConfirm={doSave}
          onCancel={() => setShowConfirm(false)}
          confirmText="Save"
          cancelText="Cancel"
          color="blue"
        />
      </div>
    </div>
  );
}
