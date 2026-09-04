/**
 * pages/settings.jsx — appearance, layout, notification, and security settings.
 *
 * Every preference here is saved to the user profile so it follows them across
 * devices (design.md § 4).
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Checkbox, Input, Select } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import useAsync from '../hooks/useAsync';
import * as communityService from '../services/communityService';
import * as userService from '../services/userService';
import { changePasswordSchema } from '../utils/validators';
import { THEME_OPTIONS } from '../utils/constants';

export default function SettingsPage() {
  const { user, savePreferences, changePassword, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const { data: myCommunities } = useAsync(() => communityService.myCommunities(), []);

  const preferences = user?.preferences || {};

  const save = async (partial, message) => {
    try {
      await savePreferences(partial);
      if (message) toast.success(message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onChangePassword = async (values) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      toast.success('Password changed — your other devices have been signed out');
    } catch (error) {
      if (error.fieldErrors?.currentPassword || error.status === 400) {
        passwordForm.setError('currentPassword', {
          message: error.fieldErrors?.currentPassword || error.message,
        });
      } else {
        toast.error(error.message);
      }
    }
  };

  const handleDeactivate = async () => {
    try {
      await userService.deactivateAccount();
      await logout();
      toast.info('Your account has been deactivated');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const approvedCommunities = (myCommunities || []).filter((c) => c.myStatus === 'approved');

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          These preferences are saved to your account, so they follow you to any device.
        </p>
      </header>

      <Card>
        <CardHeader
          title="Appearance"
          description="How Hometown Hub looks on this and every device."
        />
        <CardBody className="space-y-4">
          <Select
            label="Theme"
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            options={THEME_OPTIONS}
            hint="“Match my device” follows your system light/dark setting."
          />

          <Select
            label="Default feed layout"
            value={preferences.feedView || 'list'}
            onChange={(event) => save({ feedView: event.target.value }, 'Layout saved')}
            options={[
              { value: 'list', label: 'List — one post per row' },
              { value: 'grid', label: 'Grid — two posts per row' },
            ]}
          />

          <Checkbox
            label="Keep the sidebar collapsed"
            checked={preferences.sidebarCollapsed || false}
            onChange={(event) => save({ sidebarCollapsed: event.target.checked })}
            hint="Shows icons only, leaving more room for content."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Feed & notifications" />
        <CardBody className="space-y-4">
          <Select
            label="Default community"
            placeholder="All my communities"
            value={preferences.defaultCommunity || ''}
            onChange={(event) => save({ defaultCommunity: event.target.value || null }, 'Saved')}
            options={approvedCommunities.map((c) => ({ value: c._id, label: c.name }))}
            hint="Opens your feed filtered to this community."
          />

          <Checkbox
            label="Email me about activity in my communities"
            checked={preferences.emailNotifications ?? true}
            onChange={(event) => save({ emailNotifications: event.target.checked })}
            hint="In-app notifications always stay on."
          />

          <Select
            label="Language"
            value={preferences.language || 'en'}
            onChange={(event) =>
              save({ language: event.target.value }, 'Language preference saved')
            }
            options={[{ value: 'en', label: 'English' }]}
            hint="More languages are planned — your choice is stored ready for them."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Password"
          description="Changing your password signs you out everywhere else."
        />
        <CardBody>
          <form
            onSubmit={passwordForm.handleSubmit(onChangePassword)}
            noValidate
            className="space-y-4"
          >
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              required
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters, with a letter and a number."
              required
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              required
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword')}
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={passwordForm.formState.isSubmitting}>
                Change password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Sessions" />
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-muted">
            Signed in somewhere you no longer trust? Sign out of every device at once.
          </p>
          <Button
            variant="outline"
            onClick={() => logout({ everywhere: true }).then(() => navigate('/login'))}
          >
            Sign out everywhere
          </Button>
        </CardBody>
      </Card>

      <Card className="border-error/40">
        <CardHeader
          title="Deactivate account"
          description="Your posts stay, but your profile is hidden and you cannot sign in."
        />
        <CardBody className="flex justify-end">
          <Button variant="danger" onClick={() => setConfirmDeactivate(true)}>
            Deactivate my account
          </Button>
        </CardBody>
      </Card>

      <ConfirmDialog
        isOpen={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={handleDeactivate}
        title="Deactivate your account?"
        message="You will be signed out immediately and will not be able to sign back in. A platform admin can restore your account later."
        confirmLabel="Deactivate account"
      />
    </div>
  );
}
