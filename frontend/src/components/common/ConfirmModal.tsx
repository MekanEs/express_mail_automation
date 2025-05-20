import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirmLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isConfirmLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-gray-900/50">
      <div className="relative w-full max-w-md p-4 mx-auto my-6">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-200 rounded-t">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-gray-400 hover:text-gray-900 float-right text-2xl leading-none outline-none focus:outline-none"
              onClick={onCancel}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="relative p-6 flex-auto">
            <p className="my-2 text-gray-600 text-sm leading-relaxed">{message}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b gap-2">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              type="button"
              onClick={onCancel}
              disabled={isConfirmLoading}
            >
              {cancelText}
            </button>
            <button
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              type="button"
              onClick={onConfirm}
              disabled={isConfirmLoading}
            >
              {isConfirmLoading ? (
                <>
                  <span className="spinner-sm mr-2"></span>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
