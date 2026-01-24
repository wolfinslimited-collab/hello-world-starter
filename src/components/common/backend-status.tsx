/**
 * Backend Status Indicator Component
 * Shows real-time connection status to the backend API
 */

import { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Server, Activity } from 'lucide-react';
import useBackendStatus from 'hooks/use-backend-status';
import { baseUrl } from 'utils/request';
import { clsx } from 'clsx';

interface BackendStatusProps {
  showDetails?: boolean;
  className?: string;
}

const BackendStatus = ({ showDetails = false, className }: BackendStatusProps) => {
  const { status, isChecking, checkStatus } = useBackendStatus(30000);
  const [expanded, setExpanded] = useState(false);

  const statusColor = status.isOnline 
    ? 'text-emerald-500' 
    : 'text-rose-500';

  const bgColor = status.isOnline 
    ? 'bg-emerald-500/10 border-emerald-500/20' 
    : 'bg-rose-500/10 border-rose-500/20';

  if (!showDetails) {
    // Minimal indicator
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className={clsx(
          'relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all',
          bgColor,
          className
        )}
        title={status.isOnline ? 'Backend Online' : 'Backend Offline'}
      >
        {status.isOnline ? (
          <Wifi className={clsx('size-4', statusColor)} />
        ) : (
          <WifiOff className={clsx('size-4', statusColor)} />
        )}
        <span className={clsx('text-xs font-medium', statusColor)}>
          {status.isOnline ? 'Online' : 'Offline'}
        </span>
        {status.latency && (
          <span className="text-xs text-neutral-500">
            {status.latency}ms
          </span>
        )}
      </button>
    );
  }

  // Full status card
  return (
    <div className={clsx(
      'rounded-xl border p-4 space-y-4',
      'bg-white dark:bg-neutral-900',
      'border-neutral-200 dark:border-neutral-800',
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'p-2 rounded-lg',
            status.isOnline ? 'bg-emerald-500/10' : 'bg-rose-500/10'
          )}>
            <Server className={clsx('size-5', statusColor)} />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              Backend Status
            </h3>
            <p className="text-sm text-neutral-500">
              {baseUrl || 'Not configured'}
            </p>
          </div>
        </div>
        
        <button
          onClick={checkStatus}
          disabled={isChecking}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            'hover:bg-neutral-100 dark:hover:bg-neutral-800',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCw className={clsx(
            'size-4 text-neutral-500',
            isChecking && 'animate-spin'
          )} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Status */}
        <div className="space-y-1">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">Status</p>
          <div className="flex items-center gap-2">
            <span className={clsx(
              'size-2 rounded-full',
              status.isOnline ? 'bg-emerald-500' : 'bg-rose-500'
            )} />
            <span className={clsx('font-medium', statusColor)}>
              {status.isOnline ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Latency */}
        <div className="space-y-1">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">Latency</p>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-neutral-400" />
            <span className="font-medium text-neutral-900 dark:text-white">
              {status.latency ? `${status.latency}ms` : '—'}
            </span>
          </div>
        </div>

        {/* Last Check */}
        <div className="space-y-1">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">Last Check</p>
          <span className="font-medium text-neutral-900 dark:text-white">
            {status.lastChecked 
              ? status.lastChecked.toLocaleTimeString() 
              : '—'
            }
          </span>
        </div>
      </div>

      {status.error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <p className="text-sm text-rose-500">
            <strong>Error:</strong> {status.error}
          </p>
        </div>
      )}

      {/* Quick Test Endpoints */}
      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
        <p className="text-xs text-neutral-500 mb-2">Available Endpoints:</p>
        <div className="flex flex-wrap gap-2">
          {['/user', '/wallet', '/trade', '/tokens', '/missions'].map((endpoint) => (
            <span
              key={endpoint}
              className="px-2 py-1 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            >
              {endpoint}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BackendStatus;
