import { useEffect, useState, useRef } from 'react';

interface LogEntry {
  type: 'stdout' | 'stderr' | 'status' | 'done';
  message?: string;
  status?: string;
  progress?: number;
  timestamp: string;
  index?: number;
}

interface LogViewerProps {
  sessionId: string;
  token: string;
  autoScroll?: boolean;
}

export default function LogViewer({ sessionId, token, autoScroll = true }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<string>('connecting');
  const [progress, setProgress] = useState<number>(0);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE endpoint with token as query parameter
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/agents/${sessionId}/logs/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data: LogEntry = JSON.parse(event.data);

        if (data.type === 'status') {
          setStatus(data.status || 'unknown');
          setProgress(data.progress || 0);
        } else if (data.type === 'done') {
          setStatus(data.status || 'completed');
          eventSource.close();
        } else {
          setLogs((prevLogs) => [...prevLogs, data]);
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setStatus('error');
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [sessionId, token]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const getPhaseEmoji = (message: string): string => {
    if (message.includes('Research')) return '🔍';
    if (message.includes('Clarification')) return '💬';
    if (message.includes('Design')) return '🏗️';
    if (message.includes('Implementation')) return '⚙️';
    if (message.includes('Packaging')) return '📦';
    if (message.includes('Learning')) return '🧠';
    if (message.includes('completed')) return '✅';
    if (message.includes('error') || message.includes('failed')) return '❌';
    if (message.includes('WARNING')) return '⚠️';
    return '📝';
  };

  const getLogColor = (log: LogEntry): string => {
    if (log.type === 'stderr') return 'text-red-400';
    if (log.message?.includes('ERROR')) return 'text-red-400';
    if (log.message?.includes('WARNING')) return 'text-yellow-400';
    if (log.message?.includes('completed')) return 'text-green-400';
    if (log.message?.includes('Starting')) return 'text-blue-400';
    return 'text-gray-300';
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'in_progress': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'connected': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status === 'connected' || status === 'in_progress' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-sm font-medium text-gray-300">
              Build Logs
            </span>
          </div>
          <span className={`text-sm ${getStatusColor(status)}`}>
            {status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Progress Bar */}
        {progress > 0 && progress < 100 && (
          <div className="flex items-center space-x-2">
            <div className="w-32 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-400">{progress}%</span>
          </div>
        )}
      </div>

      {/* Logs Container */}
      <div className="bg-black p-4 font-mono text-xs h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p>Waiting for logs...</p>
            </div>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1 flex items-start">
              <span className="text-gray-500 mr-2 select-none">
                {formatTime(log.timestamp)}
              </span>
              <span className="mr-2 select-none">
                {log.message && getPhaseEmoji(log.message)}
              </span>
              <span className={getLogColor(log)}>
                {log.message?.trim()}
              </span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Footer with stats */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <span>{logs.length} log entries</span>
        <span>Session: {sessionId.substring(0, 16)}...</span>
      </div>
    </div>
  );
}
