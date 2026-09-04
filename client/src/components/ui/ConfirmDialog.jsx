/**
 * components/ui/ConfirmDialog.jsx — confirmation prompt for destructive actions.
 */
import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
}) {
  const [isWorking, setIsWorking] = useState(false);

  const handleConfirm = async () => {
    setIsWorking(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isWorking}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={handleConfirm} isLoading={isWorking}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-base text-ink-muted">{message}</p>
    </Modal>
  );
}
