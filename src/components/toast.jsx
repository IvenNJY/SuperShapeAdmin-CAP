import React, { useEffect } from 'react'

// Toastify CDN injection helper
function injectToastify() {
  if (!window.Toastify) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/toastify-js';
    script.async = true;
    document.body.appendChild(script);
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css';
    document.head.appendChild(style);
  }
}

// Call this function to show a toast
export function showToast({ message, type = 'default', duration = 3500 }) {
  if (window.Toastify) {
    // Default styles
    let bgColor = '#f3f4f6'; // gray-100
    let borderColor = '#e5e7eb'; // gray-200
    let textColor = '#1f2937'; // gray-800
    if (type === 'error') {
      bgColor = '#fee2e2'; // red-100
      borderColor = '#fecaca'; // red-200
      textColor = '#b91c1c'; // red-800
    }
    if (type === 'success') {
      bgColor = '#d1fae5'; // teal-100
      borderColor = '#99f6e4'; // teal-200
      textColor = '#134e4a'; // teal-800
    }
    if (type === 'info') {
      bgColor = '#dbeafe'; // blue-100
      borderColor = '#bfdbfe'; // blue-200
      textColor = '#1e40af'; // blue-800
    }
    if (type === 'warning') {
      bgColor = '#fef9c3'; // yellow-100
      borderColor = '#fef08a'; // yellow-200
      textColor = '#92400e'; // yellow-800
    }
    window.Toastify({
      text: message,
      duration,
      gravity: 'bottom',
      position: 'right',
      close: false,
      style: {
        background: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '0.5rem',
        fontSize: '1rem',
        boxShadow: 'none',
        maxWidth: '20rem', // max-w-xs
        padding: '1rem 1.25rem', // Added padding for toast content
        minWidth: '0',
      },
      className: 'toast-no-shadow',
    }).showToast();
  }
}

// This component just injects Toastify on mount
function ToastInjector() {
  useEffect(() => { injectToastify(); }, []);
  return null;
}

export default ToastInjector;
