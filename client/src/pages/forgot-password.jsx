/**
 * pages/forgot-password.jsx — starts the Phase 1 password reset flow.
 *
 * The response is deliberately identical whether or not the email exists, so the
 * form cannot be used to discover which addresses are registered. Outside
 * production the API also returns the reset link, which is surfaced here so the
 * flow is testable without a mail provider (see README § Known limitations).
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { useToast } from '../context/ToastContext';
import * as authService from '../services/authService';
import { forgotPasswordSchema } from '../utils/validators';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [sent, setSent] = useState(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    try {
      setSent(await authService.forgotPassword(email));
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (sent) {
    const devLink = sent.resetToken
      ? `/reset-password?token=${sent.resetToken}&email=${encodeURIComponent(getValues('email'))}`
      : null;

    return (
      <div className="hh-card px-5 py-6 sm:px-7 sm:py-8">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-sm text-ink-muted">
          If <strong className="text-ink">{getValues('email')}</strong> is registered, a link to
          reset your password is on its way. The link expires in 30 minutes.
        </p>

        {devLink && (
          <div className="mt-4 rounded-lg bg-warning-soft px-3 py-2.5 text-sm">
            <p className="font-medium text-ink">Development mode</p>
            <p className="mt-0.5 text-ink-muted">
              No mail provider is configured, so the link is shown here instead of emailed.
            </p>
            <Link
              to={devLink}
              className="mt-1.5 inline-block font-medium text-primary hover:underline"
            >
              Open the reset link →
            </Link>
          </div>
        )}

        <Button as={Link} to="/login" variant="outline" fullWidth className="mt-5">
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="hh-card px-5 py-6 sm:px-7 sm:py-8">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Enter the email you signed up with and we will send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
