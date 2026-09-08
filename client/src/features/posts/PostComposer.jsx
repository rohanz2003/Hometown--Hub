/**
 * features/posts/PostComposer.jsx — create or edit a post.
 *
 * Collapsed to a single prompt until focused, so the feed stays readable on a
 * phone. Announcement and alert types warn that they notify the whole community.
 */
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Field';
import Avatar from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as postService from '../../services/postService';
import { postSchema, parseTags } from '../../utils/validators';
import { POST_TYPES } from '../../utils/constants';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const emptyValues = {
  title: '',
  body: '',
  type: 'discussion',
  category: '',
  tagsText: '',
  imageAlt: '',
};

export default function PostComposer({
  communityId,
  communityName,
  categories = [],
  post = null,
  onCreated,
  onUpdated,
  onCancel,
  autoExpand = false,
}) {
  const { user } = useAuth();
  const toast = useToast();
  const isEditing = Boolean(post);
  const [isOpen, setIsOpen] = useState(autoExpand || isEditing);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInput = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: isEditing
      ? {
          title: post.title || '',
          body: post.body || '',
          type: post.type || 'discussion',
          category: post.category?._id || post.category || '',
          tagsText: (post.tags || []).join(', '),
          imageAlt: post.imageAlt || '',
        }
      : emptyValues,
  });

  const selectedType = watch('type');
  const notifiesEveryone = selectedType === 'announcement' || selectedType === 'alert';

  // Release the object URL when the preview changes or the composer unmounts.
  useEffect(() => () => imagePreview && URL.revokeObjectURL(imagePreview), [imagePreview]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('That image is larger than 5 MB — please pick a smaller one');
      event.target.value = '';
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInput.current) fileInput.current.value = '';
  };

  const close = () => {
    reset(emptyValues);
    clearImage();
    setIsOpen(false);
    onCancel?.();
  };

  const onSubmit = async (values) => {
    const payload = {
      title: values.title,
      body: values.body,
      type: values.type,
      tags: parseTags(values.tagsText),
      imageAlt: values.imageAlt,
      ...(values.category ? { category: values.category } : {}),
    };

    try {
      if (isEditing) {
        const updated = await postService.updatePost(post._id, payload);
        toast.success('Post updated');
        onUpdated?.(updated);
      } else {
        const created = await postService.createPost(communityId, { ...payload, image: imageFile });
        toast.success(
          notifiesEveryone ? 'Posted — everyone in the community has been notified' : 'Posted',
        );
        onCreated?.(created);
        close();
      }
    } catch (error) {
      Object.entries(error.fieldErrors || {}).forEach(([field, message]) => {
        if (field in emptyValues) setError(field, { message });
      });
      toast.error(error.message);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hh-card flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:border-primary/40"
      >
        <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
        <span className="text-base text-ink-subtle">
          Share something with {communityName || 'your community'}…
        </span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="hh-card px-4 py-4">
      <h2 className="mb-3 text-base font-semibold">
        {isEditing ? 'Edit your post' : `New post in ${communityName || 'this community'}`}
      </h2>

      <div className="space-y-3">
        <Input
          label="Title"
          placeholder="A short, clear headline (optional)"
          error={errors.title?.message}
          {...register('title')}
        />

        <Textarea
          label="What do you want to share?"
          placeholder="Write your update…"
          rows={5}
          required
          error={errors.body?.message}
          {...register('body')}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Post type"
            options={POST_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            hint={POST_TYPES.find((t) => t.value === selectedType)?.hint}
            error={errors.type?.message}
            {...register('type')}
          />

          {categories.length > 0 && (
            <Select
              label="Category"
              placeholder="No category"
              options={categories.map((c) => ({ value: c._id, label: c.name }))}
              error={errors.category?.message}
              {...register('category')}
            />
          )}
        </div>

        <Input
          label="Tags"
          placeholder="festival, volunteers, roads"
          hint="Separate tags with commas — up to 8."
          error={errors.tagsText?.message}
          {...register('tagsText')}
        />

        {!isEditing && (
          <div>
            <span className="hh-label">Image (optional)</span>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleImageChange}
              aria-label="Attach an image to this post"
              className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:brightness-95"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview of what you selected"
                  className="aspect-video max-h-48 w-full rounded-lg border border-line bg-surface-muted object-contain"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="mt-1 text-xs font-medium text-error hover:underline"
                >
                  Remove image
                </button>
              </div>
            )}
          </div>
        )}

        {(imageFile || post?.imageUrl) && (
          <Input
            label="Describe the image"
            placeholder="e.g. Volunteers cleaning the village pond"
            hint="Screen readers read this out — it also shows if the image fails to load."
            error={errors.imageAlt?.message}
            {...register('imageAlt')}
          />
        )}

        {notifiesEveryone && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-ink">
            Heads up: an {selectedType} notifies every member of this community.
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={close} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? 'Save changes' : 'Post'}
        </Button>
      </div>
    </form>
  );
}
