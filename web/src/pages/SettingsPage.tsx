import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, CheckCircle2, XCircle, Loader2, AlertCircle, User } from 'lucide-react';
import { useAuth, useApiKeys } from '@/hooks';
import { formatDateTime } from '@/utils';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, logoutAll } = useAuth();
  const { status, addApiKey, validateApiKey, deleteApiKey, isAdding, isValidating, isDeleting } =
    useApiKeys();

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const handleAddApiKey = () => {
    if (apiKeyInput.trim()) {
      addApiKey(apiKeyInput, {
        onSuccess: () => {
          setApiKeyInput('');
          setShowApiKey(false);
        },
      });
    }
  };

  const handleValidateApiKey = () => {
    validateApiKey();
  };

  const handleDeleteApiKey = () => {
    if (window.confirm('Are you sure you want to delete your API key?')) {
      deleteApiKey();
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-secondary-900">Settings</h1>
          <p className="text-secondary-600 mt-1">Manage your account and API configuration</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-5 h-5 text-secondary-600" />
            <h2 className="text-lg font-semibold text-secondary-900">Profile</h2>
          </div>

          {user && (
            <div className="space-y-4">
              {user.avatarUrl && (
                <div>
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-16 h-16 rounded-full"
                  />
                </div>
              )}
              <div>
                <label className="text-sm text-secondary-600">Name</label>
                <p className="font-medium text-secondary-900">{user.name}</p>
              </div>
              <div>
                <label className="text-sm text-secondary-600">Email</label>
                <p className="font-medium text-secondary-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-secondary-600">Provider</label>
                <p className="font-medium text-secondary-900 capitalize">{user.provider}</p>
              </div>
              <div>
                <label className="text-sm text-secondary-600">Last Login</label>
                <p className="font-medium text-secondary-900">
                  {formatDateTime(user.lastLoginAt)}
                </p>
              </div>

              <div className="pt-4 border-t border-secondary-200 space-y-2">
                <button onClick={() => logout()} className="btn-secondary w-full">
                  Logout
                </button>
                <button
                  onClick={() => logoutAll()}
                  className="btn-secondary w-full text-red-600 hover:text-red-700"
                >
                  Logout from all devices
                </button>
              </div>
            </div>
          )}
        </div>

        {/* API Key */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Key className="w-5 h-5 text-secondary-600" />
            <h2 className="text-lg font-semibold text-secondary-900">Anthropic API Key</h2>
          </div>

          <p className="text-secondary-600 mb-4">
            Your API key is required to create agents. It is encrypted and stored securely.
          </p>

          {/* Status */}
          {status && (
            <div className="mb-6">
              {status.hasKey ? (
                <div className="flex items-start space-x-3">
                  {status.isValid ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900">API key is configured and valid</p>
                        {status.lastValidated && (
                          <p className="text-sm text-green-700 mt-1">
                            Last validated: {formatDateTime(status.lastValidated)}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-orange-900">
                          API key is configured but may be invalid
                        </p>
                        <p className="text-sm text-orange-700 mt-1">
                          Please validate or update your API key
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">No API key configured</p>
                    <p className="text-sm text-red-700 mt-1">
                      Add your Anthropic API key to start creating agents
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add/Update API Key */}
          {showApiKey ? (
            <div className="space-y-4">
              <div>
                <label className="label">API Key</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="input"
                />
                <p className="text-xs text-secondary-600 mt-1">
                  Your API key starts with "sk-ant-"
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddApiKey}
                  disabled={isAdding || !apiKeyInput.trim()}
                  className="btn-primary"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save API Key'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowApiKey(false);
                    setApiKeyInput('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button onClick={() => setShowApiKey(true)} className="btn-primary">
                {status?.hasKey ? 'Update API Key' : 'Add API Key'}
              </button>
              {status?.hasKey && (
                <>
                  <button
                    onClick={handleValidateApiKey}
                    disabled={isValidating}
                    className="btn-secondary"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      'Validate'
                    )}
                  </button>
                  <button
                    onClick={handleDeleteApiKey}
                    disabled={isDeleting}
                    className="btn-secondary text-red-600 hover:text-red-700"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-secondary-200">
            <p className="text-xs text-secondary-600">
              <strong>Security:</strong> Your API key is encrypted using AES-256-GCM encryption before
              being stored. It is never logged or exposed in plain text.
            </p>
          </div>
        </div>

        {/* About */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">About</h2>
          <div className="space-y-2 text-sm text-secondary-600">
            <p>
              <strong>Version:</strong> 1.0.0
            </p>
            <p>
              <strong>Documentation:</strong>{' '}
              <a
                href="https://github.com/your-org/agent-builder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                GitHub Repository
              </a>
            </p>
            <p>
              <strong>Support:</strong>{' '}
              <a href="mailto:support@example.com" className="text-primary-600 hover:underline">
                support@example.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
