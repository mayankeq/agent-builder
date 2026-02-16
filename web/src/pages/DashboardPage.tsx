import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Download, Trash2, StopCircle } from 'lucide-react';
import { useSessions, useSessionStats, useWebSocket } from '@/hooks';
import { StatusBadge, Loading, CardSkeleton, ProgressBar } from '@/components';
import { formatRelativeTime, OUTPUT_TYPE_LABELS, LANGUAGE_LABELS, truncate } from '@/utils';
import { SessionStatus, OutputType } from '@/types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | ''>('');
  const [outputTypeFilter, setOutputTypeFilter] = useState<OutputType | ''>('');

  const { data, isLoading, deleteSession, cancelSession } = useSessions({
    page,
    pageSize: 10,
    search: search || undefined,
    status: statusFilter || undefined,
    outputType: outputTypeFilter || undefined,
  });

  const { data: stats } = useSessionStats();

  // Connect to WebSocket for real-time updates
  useWebSocket();

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteSession(sessionId);
    }
  };

  const handleCancel = (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to cancel this session?')) {
      cancelSession(sessionId);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
              <p className="text-secondary-600 mt-1">Manage your agent creation sessions</p>
            </div>
            <button
              onClick={() => navigate('/create')}
              className="btn-primary btn-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Agent
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-secondary-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-secondary-900">{stats.total}</div>
                <div className="text-sm text-secondary-600">Total Sessions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-green-700">Completed</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <div className="text-sm text-blue-700">In Progress</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SessionStatus | '')}
                className="input pl-10"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="clarifying">Clarifying</option>
                <option value="designing">Designing</option>
                <option value="implementing">Implementing</option>
                <option value="packaging">Packaging</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <select
                value={outputTypeFilter}
                onChange={(e) => setOutputTypeFilter(e.target.value as OutputType | '')}
                className="input pl-10"
              >
                <option value="">All Types</option>
                <option value="skill">Skill</option>
                <option value="mcp">MCP Server</option>
                <option value="cli">CLI</option>
                <option value="library">Library</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : !data || data.sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">
              No sessions found
            </h3>
            <p className="text-secondary-600 mb-6">
              {search || statusFilter || outputTypeFilter
                ? 'Try adjusting your filters'
                : 'Create your first agent to get started'}
            </p>
            {!search && !statusFilter && !outputTypeFilter && (
              <button onClick={() => navigate('/create')} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {data.sessions.map((session) => {
                const isInProgress = ['pending', 'clarifying', 'designing', 'implementing', 'packaging'].includes(session.status);

                return (
                  <Link
                    key={session.id}
                    to={`/sessions/${session.id}`}
                    className="block card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                          {truncate(session.description, 80)}
                        </h3>
                        <div className="flex items-center space-x-3 text-sm text-secondary-600">
                          <span>{OUTPUT_TYPE_LABELS[session.outputType]}</span>
                          <span>•</span>
                          <span>{LANGUAGE_LABELS[session.language]}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(session.createdAt)}</span>
                        </div>
                      </div>
                      <StatusBadge status={session.status} />
                    </div>

                    {isInProgress && (
                      <div className="mb-3">
                        <ProgressBar progress={session.progress} />
                        {session.currentPhase && (
                          <p className="text-xs text-secondary-600 mt-1">
                            Current phase: {session.currentPhase}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-secondary-200">
                      <div className="text-sm text-secondary-600">
                        {session.completedAt && (
                          <span>Completed {formatRelativeTime(session.completedAt)}</span>
                        )}
                        {session.error && (
                          <span className="text-red-600">Error: {truncate(session.error, 50)}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {session.status === 'completed' && session.result?.artifactUrl && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(session.result.artifactUrl, '_blank');
                            }}
                            className="btn-ghost btn-sm"
                            title="Download artifacts"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {isInProgress && (
                          <button
                            onClick={(e) => handleCancel(session.id, e)}
                            className="btn-ghost btn-sm text-orange-600 hover:text-orange-700"
                            title="Cancel session"
                          >
                            <StopCircle className="w-4 h-4" />
                          </button>
                        )}
                        {!isInProgress && (
                          <button
                            onClick={(e) => handleDelete(session.id, e)}
                            className="btn-ghost btn-sm text-red-600 hover:text-red-700"
                            title="Delete session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary btn-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-secondary-600">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
