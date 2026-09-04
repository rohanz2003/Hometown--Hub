/**
 * features/communities/CommunityForm.jsx — create or edit a community.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../../components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/Field';
import { useToast } from '../../context/ToastContext';
import * as communityService from '../../services/communityService';
import { communitySchema, parseTags } from '../../utils/validators';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public — anyone can read and join' },
  { value: 'private', label: 'Private — only members can see posts' },
];

export default function CommunityForm({ community = null, onSaved, onCancel }) {
  const toast = useToast();
  const isEditing = Boolean(community);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      name: community?.name || '',
      description: community?.description || '',
      city: community?.location?.city || '',
      state: community?.location?.state || '',
      country: community?.location?.country || '',
      visibility: community?.visibility || 'public',
      requiresApproval: community?.requiresApproval ?? false,
      tagsText: (community?.tags || []).join(', '),
    },
  });

  const visibility = watch('visibility');

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      description: values.description,
      location: { city: values.city, state: values.state, country: values.country },
      visibility: values.visibility,
      // Private communities always queue join requests.
      requiresApproval: values.visibility === 'private' ? true : values.requiresApproval,
      tags: parseTags(values.tagsText),
    };

    try {
      const result = isEditing
        ? await communityService.updateCommunity(community.slug || community._id, payload)
        : await communityService.createCommunity(payload);

      toast.success(
        isEditing
          ? 'Community updated'
          : 'Community created — a platform admin will review it before it goes live',
      );
      onSaved?.(isEditing ? result : result.community);
    } catch (error) {
      Object.entries(error.fieldErrors || {}).forEach(([field, message]) => {
        const target = field.replace('location.', '');
        setError(target, { message });
      });
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input
        label="Community name"
        placeholder="e.g. Kollengode Village Circle"
        required
        error={errors.name?.message}
        {...register('name')}
      />

      <Textarea
        label="What is this community for?"
        placeholder="A sentence or two so newcomers know what to expect."
        rows={3}
        error={errors.description?.message}
        {...register('description')}
      />

      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="hh-label">Where is it?</legend>
        <Input
          label="City or village"
          required
          error={errors.city?.message}
          {...register('city')}
        />
        <Input label="State or region" error={errors.state?.message} {...register('state')} />
        <Input label="Country" error={errors.country?.message} {...register('country')} />
      </fieldset>

      <Select
        label="Visibility"
        options={VISIBILITY_OPTIONS}
        error={errors.visibility?.message}
        {...register('visibility')}
      />

      <Checkbox
        label="Review every join request before letting people in"
        hint={
          visibility === 'private'
            ? 'Private communities always review join requests.'
            : 'Leave this off to let neighbours join instantly.'
        }
        disabled={visibility === 'private'}
        {...register('requiresApproval')}
      />

      <Input
        label="Tags"
        placeholder="village, culture, civic"
        hint="Separate tags with commas — these help people find you."
        error={errors.tagsText?.message}
        {...register('tagsText')}
      />

      {!isEditing && (
        <p className="rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary">
          New communities are reviewed by a platform admin before they appear in the directory. You
          will be notified when yours is approved.
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? 'Save changes' : 'Create community'}
        </Button>
      </div>
    </form>
  );
}
