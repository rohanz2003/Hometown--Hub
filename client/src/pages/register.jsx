/**
 * pages/register.jsx — Phase 1 sign-up screen.
 *
 * Hometown is required at registration: it is what connects a new account to the
 * right communities.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { registerSchema } from '../utils/validators';

export default function RegisterPage() {
  const { register: createAccount } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      city: '',
      state: '',
      country: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      const user = await createAccount({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        hometown: { city: values.city, state: values.state, country: values.country },
      });
      toast.success(`Welcome to Hometown Hub, ${user.name.split(' ')[0]}!`);
      navigate('/communities', { replace: true });
    } catch (error) {
      Object.entries(error.fieldErrors || {}).forEach(([field, message]) => {
        setError(field.replace('hometown.', ''), { message });
      });
      if (!Object.keys(error.fieldErrors || {}).length) toast.error(error.message);
    }
  };

  return (
    <div className="hh-card px-5 py-6 sm:px-7 sm:py-8">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Tell us where you are from and we will help you find your community.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Asha Menon"
          required
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Phone"
          type="tel"
          autoComplete="tel"
          hint="Optional — some communities use it to reach members."
          error={errors.phone?.message}
          {...register('phone')}
        />

        <fieldset className="space-y-3">
          <legend className="hh-label">Your hometown</legend>
          <Input
            label="City or village"
            placeholder="Kollengode"
            required
            error={errors.city?.message}
            {...register('city')}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="State or region" error={errors.state?.message} {...register('state')} />
            <Input label="Country" error={errors.country?.message} {...register('country')} />
          </div>
        </fieldset>

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          required
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
