
import React from 'react';
import type { FC } from 'react';
import Modal from './Modal';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
}

const AlertModal: FC<AlertModalProps> = ({ isOpen, onClose, title, message }) => {
  const footer = (
    <button
      type="button"
      onClick={onClose}
      className="btn-press inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      OK
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <div className="text-slate-600 dark:text-slate-300">
        {typeof message === 'string' ? <p>{message}</p> : message}
      </div>
    </Modal>
  );
};

export default AlertModal;
