/**
 * pages/profile.jsx — your own profile, or another member's public profile.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useParams } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import { Input, Textarea } from '../components/ui/Field';
import { LoadingPanel } from '../components/ui/Spinner';
import StatCard from '../components/ui/StatCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useAsync from '../hooks/useAsync';
import * as communityService from '../services/communityService';
import * as userService from '../services/userService';
import { formatDate, formatLocation } from '../utils/format';
import { COMMUNITY_ROLE_LABELS } from '../utils/constants';
import { profileSchema } from '../utils/validators';
import {
  ModerationIcon as ShieldIcon,
  MapPinIcon,
  MembersIcon as UsersIcon,
} from '../components/ui/icons';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();

  // No `:userId` in the route means "my profile".
  if (userId && userId !== user?.id) return <PublicProfile userId={userId} />;
  return <OwnProfile />;
}

/* ── Someone else's profile ────────────────────────────────────────────────── */

function PublicProfile({ userId }) {
  const { data, error, isLoading, reload } = useAsync(
    () => userService.getPublicProfile(userId),
    [userId],
  );

  if (isLoading) return <LoadingPanel label="Loading profile" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex flex-wrap items-start gap-4">
          <Avatar name={data.name} src={data.avatarUrl} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{data.name}</h1>
            <p className="mt-0.5 text-sm text-ink-subtle flex items-center gap-1">
              <MapPinIcon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              From {formatLocation(data.hometown) || 'somewhere nearby'}
              {data.hometown?.currentCity && <span> · now in {data.hometown.currentCity}</span>}
            </p>
            {data.bio && <p className="mt-2 text-base text-ink-muted">{data.bio}</p>}
            <p className="mt-2 text-xs text-ink-subtle">
              Member since {formatDate(data.createdAt)} · {data.postCount} posts
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Communities" />
        {data.communities.length === 0 ? (
          <EmptyState
            icon="building"
            title="No public communities"
            description="This member has not joined any public community."
          />
        ) : (
          <ul className="divide-y divide-line">
            {data.communities.map((community) => (
              <li key={community.id}>
                <Link
                  to={`/communities/${community.slug}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                >
                  <span className="truncate text-sm font-medium">{community.name}</span>
                  {community.role !== 'member' && (
                    <Badge tone="primary">{COMMUNITY_ROLE_LABELS[community.role]}</Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ── Your own profile ──────────────────────────────────────────────────────── */

function OwnProfile() {
  const { user, patchUser } = useAuth();
  const toast = useToast();
  const mine = useAsync(() => communityService.myCommunities(), []);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      city: user?.hometown?.city || '',
      district: user?.hometown?.district || '',
      state: user?.hometown?.state || '',
      country: user?.hometown?.country || '',
      currentCity: user?.hometown?.currentCity || '',
    },
  });

  const onSubmit = async (values) => {
    try {
      const updated = await userService.updateProfile({
        name: values.name,
        phone: values.phone,
        bio: values.bio,
        hometown: {
          city: values.city,
          district: values.district,
          state: values.state,
          country: values.country,
          currentCity: values.currentCity,
        },
      });
      patchUser(updated);
      toast.success('Profile updated');
    } catch (error) {
      Object.entries(error.fieldErrors || {}).forEach(([field, message]) => {
        setError(field.replace('hometown.', ''), { message });
      });
      toast.error(error.message);
    }
  };

  const communities = mine.data || [];
  const moderating = communities.filter((c) => c.myRole && c.myRole !== 'member');

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-4">
        <Avatar name={user?.name} src={user?.avatarUrl} size="xl" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{user?.name}</h1>
          <p className="text-sm text-ink-subtle">{user?.email}</p>
          {user?.role === 'platform_admin' && (
            <Badge tone="primary" className="mt-1">
              Platform admin
            </Badge>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Communities"
          value={communities.length}
          icon={UsersIcon}
          to="/communities"
        />
        <StatCard
          label="Moderating"
          value={moderating.length}
          icon={ShieldIcon}
          accent="secondary"
        />
        <div className="hh-card px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-ink-muted">Hometown</p>
            <MapPinIcon
              aria-hidden="true"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent"
              strokeWidth={2}
            />
          </div>
          <p className="mt-1 truncate text-lg font-semibold text-ink">
            {formatLocation(user?.hometown) || 'Not set'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Your details"
          description="This is what other members see on your profile."
        />
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Input label="Full name" required error={errors.name?.message} {...register('name')} />

            <Input
              label="Phone"
              type="tel"
              hint="Optional — only shown to community moderators."
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Textarea
              label="About you"
              placeholder="A line or two about your connection to the place."
              rows={3}
              error={errors.bio?.message}
              {...register('bio')}
            />

            <fieldset className="space-y-3">
              <legend className="hh-label">Hometown</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="City or village"
                  required
                  error={errors.city?.message}
                  {...register('city')}
                />
                <Input
                  label="District"
                  error={errors.district?.message}
                  {...register('district')}
                />
                <Input
                  label="State or region"
                  error={errors.state?.message}
                  {...register('state')}
                />
                <Input label="Country" error={errors.country?.message} {...register('country')} />
              </div>
              <Input
                label="Where you live now"
                hint="Optional — helpful if you have moved away but still follow home."
                error={errors.currentCity?.message}
                {...register('currentCity')}
              />
            </fieldset>

            <div className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
                Save changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Your communities"
          actions={
            <Button as={Link} to="/communities" size="sm" variant="ghost">
              Browse
            </Button>
          }
        />
        {mine.isLoading && <LoadingPanel label="Loading communities" />}
        {communities.length === 0 && !mine.isLoading && (
          <EmptyState
            icon="building"
            title="No communities yet"
            description="Join one to see it listed here."
          />
        )}
        <ul className="divide-y divide-line">
          {communities.map((community) => (
            <li key={community._id}>
              <Link
                to={`/communities/${community.slug}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{community.name}</span>
                  <span className="block truncate text-xs text-ink-subtle">
                    {formatLocation(community.location)}
                  </span>
                </span>
                {community.myStatus === 'pending' ? (
                  <Badge tone="warning">Awaiting approval</Badge>
                ) : (
                  community.myRole !== 'member' && (
                    <Badge tone="primary">{COMMUNITY_ROLE_LABELS[community.myRole]}</Badge>
                  )
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
