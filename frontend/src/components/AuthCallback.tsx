import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, fetchUser } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=' + error);
        return;
      }

      if (!token) {
        console.error('No token received');
        navigate('/login?error=no_token');
        return;
      }

      // Save token
      setToken(token);

      // Fetch user data
      try {
        await fetchUser();
        navigate('/dashboard');
      } catch (error) {
        console.error('Failed to fetch user:', error);
        navigate('/login?error=fetch_failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setToken, fetchUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Signing you in...
        </h2>
        <p className="text-gray-600">
          Please wait while we verify your credentials
        </p>
      </div>
    </div>
  );
}
