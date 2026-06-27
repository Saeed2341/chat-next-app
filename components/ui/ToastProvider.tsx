"use client";

import { Toaster } from "react-hot-toast";

const toastOptions = {
  style: {
    background: '#111b21',
    color: '#fff',
    borderRadius: '12px',
    border: '1px solid #2a3942',
    padding: '12px 16px',
    fontSize: '14px',
  },
  success: {
    iconTheme: { primary: '#00a884', secondary: '#fff' },
  },
  error: {
    iconTheme: { primary: '#ef4444', secondary: '#fff' },
  },
};

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={toastOptions}
    />
  );
}