import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  StopCircle,
  Trash2,
} from 'lucide-react';
import { useSession, useSessions, useWebSocket } from '@/hooks';
import { Loading, StatusBadge, ProgressBar, CodePreview, Modal } from '@/components';
import {
  formatRelativeTime,
  formatDateTime,
  OUTPUT_TYPE_LABELS,
  LANGUAGE_LABELS,
  SESSION_STATUS_LABELS,
} from '@/utils';
import { downloadsApi } from '@/api';
import { toast } from 'react-toastify';

export const SessionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading } = useSession(id);
  const { cancelSession, deleteSession } = useSessions();
  const [downloading, setDownloading] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Connect to WebSocket for this specific session
  useWebSocket({
    sessionId: id,
  });

  const handleDownload = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      const blob = await downloadsApi.downloadZip(id);
      downloadsApi.triggerDownload(blob, `agent-${id}.zip`);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download artifacts');
    } finally {
      setDownloading(false);
    }
  };

  const handleCancel = () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to cancel this session?')) {
      cancelSession(id, {
        onSuccess: () => {
          navigate('/dashboard');
        },
      });
    }
  };

  const handleDelete = () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteSession(id, {
        onSuccess: () => {
          navigate('/dashboard');
        },
      });
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading session details..." />;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full card text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">Session not found</h2>
          <p className="text-secondary-600 mb-6">
            The session you're looking for doesn't exist or has been deleted.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isInProgress = ['pending', 'clarifying', 'designing', 'implementing', 'packaging'].includes(
    session.status
  );
  const isCompleted = session.status === 'completed';
  const isFailed = session.status === 'failed';

  const phases = [
    { key: 'pending', label: 'Pending', progress: 0 },
    { key: 'clarifying', label: 'Clarifying Requirements', progress: 20 },
    { key: 'designing', label: 'Designing Architecture', progress: 40 },
    { key: 'implementing', label: 'Implementing Code', progress: 60 },
    { key: 'packaging', label: 'Packaging Agent', progress: 80 },
    { key: 'completed', label: 'Completed', progress: 100 },
  ];

  const currentPhaseIndex = phases.findIndex((p) => p.key === session.status);

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                {session.description}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-secondary-600">
                <span>{OUTPUT_TYPE_LABELS[session.outputType]}</span>
                <span>•</span>
                <span>{LANGUAGE_LABELS[session.language]}</span>
                <span>•</span>
                <span>Created {formatRelativeTime(session.createdAt)}</span>
              </div>
            </div>
            <StatusBadge status={session.status} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress */}
            {isInProgress && (
              <div className="card">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                  Progress
                </h2>
                <ProgressBar progress={session.progress} />
                {session.currentPhase && (
                  <p className="text-sm text-secondary-600 mt-2">
                    Current phase: {session.currentPhase}
                  </p>
                )}

                {/* Phase Timeline */}
                <div className="mt-6 space-y-3">
                  {phases.map((phase, index) => {
                    const isActive = phase.key === session.status;
                    const isComplete = index < currentPhaseIndex;
                    const isPending = index > currentPhaseIndex;

                    return (
                      <div key={phase.key} className="flex items-center space-x-3">
                        {isComplete && (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        )}
                        {isActive && (
                          <Loader2 className="w-5 h-5 text-primary-600 flex-shrink-0 animate-spin" />
                        )}
                        {isPending && (
                          <Clock className="w-5 h-5 text-secondary-400 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              isActive
                                ? 'text-primary-600'
                                : isComplete
                                ? 'text-green-600'
                                : 'text-secondary-400'
                            }`}
                          >
                            {phase.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Result */}
            {isCompleted && session.result && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-secondary-900">
                    Agent Created Successfully
                  </h2>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-secondary-600 mb-4">
                  Your agent has been created and is ready to use!
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="btn-primary"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download ZIP
                      </>
                    )}
                  </button>
                  <button onClick={() => setShowArtifacts(true)} className="btn-secondary">
                    <FileText className="w-4 h-4 mr-2" />
                    View Files
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {isFailed && (
              <div className="card border-red-200 bg-red-50">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-red-900 mb-2">
                      Agent Creation Failed
                    </h2>
                    <p className="text-red-700">{session.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="card">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                Description
              </h2>
              <p className="text-secondary-700 whitespace-pre-wrap">
                {session.description}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="card">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Actions</h2>
              <div className="space-y-2">
                {isInProgress && (
                  <button onClick={handleCancel} className="btn-secondary w-full">
                    <StopCircle className="w-4 h-4 mr-2" />
                    Cancel Session
                  </button>
                )}
                {isCompleted && (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="btn-primary w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download ZIP
                  </button>
                )}
                {!isInProgress && (
                  <button
                    onClick={handleDelete}
                    className="btn-secondary w-full text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Session
                  </button>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="card">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Details</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-secondary-600">Status</dt>
                  <dd className="text-sm font-medium text-secondary-900 mt-1">
                    {SESSION_STATUS_LABELS[session.status]}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-secondary-600">Output Type</dt>
                  <dd className="text-sm font-medium text-secondary-900 mt-1">
                    {OUTPUT_TYPE_LABELS[session.outputType]}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-secondary-600">Language</dt>
                  <dd className="text-sm font-medium text-secondary-900 mt-1">
                    {LANGUAGE_LABELS[session.language]}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-secondary-600">Created</dt>
                  <dd className="text-sm font-medium text-secondary-900 mt-1">
                    {formatDateTime(session.createdAt)}
                  </dd>
                </div>
                {session.completedAt && (
                  <div>
                    <dt className="text-sm text-secondary-600">Completed</dt>
                    <dd className="text-sm font-medium text-secondary-900 mt-1">
                      {formatDateTime(session.completedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Artifacts Modal */}
      <Modal
        isOpen={showArtifacts}
        onClose={() => setShowArtifacts(false)}
        title="Artifacts"
        size="xl"
      >
        <div className="text-center py-8 text-secondary-600">
          <FileText className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
          <p>File preview coming soon...</p>
          <p className="text-sm mt-2">Download the ZIP to view all files</p>
        </div>
      </Modal>
    </div>
  );
};
