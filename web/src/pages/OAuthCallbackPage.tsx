import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loading } from '@/components';
import { authApi } from '@/api';
import { toast } from 'react-toastify';

export const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        toast.error(`Authentication failed: ${error}`);
        navigate('/login');
        return;
      }

      if (!token) {
        toast.error('No authentication token received');
        navigate('/login');
        return;
      }

      // Save token
      authApi.setToken(token);

      // Verify token by fetching user info
      try {
        await authApi.getMe();
        toast.success('Successfully logged in!');
        navigate('/dashboard');
      } catch (error) {
        toast.error('Failed to verify authentication');
        authApi.clearToken();
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return <Loading fullScreen text="Completing authentication..." />;
};
