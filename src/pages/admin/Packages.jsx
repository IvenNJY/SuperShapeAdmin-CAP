import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../../backend/firebaseConfig.js'
import Navbar from './Navbar'
import ConfirmPopup from '../../components/ConfirmPopup.jsx';

export default function Packages() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTitle, setFilterTitle] = useState('')
  const [filterClassType, setFilterClassType] = useState('')
  const [filterType, setFilterType] = useState('')
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    class_type: '',
    credits: '',
    type: 'group',
    validity: '',
    price: ''
  });
  const [adding, setAdding] = useState(false);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [addError, setAddError] = useState('');
  const [showAddDiscardConfirm, setShowAddDiscardConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  // Add error state for edit form
  const [editError, setEditError] = useState('');

  useEffect(() => {
    async function fetchPackages() {
      try {
        const querySnapshot = await getDocs(collection(db, 'Credit_Packages'))
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setPackages(data)
      } catch (e) {
        setPackages([])
        throw e
      } finally {
        setLoading(false)
      }
    }
    fetchPackages()
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-blue-600 text-xl">Loading...</div>
  }

  // Filtering logic
  const filtered = packages.filter(pkg =>
    pkg.title.toLowerCase().includes(filterTitle.toLowerCase()) &&
    pkg.class_type.toLowerCase().includes(filterClassType.toLowerCase()) &&
    (filterType ? pkg.type === filterType : true)
  )

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedPackages = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function typeBadge(type) {
    switch (type) {
      case 'trial':
        return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">Trial</span>
      case 'group':
        return <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Group</span>
      case 'private':
        return <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">Private</span>
      default:
        return <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold">{type}</span>
    }
  }

  function openSidebar(pkg) {
    setSelectedPackage(pkg);
    setEditForm(pkg);
    setSidebarOpen(true);
    setTimeout(() => setSidebarVisible(true), 10);
    setEditMode(false);
  }
  function closeSidebar() {
    setSidebarVisible(false);
    setTimeout(() => {
      setSidebarOpen(false);
      setSelectedPackage(null);
      setEditMode(false);
      setShowDiscardConfirm(false);
    }, 300);
  }
  function handleEdit() {
    setEditMode(true);
    setEditForm(selectedPackage);
  }
  function handleFormChange(e) {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
    setEditError('');
  }
  function validateEditForm() {
    if (!editForm.title || !editForm.class_type || !editForm.credits || !editForm.type || !editForm.validity || !editForm.price) {
      setEditError('All fields are required.');
      return false;
    }
    const numFields = [
      { key: 'credits', label: 'Credits' },
      { key: 'validity', label: 'Validity (days)' },
      { key: 'price', label: 'Price (RM)' }
    ];
    for (const field of numFields) {
      const value = Number(editForm[field.key]);
      if (isNaN(value) || value <= 0) {
        setEditError(`${field.label} must be greater than 0.`);
        return false;
      }
    }
    setEditError('');
    return true;
  }
  function handleSaveClick() {
    if (!validateEditForm()) return;
    setShowSaveConfirm(true);
  }
  async function handleSaveConfirmed() {
    setShowSaveConfirm(false);
    setSaving(true);
    try {
      const docRef = doc(db, 'Credit_Packages', selectedPackage.id);
      await updateDoc(docRef, {
        title: editForm.title,
        class_type: editForm.class_type,
        credits: Number(editForm.credits),
        type: editForm.type,
        validity: Number(editForm.validity),
        price: Number(editForm.price)
      });
      setPackages(pkgs => pkgs.map(p => p.id === selectedPackage.id ? { ...editForm, id: p.id } : p));
      setSelectedPackage({ ...editForm, id: selectedPackage.id });
      setEditMode(false);
    } catch (e) {
      alert('Failed to save changes.');
      throw e;
    } finally {
      setSaving(false);
    }
  }
  function handleDiscard() {
    setShowDiscardConfirm(false);
    setEditMode(false);
    setEditForm(selectedPackage);
  }
  function openAddForm() {
    setShowAddForm(true);
    setAddForm({
      title: '',
      class_type: '',
      credits: '',
      type: 'group',
      validity: '',
      price: ''
    });
  }
  function closeAddForm() {
    setShowAddDiscardConfirm(true);
  }
  function handleAddFormChange(e) {
    const { name, value } = e.target;
    setAddForm(f => ({ ...f, [name]: value }));
    setAddError('');
  }
  function validateAddForm() {
    // Check all fields are filled
    if (!addForm.title || !addForm.class_type || !addForm.credits || !addForm.type || !addForm.validity || !addForm.price) {
      setAddError('All fields are required.');
      return false;
    }
    // Check number fields are positive and not zero
    const numFields = [
      { key: 'credits', label: 'Credits' },
      { key: 'validity', label: 'Validity (days)' },
      { key: 'price', label: 'Price (RM)' }
    ];
    for (const field of numFields) {
      const value = Number(addForm[field.key]);
      if (isNaN(value) || value <= 0) {
        setAddError(`${field.label} must be greater than 0.`);
        return false;
      }
    }
    setAddError('');
    return true;
  }
  function handleAddPackageClick() {
    if (!validateAddForm()) return;
    setShowAddConfirm(true);
  }
  async function handleAddPackage() {
    setAdding(true);
    setShowAddConfirm(false);
    try {
      const docRef = await addDoc(collection(db, 'Credit_Packages'), {
        title: addForm.title,
        class_type: addForm.class_type,
        credits: Number(addForm.credits),
        type: addForm.type,
        validity: Number(addForm.validity),
        price: Number(addForm.price)
      });
      setPackages(pkgs => [...pkgs, { ...addForm, id: docRef.id }]);
      setShowAddForm(false);
    } catch (e) {
      alert('Failed to add package.');
      throw e;
    } finally {
      setAdding(false);
    }
  }
  function handleDiscardAddForm() {
    setShowAddForm(false);
    setShowAddDiscardConfirm(false);
    setAddError('');
  }
  async function handleRemovePackage() {
    setRemoving(true);
    try {
      await deleteDoc(doc(db, 'Credit_Packages', selectedPackage.id));
      setPackages(pkgs => pkgs.filter(p => p.id !== selectedPackage.id));
      setSidebarOpen(false);
      setSelectedPackage(null);
    } catch (e) {
      alert('Failed to remove package.');
      throw e;
    } finally {
      setRemoving(false);
      setShowRemoveConfirm(false);
    }
  }

  return (
    <>
      <Navbar />
      {/* Modal background for Add Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 opacity-100 animate-fadeIn" style={{backgroundColor: 'rgba(209, 213, 219, 0.45)', zIndex: 1000}}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md transition-transform duration-300 transform animate-fadeInUp relative">
            <h3 className="text-lg font-semibold mb-4">Add New Package</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                  value={addForm.title}
                  onChange={handleAddFormChange}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Class Type</label>
                <input
                  type="text"
                  name="class_type"
                  className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                  value={addForm.class_type}
                  onChange={handleAddFormChange}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Credits</label>
                <input
                  type="number"
                  name="credits"
                  className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                  value={addForm.credits}
                  onChange={handleAddFormChange}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Type</label>
                <select
                  name="type"
                  className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                  value={addForm.type}
                  onChange={handleAddFormChange}
                >
                  <option value="group">Group</option>
                  <option value="private">Private</option>
                  <option value="trial">Trial</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Validity (days)</label>
                <input
                  type="number"
                  name="validity"
                  className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                  value={addForm.validity}
                  onChange={handleAddFormChange}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Price (RM)</label>
                <input
                  type="number"
                  name="price"
                  className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                  value={addForm.price}
                  onChange={handleAddFormChange}
                />
              </div>
              {addError && <div className="text-red-600 text-sm font-semibold">{addError}</div>}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={handleAddPackageClick}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 px-4 rounded focus:outline-none disabled:opacity-50"
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={closeAddForm}
                className="bg-white hover:bg-gray-100 border-neutral-200 border text-gray-800 w-full py-2 px-4 rounded focus:outline-none"
                disabled={adding}
              >
                Cancel
              </button>
            </div>
            {/* Add Confirmation Modal */}
            <ConfirmPopup
              open={showAddConfirm}
              title="Confirm Add"
              message="Are you sure you want to add this package?"
              onConfirm={handleAddPackage}
              onCancel={() => setShowAddConfirm(false)}
              confirmText="Confirm"
              cancelText="Cancel"
              color="blue"
            />
            {/* Add Discard Confirmation Modal */}
            <ConfirmPopup
              open={showAddDiscardConfirm}
              title="Discard changes?"
              message="Are you sure you want to discard the new package?"
              onConfirm={handleDiscardAddForm}
              onCancel={() => setShowAddDiscardConfirm(false)}
              confirmText="Discard"
              cancelText="Cancel"
              color="red"
            />
          </div>
        </div>
      )}
      <div className="flex">
        <div className="block w-64" />
        <div className="flex-1 bg-gray-100 min-h-screen p-6 md:p-8">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Credit Packages</h1>
              <p className="text-sm text-gray-600">Manage all of the Credit Packages from here</p>
            </div>
            <button
              type="button"
              onClick={openAddForm}
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700"
            >
              Add Package
            </button>
          </header>
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 opacity-100 animate-fadeIn" style={{backgroundColor: 'rgba(209, 213, 219, 0.45)', zIndex: 1000}}>
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md transition-transform duration-300 transform animate-fadeInUp">
                <h3 className="text-lg font-semibold mb-4">Add New Package</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                      value={addForm.title}
                      onChange={handleAddFormChange}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Class Type</label>
                    <input
                      type="text"
                      name="class_type"
                      className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                      value={addForm.class_type}
                      onChange={handleAddFormChange}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Credits</label>
                    <input
                      type="number"
                      name="credits"
                      className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                      value={addForm.credits}
                      onChange={handleAddFormChange}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Type</label>
                    <select
                      name="type"
                      className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                      value={addForm.type}
                      onChange={handleAddFormChange}
                    >
                      <option value="group">Group</option>
                      <option value="private">Private</option>
                      <option value="trial">Trial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Validity (days)</label>
                    <input
                      type="number"
                      name="validity"
                      className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                      value={addForm.validity}
                      onChange={handleAddFormChange}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Price (RM)</label>
                    <input
                      type="number"
                      name="price"
                      className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                      value={addForm.price}
                      onChange={handleAddFormChange}
                    />
                  </div>
                  {addError && <div className="text-red-600 text-sm font-semibold">{addError}</div>}
                </div>
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={handleAddPackageClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 px-4 rounded focus:outline-none disabled:opacity-50"
                    disabled={adding}
                  >
                    {adding ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    onClick={closeAddForm}
                    className="bg-white hover:bg-gray-100 border-neutral-200 border text-gray-800 w-full py-2 px-4 rounded focus:outline-none"
                    disabled={adding}
                  >
                    Cancel
                  </button>
                </div>
                {/* Add Confirmation Modal */}
                <ConfirmPopup
                  open={showAddConfirm}
                  title="Confirm Add"
                  message="Are you sure you want to add this package?"
                  onConfirm={handleAddPackage}
                  onCancel={() => setShowAddConfirm(false)}
                  confirmText="Confirm"
                  cancelText="Cancel"
                  color="blue"
                />
                {/* Add Discard Confirmation Modal */}
                <ConfirmPopup
                  open={showAddDiscardConfirm}
                  title="Discard changes?"
                  message="Are you sure you want to discard the new package?"
                  onConfirm={handleDiscardAddForm}
                  onCancel={() => setShowAddDiscardConfirm(false)}
                  confirmText="Discard"
                  cancelText="Cancel"
                  color="red"
                />
              </div>
            </div>
          )}
          <div className="mb-6">
            {/* Filters, Row Limit, Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 p-4 pb-0">
              <div className="flex-1 flex items-center gap-x-2">
                <input
                  type="text"
                  placeholder="Filter by title"
                  className="py-2 px-3 block w-full border bg-white rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                  value={filterTitle}
                  onChange={e => {
                    setFilterTitle(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <input
                  type="text"
                  placeholder="Filter by class type"
                  className="py-2 px-3 block w-full border bg-white rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                  value={filterClassType}
                  onChange={e => {
                    setFilterClassType(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <select
                  className="py-2 px-3 pr-9 block w-full border bg-white border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                  value={filterType}
                  onChange={e => {
                    setFilterType(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Types</option>
                  <option value="group">Group</option>
                  <option value="private">Private</option>
                  <option value="trial">Trial</option>
                </select>
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
                {/* Pagination */}
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
                {/* End Pagination */}
              </div>
            </div>
            {/* End Filters, Row Limit, Pagination */}
          </div>
          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Type</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs">
                {paginatedPackages.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400 text-xs">No packages found.</td>
                  </tr>
                )}
                {paginatedPackages.map(pkg => (
                  <tr key={pkg.id} className="text-xs">
                    <td className="px-3 py-4 font-medium text-gray-800 text-xs">{pkg.title}</td>
                    <td className="px-3 py-4 text-xs">{pkg.class_type}</td>
                    <td className="px-3 py-4 text-xs">{pkg.credits}</td>
                    <td className="px-3 py-4 text-xs">{typeBadge(pkg.type)}</td>
                    <td className="px-3 py-4 text-xs">{pkg.validity} days</td>
                    <td className="px-3 py-4 text-green-700 font-bold text-xs">RM {pkg.price}</td>
                    <td className="px-3 py-4 text-xs">
                      <button onClick={() => openSidebar(pkg)} className="text-blue-600 hover:underline text-xs font-medium">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Sidebar Offcanvas */}
        {sidebarOpen && selectedPackage && (
          <>
            {/* Modal background for sidebar */}
            <div className="fixed inset-0 z-40" style={{backgroundColor: 'rgba(209, 213, 219, 0.45)', zIndex: 1000}} onClick={closeSidebar}></div>
            <div
              className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transition-transform duration-300 ${sidebarVisible ? "translate-x-0" : "translate-x-full"}`}
              style={{ willChange: "transform", zIndex: 1010 }}
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Package Details</h2>
                  <button
                    onClick={closeSidebar}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4 flex-grow">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                      value={editMode ? editForm.title : selectedPackage.title}
                      onChange={editMode ? handleFormChange : undefined}
                      readOnly={!editMode}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Class Type</label>
                    <input
                      type="text"
                      name="class_type"
                      className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                      value={editMode ? editForm.class_type : selectedPackage.class_type}
                      onChange={editMode ? handleFormChange : undefined}
                      readOnly={!editMode}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Credits</label>
                    <input
                      type="number"
                      name="credits"
                      className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                      value={editMode ? editForm.credits : selectedPackage.credits}
                      onChange={editMode ? handleFormChange : undefined}
                      readOnly={!editMode}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Type</label>
                    <select
                      name="type"
                      className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                      value={editMode ? editForm.type : selectedPackage.type}
                      onChange={editMode ? handleFormChange : undefined}
                      disabled={!editMode}
                    >
                      <option value="group">Group</option>
                      <option value="private">Private</option>
                      <option value="trial">Trial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Validity (days)</label>
                    <input
                      type="number"
                      name="validity"
                      className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                      value={editMode ? editForm.validity : selectedPackage.validity}
                      onChange={editMode ? handleFormChange : undefined}
                      readOnly={!editMode}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Price (RM)</label>
                    <input
                      type="number"
                      name="price"
                      className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
                      value={editMode ? editForm.price : selectedPackage.price}
                      onChange={editMode ? handleFormChange : undefined}
                      readOnly={!editMode}
                    />
                  </div>
                  <div>
                    {editError && editMode && (
                      <div className="text-red-600 text-sm font-semibold mb-2">{editError}</div>
                    )}
                  </div>
                </div>
                <div className="mt-auto pt-4 flex gap-2">
                  {editMode ? (
                    <>
                      <button
                        onClick={handleSaveClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 px-4 rounded focus:outline-none disabled:opacity-50"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setShowDiscardConfirm(true)}
                        className="bg-white hover:bg-gray-100 border-neutral-200 border text-gray-800 w-full py-2 px-4 rounded focus:outline-none"
                      >
                        Discard
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleEdit}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 px-4 rounded focus:outline-none"
                      >
                        Edit
                      </button>
                      <button
                        onClick={closeSidebar}
                        className="bg-white hover:bg-gray-100 border-neutral-200 border text-gray-800 w-full py-2 px-4 rounded focus:outline-none"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => setShowRemoveConfirm(true)}
                        className="bg-red-600 hover:bg-red-700 text-white w-full py-2 px-4 rounded focus:outline-none"
                        disabled={removing}
                      >
                        {removing ? 'Removing...' : 'Remove'}
                      </button>
                    </>
                  )}
                </div>
                {/* Save Confirmation Modal */}
                <ConfirmPopup
                  open={showSaveConfirm}
                  title="Confirm Save"
                  message="Are you sure you want to save these changes?"
                  onConfirm={handleSaveConfirmed}
                  onCancel={() => setShowSaveConfirm(false)}
                  confirmText="Confirm"
                  cancelText="Cancel"
                  color="blue"
                />
                {/* Discard Confirmation Modal */}
                <ConfirmPopup
                  open={showDiscardConfirm}
                  title="Discard changes?"
                  message="Are you sure you want to discard your changes?"
                  onConfirm={handleDiscard}
                  onCancel={() => setShowDiscardConfirm(false)}
                  confirmText="Discard"
                  cancelText="Cancel"
                  color="red"
                />
                {/* Remove Confirmation Modal */}
                <ConfirmPopup
                  open={showRemoveConfirm}
                  title="Remove Package"
                  message="Are you sure you want to remove this package? This action cannot be undone."
                  onConfirm={handleRemovePackage}
                  onCancel={() => setShowRemoveConfirm(false)}
                  confirmText="Remove"
                  cancelText="Cancel"
                  color="red"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
