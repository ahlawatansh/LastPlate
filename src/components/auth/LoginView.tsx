import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { signInWithGoogleFirebase, signInWithGoogleRedirectFirebase, signInWithEmailFirebase } from '../../services/firebase';
import { FirebaseConfigModal } from './FirebaseConfigModal';

interface LoginViewProps {
  onSwitchToSignup: () => void;
  onGoogleSignUpRequired?: (googleUser: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSwitchToSignup, onGoogleSignUpRequired }) => {
  const { users, login, loginWithFirebaseUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const processGoogleUser = (googleUser: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  }) => {
    if (!googleUser.email) return;
    const existing = users.find((u) => u.email.toLowerCase() === googleUser.email.toLowerCase());
    if (existing) {
      // User already has an account -> direct login!
      loginWithFirebaseUser(googleUser);
    } else {
      // If user does not have an account, treat as sign up: show sign up card with prefilled details!
      if (onGoogleSignUpRequired) {
        onGoogleSignUpRequired(googleUser);
      } else {
        onSwitchToSignup();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please enter your registered email address');
      return;
    }
    if (!password) {
      setError('Please enter your account password');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Authenticate with Firebase Email & Password
      const fbResult = await signInWithEmailFirebase(email, password);
      if (fbResult.success && fbResult.user) {
        loginWithFirebaseUser({
          uid: fbResult.user.uid,
          email: fbResult.user.email,
          displayName: fbResult.user.displayName,
          photoURL: fbResult.user.photoURL,
        });
        return;
      }

      // 2. Fallback to existing registered user in session
      const success = login(email);
      if (!success) {
        setError(fbResult.error || 'No user account found with this email. Please check your credentials or create a new account.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogleFirebase();
      if (result.isConfigurationMissing) {
        setIsConfigModalOpen(true);
        return;
      }

      if (result.success && result.user) {
        processGoogleUser({
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || (result.user.email ? result.user.email.split('@')[0] : 'User'),
          photoURL: result.user.photoURL || undefined,
        });
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleRedirectLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogleRedirectFirebase();
    } catch (err: any) {
      setError(err?.message || 'Failed to redirect to Google.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4 sm:p-6 pb-[60px] sm:pb-[60px] overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full my-auto border border-zinc-200 overflow-hidden flex flex-col">
          
          {/* Top Bar with sleek styling */}
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-tight font-heading leading-none lowercase">
                <span className="text-slate-950 font-extrabold">last</span>
                <span className="text-[#1B4332] font-black">plate</span>
              </span>
              <span className="hidden sm:inline-block text-[11px] text-zinc-400 pl-2 border-l border-zinc-200">
                Food Delivery App
              </span>
            </div>
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-xs font-bold text-[#1B4332] hover:underline cursor-pointer"
            >
              Create Account ↗
            </button>
          </div>

          {/* Landscape Horizontal 2-Column Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1">
            
            {/* Left Column (5 cols): Brand & Feature Showcase with Black Background */}
            <div className="md:col-span-5 bg-[#121214] p-6 sm:p-8 flex flex-col justify-between border-r border-zinc-800 text-white">
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-black font-heading leading-snug text-white">
                  Intelligent Dining & Surplus Deals
                </h2>
                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  Sign in to access your customized dashboard, manage real-time culinary orders, or rescue high-discount meals before closing.
                </p>

                <div className="space-y-2.5 pt-4">
                  <div className="flex items-center gap-2.5 text-xs text-zinc-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Real-time dynamic surplus meal auctions</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>3-year seasonal ML kitchen forecasting</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Live GPS dispatch & electric EV routing</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Welcome to LastPlate</span>
              </div>
            </div>

            {/* Right Column (7 cols): Real-Time Login Form */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-white space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Sign In to Account
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your verified credentials to enter your workspace
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed space-y-2">
                  <div>{error}</div>
                  {(error.toLowerCase().includes('popup') || error.toLowerCase().includes('google')) && (
                    <button
                      type="button"
                      onClick={handleGoogleRedirectLogin}
                      className="font-bold text-[#1B4332] underline hover:text-black cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Or sign in directly using Google Page Redirect</span>
                      <span>↗</span>
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative rounded-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative rounded-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="block w-full pl-10 pr-10 py-2.5 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#1B4332] focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer active:scale-[0.99] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Separator - short and thin */}
              <div className="relative my-2 max-w-[180px] mx-auto w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/60" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="bg-white px-2.5 text-slate-400 font-normal">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign In Button Below Email */}
              {isGoogleLoading ? (
                <div className="w-full flex items-center justify-between py-2.5 px-4 border border-slate-200 rounded-full bg-slate-50 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-700 font-medium truncate">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1B4332] shrink-0" />
                    <span className="truncate">Connecting to Firebase Google...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGoogleLoading(false);
                      setError('Sign-in cancelled. If the popup was blocked by your browser, you can allow popups in the URL bar or use Google Redirect below.');
                    }}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer shrink-0 ml-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  type="button"
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-200 rounded-full bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              )}

              <div className="pt-2 text-center text-xs flex items-center justify-center gap-1.5">
                <span className="text-slate-500">Don't have an account?</span>
                <button
                  type="button"
                  onClick={onSwitchToSignup}
                  className="font-bold text-[#1B4332] hover:underline cursor-pointer"
                >
                  Create New Account
                </button>
              </div>

            </div>
          </div>
        </div>
        
        {/* Firebase Config Setup Modal */}
        <FirebaseConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onConfigSaved={() => {
            setIsConfigModalOpen(false);
            handleGoogleLogin();
          }}
        />
      </div>
  );
};
