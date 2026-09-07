/**
 * pages/register.jsx — Phase 1 sign-up screen.
 *
 * Hometown is required at registration: it is what connects a new account to the
 * right communities.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { registerSchema } from '../utils/validators';
import { COUNTRY_OPTIONS, getCountryCode, getCountryName, getStateOptions } from '../utils/locations';
import { HidePasswordIcon, ShowPasswordIcon } from '../components/ui/icons';

export default function RegisterPage() {
  const { register: createAccount } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  const country = watch('country');
  const countryCode = getCountryCode(country);
  const stateOptions = getStateOptions(countryCode);
  const countryRegistration = register('country');

  const handleCountryChange = (event) => {
    setValue('country', getCountryName(event.target.value), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue('state', '', { shouldDirty: true, shouldValidate: true });
  };

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
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Country"
              placeholder="Select a country"
              options={COUNTRY_OPTIONS}
              value={countryCode}
              {...countryRegistration}
              onChange={handleCountryChange}
              error={errors.country?.message}
            />
            <Select
              label="State or region"
              placeholder={countryCode ? 'Select a state or region' : 'Choose a country first'}
              options={stateOptions}
              disabled={!countryCode || stateOptions.length === 0}
              error={errors.state?.message}
              {...register('state')}
            />
          </div>
          <Input
            label="City or village"
            placeholder="Kollengode"
            required
            error={errors.city?.message}
            {...register('city')}
          />
        </fieldset>

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          required
          error={errors.password?.message}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="rounded-md p-1 text-ink-subtle hover:bg-surface-hover hover:text-ink"
            >
              {showPassword ? (
                <HidePasswordIcon className="h-4 w-4" strokeWidth={2} />
              ) : (
                <ShowPasswordIcon className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          }
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((visible) => !visible)}
              aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
              className="rounded-md p-1 text-ink-subtle hover:bg-surface-hover hover:text-ink"
            >
              {showConfirmPassword ? (
                <HidePasswordIcon className="h-4 w-4" strokeWidth={2} />
              ) : (
                <ShowPasswordIcon className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          }
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
