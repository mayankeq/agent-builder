import React from 'react';
import { SessionStatus } from '@/types';
import { SESSION_STATUS_LABELS, SESSION_STATUS_COLORS } from '@/utils';
import { CheckCircle2, XCircle, Clock, Loader2, StopCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: SessionStatus;
  showIcon?: boolean;
}

const statusIcons: Record<SessionStatus, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  clarifying: <Loader2 className="w-3 h-3 animate-spin" />,
  designing: <Loader2 className="w-3 h-3 animate-spin" />,
  implementing: <Loader2 className="w-3 h-3 animate-spin" />,
  packaging: <Loader2 className="w-3 h-3 animate-spin" />,
  completed: <CheckCircle2 className="w-3 h-3" />,
  failed: <XCircle className="w-3 h-3" />,
  cancelled: <StopCircle className="w-3 h-3" />,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true }) => {
  return (
    <span className={`badge ${SESSION_STATUS_COLORS[status]}`}>
      {showIcon && <span className="mr-1">{statusIcons[status]}</span>}
      {SESSION_STATUS_LABELS[status]}
    </span>
  );
};
