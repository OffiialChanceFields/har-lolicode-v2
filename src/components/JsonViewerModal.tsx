import React from 'react';
import { Modal } from './ui/modal'; // Assuming you have a Modal component
import { JsonViewer } from '@textea/json-viewer';

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
        <div className="max-h-[70vh] overflow-y-auto">
            <JsonViewer
                value={json}
                theme="dark"
                rootName={false}
                displayDataTypes={false}
                displayObjectSize={false}
            />
        </div>
    </Modal>
  );
};
