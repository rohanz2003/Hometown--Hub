/**
 * features/events/EventForm.jsx — create or edit an event.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../../components/ui/Button';
import { Checkbox, Input, Textarea } from '../../components/ui/Field';
import { useToast } from '../../context/ToastContext';
import * as eventService from '../../services/eventService';
import { eventSchema } from '../../utils/validators';
import { toDateTimeInput } from '../../utils/format';

export default function EventForm({ communityId, event = null, onSaved, onCancel }) {
  const toast = useToast();
  const isEditing = Boolean(event);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      startsAt: toDateTimeInput(event?.startsAt) || '',
      endsAt: toDateTimeInput(event?.endsAt) || '',
      isAllDay: event?.isAllDay ?? false,
      venue: event?.location?.venue || '',
      address: event?.location?.address || '',
      city: event?.location?.city || '',
      isOnline: event?.location?.isOnline ?? false,
      meetingUrl: event?.location?.meetingUrl || '',
      capacity: event?.capacity ?? 0,
    },
  });

  const isOnline = watch('isOnline');

  const onSubmit = async (values) => {
    const payload = {
      title: values.title,
      description: values.description,
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
      isAllDay: values.isAllDay,
      capacity: values.capacity,
      location: {
        venue: values.venue,
        address: values.address,
        city: values.city,
        isOnline: values.isOnline,
        meetingUrl: values.meetingUrl,
      },
    };

    try {
      const saved = isEditing
        ? await eventService.updateEvent(event._id, payload)
        : await eventService.createEvent(communityId, payload);

      toast.success(
        isEditing ? 'Event updated' : 'Event created — your community has been notified',
      );
      onSaved?.(saved);
    } catch (error) {
      Object.entries(error.fieldErrors || {}).forEach(([field, message]) => {
        setError(field.replace('location.', ''), { message });
      });
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input
        label="Event title"
        placeholder="e.g. Village clean-up morning"
        required
        error={errors.title?.message}
        {...register('title')}
      />

      <Textarea
        label="Details"
        placeholder="What is happening, what to bring, who to contact…"
        rows={4}
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Starts"
          type="datetime-local"
          required
          error={errors.startsAt?.message}
          {...register('startsAt')}
        />
        <Input
          label="Ends"
          type="datetime-local"
          hint="Optional"
          error={errors.endsAt?.message}
          {...register('endsAt')}
        />
      </div>

      <Checkbox label="This runs all day" {...register('isAllDay')} />
      <Checkbox label="This is an online event" {...register('isOnline')} />

      {isOnline ? (
        <Input
          label="Meeting link"
          placeholder="https://…"
          required
          error={errors.meetingUrl?.message}
          {...register('meetingUrl')}
        />
      ) : (
        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="hh-label">Where is it?</legend>
          <Input
            label="Venue"
            placeholder="Community hall"
            error={errors.venue?.message}
            {...register('venue')}
          />
          <Input label="Address" error={errors.address?.message} {...register('address')} />
          <Input label="City or village" error={errors.city?.message} {...register('city')} />
        </fieldset>
      )}

      <Input
        label="Capacity"
        type="number"
        min="0"
        hint="Leave as 0 for unlimited places."
        error={errors.capacity?.message}
        {...register('capacity')}
      />

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? 'Save changes' : 'Create event'}
        </Button>
      </div>
    </form>
  );
}
