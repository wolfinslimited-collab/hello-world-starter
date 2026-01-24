/**
 * Developer Tools Page
 * Shows backend status and API testing utilities
 */

import BackendStatus from 'components/common/backend-status';
import { baseUrl } from 'utils/request';
import useStorage from 'context';
import { useState } from 'react';
import { get } from 'utils/request';
import { clsx } from 'clsx';
import { Play, Copy, Check } from 'lucide-react';

const ENDPOINTS = [
  { path: 'trade/pairs', method: 'GET', auth: false, description: 'Get trading pairs' },
  { path: 'tokens', method: 'GET', auth: false, description: 'Get airdrop tokens' },
  { path: 'user/profile', method: 'GET', auth: true, description: 'Get user profile' },
  { path: 'wallet', method: 'GET', auth: true, description: 'Get wallet balances' },
  { path: 'missions', method: 'GET', auth: true, description: 'Get missions' },
];

const DevTools = () => {
  const { setting: { token, isLoged } } = useStorage();
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const testEndpoint = async (path: string, auth: boolean) => {
    setLoading(prev => ({ ...prev, [path]: true }));
    try {
      const res = await get(path, auth ? { token } : {});
      setResults(prev => ({ ...prev, [path]: res }));
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
          Test backend connectivity and API endpoints
        </p>
      </div>

      {/* Backend Status */}
      <BackendStatus showDetails />

      {/* Configuration */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-4">
        <h2 className="font-semibold text-neutral-900 dark:text-white">Configuration</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs text-neutral-500 uppercase tracking-wider">API Base URL</label>
            <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-mono text-sm break-all">
              {baseUrl || 'Not set - Add VITE_DEX_API_URL to .env'}
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
                    /{path}
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
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <h3 className="font-semibold text-amber-600 mb-2">Setup Instructions</h3>
        <ol className="space-y-2 text-sm text-amber-700 dark:text-amber-500">
          <li>1. Add <code className="px-1 py-0.5 rounded bg-amber-500/10">VITE_DEX_API_URL=your-backend-url</code> to your environment</li>
          <li>2. Make sure your backend is running and accessible</li>
          <li>3. Connect your wallet to authenticate and test protected endpoints</li>
          <li>4. Add <code className="px-1 py-0.5 rounded bg-amber-500/10">"build:dev": "vite build --mode development"</code> to package.json scripts</li>
        </ol>
      </div>
    </div>
  );
};

export default DevTools;
