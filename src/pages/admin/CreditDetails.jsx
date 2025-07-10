import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import Navbar from "./Navbar";
import ConfirmPopup from "../../components/ConfirmPopup";
import { db } from "../../../backend/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function CreditDetails() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'Approve' or 'Reject'
  const [fadingOut, setFadingOut] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showingReceipt, setShowingReceipt] = useState(false);

  useEffect(() => {
    const fetchPaymentAndUser = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "Payment", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const paymentData = {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate ? docSnap.data().createdAt.toDate().toLocaleString() : docSnap.data().createdAt,
          };
          setPayment(paymentData);
          // Fetch user info from users collection using userid
          if (paymentData.userid) {
            const userRef = doc(db, "users", paymentData.userid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setUser(userSnap.data());
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
          // Fetch package title from Credit_Packages
          let packageTitle = "-";
          const packageId = paymentData.PackageID || paymentData.packageId || paymentData.packageID;
          if (packageId) {
            const packageRef = doc(db, "Credit_Packages", packageId);
            const packageSnap = await getDoc(packageRef);
            if (packageSnap.exists()) {
              packageTitle = packageSnap.data().title || packageSnap.data().name || packageId;
            } else {
              packageTitle = packageId;
            }
          }
          setPayment(prev => prev ? { ...prev, packageTitle } : { ...paymentData, packageTitle });
        } else {
          setError("No such payment found!");
        }
      } catch (err) {
        setError("Failed to fetch payment details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentAndUser();
  }, [uid]);

  const handleAction = (action) => {
    setConfirmAction(action);
    setShowConfirm(true);
    setFadingOut(false); // Reset fading state when opening
  };

  const handleCancelConfirm = () => {
    setFadingOut(true);
    setTimeout(() => {
      setShowConfirm(false);
    }, 300); // Duration of fade-out animation
  };

  const confirmActionHandler = async () => {
    if (!confirmAction) return;

    try {
      const docRef = doc(db, "Payment", uid);
      await updateDoc(docRef, {
        Status: confirmAction === 'Approve' ? 'Approved' : 'Rejected',
      });
      setPayment(prev => ({ ...prev, Status: confirmAction === 'Approve' ? 'Approved' : 'Rejected' }));
      handleCancelConfirm(); // Close popup with fade-out
    } catch (error) {
      console.error("Error updating status: ", error);
      alert(`Failed to ${confirmAction.toLowerCase()} payment.`);
    }
  };

  useEffect(() => {
    if (showReceiptModal) {
      setShowingReceipt(true);
    } else if (showingReceipt) {
      const timeout = setTimeout(() => setShowingReceipt(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [showReceiptModal, showingReceipt]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!payment) return <div className="p-8 text-center">No payment details found.</div>;

  // Fallbacks for user info fields
  const userName = user?.full_name || payment?.userName || "-";
  const userEmail = user?.email || payment?.userEmail || "-";
  const packageName = payment?.packageTitle || "-";
  const createdAt = payment?.createdAt || "-";

  return (
    <>
      <Navbar />
      <div className="bg-gray-100 flex min-h-screen">
        <div className="fixed left-0 top-0 h-full w-64 z-10 bg-white border-r hidden md:block" />
        <main className="ml-0 md:ml-64 p-8 w-full">
          <header className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Credit Details</h1>
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
                {payment.Status === "Pending" && (
                  <>
                    <button
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                      onClick={() => handleAction('Reject')}
                    >
                      Reject
                    </button>
                    <button
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600"
                      onClick={() => handleAction('Approve')}
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Receipt/Proof of Payment Column */}
            <div className="md:col-span-1 bg-white p-6 shadow rounded-lg flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 self-start">Receipt</h3>
              <div className="w-full h-80 bg-gray-200 rounded border border-dashed border-gray-400 flex items-center justify-center">
                {payment.UploadedReceiptURL ? (
                  payment.UploadedReceiptURL.toLowerCase().includes('.pdf') ? (
                    <div
                      className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                      onClick={() => setShowReceiptModal(true)}
                    >
                      <span className="text-gray-700 font-semibold">PDF Receipt</span>
                      <span className="text-xs text-gray-500">(Click to view PDF)</span>
                    </div>
                  ) : (
                    <img
                      src={payment.UploadedReceiptURL}
                      alt="Proof of Payment"
                      className="max-w-full max-h-full object-contain rounded cursor-pointer"
                      onClick={() => setShowReceiptModal(true)}
                    />
                  )
                ) : (
                  <span className="text-gray-500">Receipt Preview Area</span>
                )}
              </div>
            </div>

            {/* Details Column */}
            <div className="md:col-span-2 bg-white p-6 shadow rounded-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                  <input
                    type="text"
                    value={userName}
                    readOnly
                    className="py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <input
                    type="text"
                    value={userEmail}
                    readOnly
                    className="py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Package</label>
                  <input
                    type="text"
                    value={packageName}
                    readOnly
                    className="py-2 px-3 block w-full border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100"
                  />
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 text-right">
                    Transaction during : <span>{createdAt}</span>
                  </p>
                </div>
                {/* Hidden original details can be added here if needed */}
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(payment.Status)}`}>
                    {payment.Status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {showConfirm && (
        <ConfirmPopup
          open={showConfirm && !fadingOut}
          title={`Confirm ${confirmAction}`}
          message={`Are you sure you want to ${confirmAction?.toLowerCase()} this payment?`}
          onConfirm={confirmActionHandler}
          onCancel={handleCancelConfirm}
          confirmText={confirmAction}
          color={confirmAction === 'Reject' ? 'red' : 'blue'}
          fade={true}
        />
      )}
      {showReceiptModal || showingReceipt ? (
        <div
          className={`fixed inset-0 z-100 flex items-center justify-center transition-all duration-200 ${showReceiptModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ background: "rgba(128,128,128,0.2)" }}
        >
          <div
            className={`bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative transition-all duration-200 ${showReceiptModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowReceiptModal(false)}
            >
              &times;
            </button>
            <h3 className="text-lg font-semibold mb-4">Receipt {payment.UploadedReceiptURL && payment.UploadedReceiptURL.toLowerCase().includes('.pdf') ? 'PDF' : 'Image'}</h3>
            {payment.UploadedReceiptURL && payment.UploadedReceiptURL.toLowerCase().includes('.pdf') ? (
              <iframe
                src={payment.UploadedReceiptURL}
                title="PDF Receipt"
                className="w-full min-h-[60vh] max-h-[70vh] rounded border"
              />
            ) : (
              <img
                src={payment.UploadedReceiptURL}
                alt="Enlarged Receipt"
                className="w-full max-h-[70vh] object-contain rounded"
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function getStatusClass(status) {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-800";
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

