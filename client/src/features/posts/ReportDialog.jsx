/**
 * features/posts/ReportDialog.jsx — raises an abuse report to the moderators.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Field';
import { useToast } from '../../context/ToastContext';
import * as userService from '../../services/userService';
import { reportSchema } from '../../utils/validators';

export default function ReportDialog({ isOpen, onClose, targetType, targetId }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(reportSchema), defaultValues: { reason: '' } });

  const onSubmit = async ({ reason }) => {
    try {
      await userService.reportContent({ targetType, targetId, reason });
      toast.success('Thanks — the moderators will take a look');
      reset();
      onClose();
    } catch (error) {
      if (error.fieldErrors?.reason) setError('reason', { message: error.fieldErrors.reason });
      else toast.error(error.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Report this ${targetType}`}
      description="Community moderators and platform admins will review your report."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
            Send report
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Textarea
          label="What is wrong with it?"
          placeholder="Tell the moderators what they should look at…"
          rows={4}
          error={errors.reason?.message}
          {...register('reason')}
        />
      </form>
    </Modal>
  );
}
