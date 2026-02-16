import { useState } from 'react';
import {
  Sparkles,
  Code,
  Zap,
  Shield,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import apiClient from '../api/client';
import LogViewer from './LogViewer';
import type { AgentCreateRequest } from '../types';

export default function AgentCreator() {
  const [formData, setFormData] = useState<AgentCreateRequest>({
    description: '',
    output_format: 'mcp',
    language: 'typescript',
    options: {
      include_tests: true,
      include_docs: true,
      optimize_for: 'quality',
    },
  });

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.createAgent(formData);
      setSessionId(response.id);
      setSuccess(true);

      // Reset form after 3 seconds, but keep sessionId for LogViewer
      setTimeout(() => {
        setFormData({
          description: '',
          output_format: 'mcp',
          language: 'typescript',
          options: {
            include_tests: true,
            include_docs: true,
            optimize_for: 'quality',
          },
        });
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create agent');
      setSessionId(null);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-6">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Create New Agent</h2>
              <p className="text-purple-100 text-sm">
                Describe your agent and we'll build it in 20-35 minutes
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Agent Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors resize-none"
              rows={4}
              placeholder="E.g., A customer support chatbot that can answer questions about our product, handle returns, and escalate complex issues..."
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Be specific about what the agent should do. The more detail, the better the result.
            </p>
          </div>

          {/* Output Format */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Output Format *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'mcp', label: 'MCP Server', desc: 'Model Context Protocol' },
                { value: 'skill', label: 'Claude Skill', desc: 'For Claude Code' },
                { value: 'cli', label: 'CLI Tool', desc: 'Command-line app' },
                { value: 'library', label: 'Library', desc: 'Reusable package' },
              ].map((format) => (
                <button
                  key={format.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, output_format: format.value as any })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.output_format === format.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{format.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{format.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Language *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'typescript', label: 'TypeScript', icon: '📘' },
                { value: 'python', label: 'Python', icon: '🐍' },
              ].map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, language: lang.value as any })}
                  className={`p-4 rounded-xl border-2 text-left transition-all flex items-center space-x-3 ${
                    formData.language === lang.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{lang.icon}</span>
                  <span className="font-semibold text-gray-900">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Options
            </label>

            {/* Include Tests */}
            <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.options?.include_tests}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    options: { ...formData.options, include_tests: e.target.checked },
                  })
                }
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Include Tests</div>
                <div className="text-sm text-gray-500">Generate comprehensive test suite</div>
              </div>
            </label>

            {/* Include Docs */}
            <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.options?.include_docs}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    options: { ...formData.options, include_docs: e.target.checked },
                  })
                }
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Include Documentation</div>
                <div className="text-sm text-gray-500">Generate README and API docs</div>
              </div>
            </label>
          </div>

          {/* Optimization */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Optimize For
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'speed', label: 'Speed', icon: Zap, color: 'yellow' },
                { value: 'quality', label: 'Quality', icon: Sparkles, color: 'purple' },
                { value: 'trust', label: 'Trust', icon: Shield, color: 'green' },
                { value: 'budget', label: 'Budget', icon: DollarSign, color: 'blue' },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        options: { ...formData.options, optimize_for: opt.value as any },
                      })
                    }
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.options?.optimize_for === opt.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 text-${opt.color}-500`} />
                    <div className="font-semibold text-gray-900 text-sm">{opt.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-xl animate-fade-in">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-green-900">Agent creation started!</div>
                <div className="text-sm text-green-700 mt-1">
                  Session ID: <code className="bg-green-100 px-2 py-1 rounded">{sessionId}</code>
                </div>
                <div className="text-sm text-green-700 mt-1">
                  Watch the logs below for real-time progress
                </div>
              </div>
            </div>
          )}

          {/* Real-time Logs */}
          {sessionId && (
            <div className="animate-fade-in">
              <LogViewer
                sessionId={sessionId}
                token={apiClient.getToken() || ''}
                autoScroll={true}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating || !formData.description}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Agent...</span>
              </>
            ) : (
              <>
                <Code className="w-5 h-5" />
                <span>Create Agent</span>
              </>
            )}
          </button>

          {/* Info */}
          <div className="text-center text-sm text-gray-500">
            <p>⏱️ Estimated time: 20-35 minutes • 💰 Cost: ~$0.82 in API usage</p>
          </div>
        </form>
      </div>
    </div>
  );
}
