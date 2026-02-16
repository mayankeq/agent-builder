import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Loader2 } from 'lucide-react';
import { authApi } from '@/api';
import { SSOProvider } from '@/types';
import { toast } from 'react-toastify';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      try {
        const status = await authApi.getStatus();
        if (status.authenticated) {
          navigate('/dashboard');
        }
      } catch {
        // Not authenticated, continue to login
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await authApi.getProviders();
        setProviders(data.filter((p) => p.enabled));
      } catch (error) {
        toast.error('Failed to load authentication providers');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleSSOLogin = (provider: SSOProvider) => {
    window.location.href = provider.authUrl;
  };

  const providerIcons: Record<string, string> = {
    google: '🔍',
    azure: '☁️',
    okta: '🔒',
  };

  const providerColors: Record<string, string> = {
    google: 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300',
    azure: 'bg-blue-600 hover:bg-blue-700 text-white',
    okta: 'bg-gray-800 hover:bg-gray-900 text-white',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            Agent Builder
          </h1>
          <p className="text-secondary-600">
            Create intelligent LLM-based agents with ease
          </p>
        </div>

        {/* Login Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6 text-center">
            Sign in to continue
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary-600">
                No authentication providers are configured.
              </p>
              <p className="text-sm text-secondary-500 mt-2">
                Please contact your administrator.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <button
                  key={provider.name}
                  onClick={() => handleSSOLogin(provider)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                    providerColors[provider.name] || 'btn-primary'
                  }`}
                >
                  <span className="text-xl">{providerIcons[provider.name]}</span>
                  <span>Continue with {provider.displayName}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-secondary-200">
            <p className="text-xs text-secondary-500 text-center">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-600">5+</div>
            <div className="text-xs text-secondary-600">Templates</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-600">4</div>
            <div className="text-xs text-secondary-600">Output Types</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-600">2</div>
            <div className="text-xs text-secondary-600">Languages</div>
          </div>
        </div>
      </div>
    </div>
  );
};
