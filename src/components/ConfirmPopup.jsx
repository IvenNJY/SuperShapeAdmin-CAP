import React, { useEffect, useState } from "react";

/**
 * Preline UI-style confirmation popup component.
 * @param {Object} props
 * @param {boolean} props.open - Whether the popup is open.
 * @param {string} props.title - Title of the popup.
 * @param {string} props.message - Message/body of the popup.
 * @param {function} props.onConfirm - Called when user confirms.
 * @param {function} props.onCancel - Called when user cancels/closes.
 * @param {string} [props.confirmText] - Text for confirm button.
 * @param {string} [props.cancelText] - Text for cancel button.
 * @param {string} [props.color] - 'blue' (default) or 'red' for confirm button color.
 */
export default function ConfirmPopup({
  open,
  title = "Are you sure?",
  message = "Please confirm your action.",
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "Cancel",
  color = "blue",
  fade = false, // New prop to control animation
}) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (open) {
      // When opening, immediately start the fade-in transition
      const timer = setTimeout(() => setIsShowing(true), 10);
      return () => clearTimeout(timer);
    } else {
      // When closing, just set showing to false to trigger fade-out
      setIsShowing(false);
    }
  }, [open]);

  // Don't render the component at all if it's not open and the animation is done.
  // The parent component will control unmounting via the `open` prop.

  const confirmBtnClass =
    color === "red"
      ? "w-full px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
      : "w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700";
  const iconColor = color === "red" ? "text-red-500" : "text-blue-500";

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center bg-gray-300/40 bg-opacity-30
        transition-opacity duration-200
        ${isShowing && open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onTransitionEnd={() => {
        // This could be used for more complex logic, but for now we let the parent handle it
      }}
    >
      <div
        className={`bg-white rounded-xl shadow-lg max-w-sm w-full p-6 relative
          transition-all duration-200
          ${isShowing && open ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div className="flex flex-col items-center w-full">
          {/* Warning Icon */}
          <div className={`mb-3 ${iconColor}`}>
            {color === "red" ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-2.99l-7.07-12.25a2 2 0 00-3.48 0L3.19 16.01A2 2 0 004.93 19z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2 text-center w-full">{title}</h3>
          <p className="mb-6 text-gray-700 text-center w-full">{message}</p>
          <div className="flex flex-col gap-2 w-full">
            <button
              className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              className={confirmBtnClass}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
