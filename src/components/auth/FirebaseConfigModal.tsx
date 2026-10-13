import React, { useState } from 'react';
import { X, Key, ShieldAlert, CheckCircle, ExternalLink } from 'lucide-react';
import {
  saveFirebaseConfig,
  getEffectiveFirebaseConfig,
  FirebaseConfig,
} from '../../services/firebase';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const currentConfig = getEffectiveFirebaseConfig();
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig.storageBucket || '');
  const [rawJson, setRawJson] = useState('');
  const [activeTab, setActiveTab] = useState<'FIELDS' | 'JSON'>('FIELDS');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseJson = () => {
    try {
      // Allow pasting object literal or JSON: apiKey: "...", or "apiKey": "..."
      let cleaned = rawJson.trim();
      if (cleaned.startsWith('const firebaseConfig =')) {
        cleaned = cleaned.replace('const firebaseConfig =', '').replace(/;$/, '').trim();
      }
      // If JS object notation without quotes on keys
      cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      const parsed = JSON.parse(cleaned);

      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.appId) setAppId(parsed.appId);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      setActiveTab('FIELDS');
      setError(null);
    } catch {
      setError('Could not parse config JSON. Please verify the format or paste into individual fields.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !authDomain || !projectId) {
      setError('API Key, Auth Domain, and Project ID are required.');
      return;
    }

    const config: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      appId: appId.trim(),
      storageBucket: storageBucket.trim(),
    };

    saveFirebaseConfig(config);
    onConfigSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-[#F2F9F4]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Connect Firebase Google Auth
              </h3>
              <p className="text-[11px] text-[#2D6A4F] font-medium">
                Live Google Sign-In with real account credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-100 text-xs px-6 pt-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('FIELDS')}
            className={`pb-2.5 font-bold cursor-pointer transition-colors ${
              activeTab === 'FIELDS'
                ? 'border-b-2 border-[#1B4332] text-[#1B4332]'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Config Fields
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('JSON')}
            className={`pb-2.5 font-bold cursor-pointer transition-colors ${
              activeTab === 'JSON'
                ? 'border-b-2 border-[#1B4332] text-[#1B4332]'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Paste Firebase SDK Config
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-900 text-xs flex gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-semibold">Setup instructions:</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                In Firebase Console, ensure <b>Google</b> is enabled under <b>Authentication &gt; Sign-in method</b>, and add <code>localhost</code> to <b>Authorized Domains</b>.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          {activeTab === 'JSON' ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Paste <code>firebaseConfig</code> object from Firebase Console:
              </label>
              <textarea
                rows={6}
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                placeholder={'{\n  apiKey: "AIzaSy...",\n  authDomain: "my-app.firebaseapp.com",\n  projectId: "my-app",\n  appId: "1:..."\n}'}
                className="w-full font-mono text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B4332] outline-none text-slate-800"
              />
              <button
                type="button"
                onClick={handleParseJson}
                className="w-full py-2 rounded-full bg-zinc-800 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Parse & Fill Fields
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Key *
                </label>
                <input
                  type="text"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="block w-full px-3.5 py-2 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Auth Domain *
                  </label>
                  <input
                    type="text"
                    required
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="project-id.firebaseapp.com"
                    className="block w-full px-3.5 py-2 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="my-project-id"
                    className="block w-full px-3.5 py-2 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  App ID (optional)
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:123456789:web:abcdef"
                  className="block w-full px-3.5 py-2 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#1B4332] hover:underline flex items-center gap-1 font-medium"
                >
                  Open Firebase Console <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-full bg-[#1B4332] hover:bg-[#143B2A] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" /> Save & Launch Google Sign-In
                </button>
              </div>
            </form>
          )}

          <p className="text-[10px] text-zinc-400 text-center pt-1">
            Or add <code>VITE_FIREBASE_API_KEY</code>, <code>VITE_FIREBASE_AUTH_DOMAIN</code>, <code>VITE_FIREBASE_PROJECT_ID</code> to your <code>.env</code> file.
          </p>
        </div>

      </div>
    </div>
  );
};
