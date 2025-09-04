import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/index.js';
import { useOrganization } from '../../hooks/useOrganization.js';
import { useToast } from '../../hooks/useToast.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Card from '../../components/ui/Card.jsx';
import Logo from '../../components/ui/Logo.jsx';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { selectOrganization } = useOrganization();
  const { success } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const watchPassword = watch('password');
  const inviteToken = sessionStorage.getItem('inviteToken');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await authService.register({
        email: data.email,
        password: data.password,
        organizationName: inviteToken ? undefined : data.organizationName,
        inviteToken
      });
      
      if (inviteToken) {
        sessionStorage.removeItem('inviteToken');
        success('Successfully joined organization!');
      }
      
      if (result.organizationId) {
        selectOrganization(result.organizationId);
      }
      
      navigate('/agents');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-gray-50/30 to-orange-50/20 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto">
            <Logo size="lg" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            {inviteToken ? 'Join Organization' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {inviteToken ? 'Complete your registration to join the organization' : 'Get started with WhatsUp Worker'}
          </p>
        </div>

        {/* Form */}
        <Card className="mt-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {!inviteToken && (
              <Input
                label="Organization name"
                type="text"
                autoComplete="organization"
                required
                {...register('organizationName', {
                  required: 'Organization name is required',
                  minLength: {
                    value: 2,
                    message: 'Organization name must be at least 2 characters'
                  }
                })}
                error={errors.organizationName?.message}
              />
            )}

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              error={errors.email?.message}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
                error={errors.password?.message}
                hint="Must be at least 8 characters"
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === watchPassword || 'Passwords do not match'
                })}
                error={errors.confirmPassword?.message}
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {inviteToken ? 'Join Organization' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-green-600 hover:text-green-500 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
