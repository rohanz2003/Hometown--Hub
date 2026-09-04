/**
 * pages/reset-password.jsx — completes the Phase 1 password reset.
 *
 * The token and email arrive as query parameters from the emailed link. A
 * successful reset signs the user straight in and invalidates their other sessions.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { resetPasswordSchema } from '../utils/validators';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const { resetPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ password }) => {
    try {
      await resetPassword({ email, token, password });
      toast.success('Your password has been changed');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error.fieldErrors?.password)
        setError('password', { message: error.fieldErrors.password });
      else toast.error(error.message);
    }
  };

  if (!token || !email) {
    return (
      <div className="hh-card px-5 py-6 text-center sm:px-7 sm:py-8">
        <span aria-hidden="true" className="text-4xl">
          🔗
        </span>
        <h1 className="mt-3 text-xl font-bold">That reset link is incomplete</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Reset links expire after 30 minutes. Request a fresh one to continue.
        </p>
        <Button as={Link} to="/forgot-password" fullWidth className="mt-5">
          Request a new link
        </Button>
      </div>
    );
  }

  return (
    <div className="hh-card px-5 py-6 sm:px-7 sm:py-8">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Resetting for <strong className="text-ink">{email}</strong>. You will be signed out of your
        other devices.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          required
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          Change password
        </Button>
      </form>
    </div>
  );
}
