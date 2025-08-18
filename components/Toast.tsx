
import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from './icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const isSuccess = type === 'success';
  const baseBgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';
  const textColor = 'text-gray-700';
  const Icon = isSuccess ? CheckCircleIcon : XCircleIcon;

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center w-full max-w-sm p-4 ${textColor} ${baseBgColor} rounded-lg shadow-lg border-l-4 ${isSuccess ? 'border-green-500' : 'border-red-500'}`}
      role="alert"
    >
      <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${iconColor}`}>
        <Icon className="w-6 h-6" />
        <span className="sr-only">{isSuccess ? 'Success' : 'Error'} icon</span>
      </div>
      <div className="ml-3 text-sm font-medium">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8"
        onClick={onClose}
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;
