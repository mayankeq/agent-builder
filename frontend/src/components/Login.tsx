import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, Zap, Brain } from 'lucide-react';
import { useAuthStore } from '../context/AuthContext';
import apiClient from '../api/client';
import type { AuthConfig } from '../types';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuthStore();
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    // Fetch auth config to show allowed domains
    apiClient.getAuthConfig().then(setAuthConfig).catch(console.error);
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Branding */}
        <div className="text-center lg:text-left animate-fade-in">
          <div className="inline-flex items-center space-x-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Synthient
            </h1>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Build AI Agents in Minutes
          </h2>

          <p className="text-xl text-gray-600 mb-8">
            Create production-ready LLM agents with extended thinking in 20-35 minutes.
            Powered by collective intelligence.
          </p>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-purple-500" />
              <span className="text-gray-700">Lightning fast - 20-35 min builds</span>
            </div>
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-blue-500" />
              <span className="text-gray-700">Extended thinking capabilities</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <span className="text-gray-700">Production-ready with 360+ tests</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-indigo-500" />
              <span className="text-gray-700">Secure, self-hosted, privacy-first</span>
            </div>
          </div>
        </div>

        {/* Right side - Login Card */}
        <div className="animate-slide-up">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Synthient
              </h3>
              <p className="text-gray-600">
                Sign in with your company Google account
              </p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={login}
              className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg group"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Security Info */}
            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 mb-1">
                    Secure Authentication
                  </p>
                  <p className="text-blue-700">
                    Only Google Workspace accounts from authorized domains are allowed.
                    Personal Gmail accounts are automatically blocked.
                  </p>
                </div>
              </div>
            </div>

            {/* Allowed Domains */}
            {authConfig && authConfig.allowed_domains.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Authorized Domains
                </p>
                <div className="flex flex-wrap gap-2">
                  {authConfig.allowed_domains.map((domain) => (
                    <span
                      key={domain}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      @{domain}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>
                By signing in, you agree to our{' '}
                <a href="#" className="text-purple-600 hover:text-purple-700">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-purple-600 hover:text-purple-700">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
