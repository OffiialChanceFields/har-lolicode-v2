import React from 'react';
import { Modal } from './ui/modal'; // Assuming you have a Modal component

interface JsonViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  json: object;
  title: string;
}

export const JsonViewerModal: React.FC<JsonViewerModalProps> = ({ isOpen, onClose, json, title }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <div className="max-h-[70vh] overflow-y-auto bg-gray-900 text-white p-4 rounded-md">
            <pre>
                <code>
                    {JSON.stringify(json, null, 2)}
                </code>
            </pre>
        </div>
    </Modal>
  );
};
