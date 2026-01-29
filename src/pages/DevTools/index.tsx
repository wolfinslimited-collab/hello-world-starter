/**
 * Developer Tools Page
 * Shows backend status and API testing utilities
 */

import useStorage from 'context';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Play, Copy, Check, Cloud, CheckCircle, XCircle } from 'lucide-react';


const ENDPOINTS = [
  { path: '/trade/pairs', method: 'GET', auth: false, description: 'Get trading pairs' },
  { path: '/tokens', method: 'GET', auth: false, description: 'Get airdrop tokens' },
  { path: '/wallet/assets', method: 'GET', auth: true, description: 'Get wallet assets with networks' },
  { path: '/wallet/balance', method: 'GET', auth: true, description: 'Get wallet balances' },
  { path: '/user/profile', method: 'GET', auth: true, description: 'Get user profile' },
  { path: '/missions', method: 'GET', auth: true, description: 'Get missions' },
  { path: '/user/leaderboards', method: 'GET', auth: false, description: 'Get leaderboards' },
  // AsterDEX SAPI endpoints (platform-level, no user auth needed)
  { path: '/asterdex/deposit-address?coin=USDT&network=SOL', method: 'GET', auth: false, description: 'Get AsterDEX deposit address (Solana)' },
  { path: '/asterdex/deposit-address?coin=USDT&network=ETH', method: 'GET', auth: false, description: 'Get AsterDEX deposit address (Ethereum)' },
  { path: '/asterdex/deposit-address?coin=USDT&network=BSC', method: 'GET', auth: false, description: 'Get AsterDEX deposit address (BSC)' },
  { path: '/asterdex/config', method: 'GET', auth: false, description: 'Get AsterDEX supported coins/networks' },
];

const DevTools = () => {
  const { setting: { token, isLoged } } = useStorage();
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');

  const checkCloudStatus = async () => {
    setCloudStatus('checking');
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/api/tokens`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        }
      });
      if (response.ok) {
        setCloudStatus('connected');
      } else {
        setCloudStatus('error');
      }
    } catch {
      setCloudStatus('error');
    }
  };

  const testEndpoint = async (path: string, auth: boolean) => {
    setLoading(prev => ({ ...prev, [path]: true }));
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };
      if (auth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/api${path}`, { headers });
      const data = await response.json();
      setResults(prev => ({ ...prev, [path]: data }));
    } catch (err: any) {
      setResults(prev => ({ ...prev, [path]: { error: err.message } }));
    } finally {
      setLoading(prev => ({ ...prev, [path]: false }));
    }
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Developer Tools
        </h1>
        <p className="text-neutral-500">
          Test Lovable Cloud connectivity and API endpoints
        </p>
      </div>

      {/* Cloud Status */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="size-5 text-blue-500" />
            <h2 className="font-semibold text-neutral-900 dark:text-white">Lovable Cloud Status</h2>
          </div>
          <button
            onClick={checkCloudStatus}
            disabled={cloudStatus === 'checking'}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'bg-blue-500 text-white hover:bg-blue-600',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cloudStatus === 'checking' ? 'Checking...' : 'Check Connection'}
          </button>
        </div>
        
        {cloudStatus !== 'idle' && (
          <div className={clsx(
            'flex items-center gap-2 p-3 rounded-lg',
            cloudStatus === 'connected' && 'bg-emerald-500/10 text-emerald-600',
            cloudStatus === 'error' && 'bg-red-500/10 text-red-600',
            cloudStatus === 'checking' && 'bg-blue-500/10 text-blue-600'
          )}>
            {cloudStatus === 'connected' && <CheckCircle className="size-4" />}
            {cloudStatus === 'error' && <XCircle className="size-4" />}
            <span>
              {cloudStatus === 'connected' && 'Connected to Lovable Cloud'}
              {cloudStatus === 'error' && 'Failed to connect to Lovable Cloud'}
              {cloudStatus === 'checking' && 'Checking connection...'}
            </span>
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-4">
        <h2 className="font-semibold text-neutral-900 dark:text-white">Configuration</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs text-neutral-500 uppercase tracking-wider">Cloud URL</label>
            <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-mono text-sm break-all">
              {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs text-neutral-500 uppercase tracking-wider">Auth Status</label>
            <div className={clsx(
              'p-3 rounded-lg flex items-center justify-between',
              isLoged ? 'bg-emerald-500/10' : 'bg-neutral-100 dark:bg-neutral-800'
            )}>
              <span className={isLoged ? 'text-emerald-600' : 'text-neutral-500'}>
                {isLoged ? 'Authenticated' : 'Not authenticated'}
              </span>
              {isLoged && (
                <button
                  onClick={copyToken}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700"
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {copied ? 'Copied!' : 'Copy Token'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint Tester */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-4">
        <h2 className="font-semibold text-neutral-900 dark:text-white">API Endpoints</h2>
        
        <div className="space-y-3">
          {ENDPOINTS.map(({ path, method, auth, description }) => (
            <div
              key={path}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-500/10 text-blue-500">
                    {method}
                  </span>
                  <span className="font-mono text-sm text-neutral-700 dark:text-neutral-300">
                    {path}
                  </span>
                  {auth && (
                    <span className="px-2 py-0.5 text-xs rounded bg-amber-500/10 text-amber-600">
                      Auth Required
                    </span>
                  )}
                </div>
                <button
                  onClick={() => testEndpoint(path, auth)}
                  disabled={loading[path] || (auth && !isLoged)}
                  className={clsx(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    'bg-neutral-900 text-white hover:bg-neutral-800',
                    'dark:bg-white dark:text-black dark:hover:bg-neutral-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <Play className="size-3" />
                  {loading[path] ? 'Testing...' : 'Test'}
                </button>
              </div>
              
              <div className="p-3 text-sm text-neutral-500">
                {description}
              </div>

              {results[path] && (
                <div className="border-t border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-900 dark:bg-black">
                  <pre className="text-xs text-green-400 overflow-auto max-h-48">
                    {JSON.stringify(results[path], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Help */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <h3 className="font-semibold text-emerald-600 mb-2">✓ Lovable Cloud Active</h3>
        <p className="text-sm text-emerald-700 dark:text-emerald-500">
          Your backend is running on Lovable Cloud with edge functions. No external server configuration needed!
        </p>
      </div>
    </div>
  );
};

export default DevTools;
