import { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, Code, FileText, Download, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../api/client';
import type { AgentSession } from '../types';

export default function AgentList() {
  const [agents, setAgents] = useState<AgentSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const agentsRef = useRef<AgentSession[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  useEffect(() => {
    loadAgents();

    // Auto-refresh every 3 seconds if there are in-progress agents
    const interval = setInterval(() => {
      // Use ref to avoid dependency on agents state
      if (agentsRef.current.some(a => a.status === 'in_progress')) {
        loadAgents(true); // Silent refresh
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount

  const loadAgents = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await apiClient.listAgents();
      setAgents(response.agents);
      // Removed auto-expand and auto-scroll - user has full control
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLogs = (agentId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(agentId)) {
      newExpanded.delete(agentId);
    } else {
      newExpanded.add(agentId);
    }
    setExpandedLogs(newExpanded);
  };

  const handleDownload = async (sessionId: string) => {
    try {
      await apiClient.downloadAgent(sessionId);
    } catch (err: any) {
      console.error('Download failed:', err);
      alert(`Download failed: ${err.message || 'Unknown error'}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Agents</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => loadAgents()}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
        <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Agents Yet</h3>
        <p className="text-gray-600 mb-6">
          Create your first agent to get started building with Synthient
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all"
        >
          Create Your First Agent
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Agents</h2>
          <p className="text-gray-600">
            {agents.length} {agents.length === 1 ? 'agent' : 'agents'} created
          </p>
        </div>
        <button
          onClick={() => loadAgents()}
          className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Agent Cards */}
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {getStatusIcon(agent.status)}
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {agent.description}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    agent.status
                  )}`}
                >
                  {agent.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                  {agent.output_format.toUpperCase()}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  {agent.language}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {agent.status === 'in_progress' && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{agent.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${agent.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Build Logs */}
          {(agent.status === 'in_progress' || agent.status === 'failed') && agent.logs && agent.logs.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => toggleLogs(agent.id)}
                className="flex items-center space-x-2 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors mb-3"
              >
                <Terminal className="w-4 h-4" />
                <span>Build Progress ({agent.logs.length} events)</span>
                {expandedLogs.has(agent.id) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedLogs.has(agent.id) && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {agent.logs.map((log, idx) => {
                      const isError = log.type === 'stderr' || log.message.includes('ERROR');
                      const isWarning = log.message.includes('WARNING');
                      const isSuccess = log.message.includes('completed') || log.message.includes('successful');

                      return (
                        <div
                          key={idx}
                          className={`flex items-start space-x-3 text-sm ${
                            isError ? 'text-red-700' :
                            isWarning ? 'text-amber-700' :
                            isSuccess ? 'text-green-700' :
                            'text-gray-700'
                          }`}
                        >
                          <span className="text-xs text-gray-500 font-mono mt-0.5 flex-shrink-0">
                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                          </span>
                          <div className={`flex-1 ${isError || isWarning ? 'font-medium' : ''}`}>
                            {log.message.split('\n').map((line, i) => (
                              <div key={i}>{line}</div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {agent.status === 'completed' && agent.result && (
            <div className="mb-4 space-y-4">
              {/* Success Banner */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-green-900 mb-1">Agent Completed Successfully!</div>
                    <div className="text-sm text-green-700">
                      Your agent has been built and is ready to download.
                    </div>
                  </div>
                </div>
              </div>

              {/* Original Request Summary */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-blue-900 mb-1">Original Request</div>
                    <div className="text-sm text-blue-800 italic">"{agent.description}"</div>
                  </div>
                </div>
              </div>

              {/* Generated Files */}
              {agent.result.files && agent.result.files.length > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Code className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-purple-900 mb-2">
                        Generated Agents ({agent.result.files.length} files)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-800">
                        {agent.result.files.slice(0, 10).map((file, idx) => (
                          <div key={idx} className="flex items-center space-x-2 bg-white bg-opacity-50 px-3 py-1.5 rounded">
                            <FileText className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                            <span className="font-mono text-xs truncate">{file}</span>
                          </div>
                        ))}
                      </div>
                      {agent.result.files.length > 10 && (
                        <div className="mt-2 text-xs text-purple-700 italic">
                          +{agent.result.files.length - 10} more files...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tests Summary */}
              {agent.result.tests_passed !== undefined && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">Test Results</div>
                      <div className="text-sm text-gray-700">
                        {agent.result.tests_passed} of {agent.result.tests_total} tests passed
                        {agent.result.tests_passed === agent.result.tests_total && (
                          <span className="ml-2 text-green-600 font-medium">✓ All passing</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Button */}
              <button
                onClick={() => handleDownload(agent.id)}
                className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
              >
                <Download className="w-5 h-5" />
                <span>Download Complete Agent Package</span>
              </button>
            </div>
          )}

          {/* Error */}
          {agent.status === 'failed' && agent.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-900 mb-1">Build Failed</div>
                  <div className="text-sm text-red-700">{agent.error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Created {format(new Date(agent.created_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
            {agent.completed_at && (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>
                  Completed {format(new Date(agent.completed_at), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
