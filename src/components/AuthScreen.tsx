import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider, 
  User 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import { WestBengalEmblem } from './WestBengalEmblem';
import { Language } from '../data/translations';
import { 
  ShieldCheck, 
  RotateCw, 
  AlertCircle, 
  Droplets,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface AuthScreenProps {
  lang: Language;
  onAuthenticated: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ lang, onAuthenticated }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);

    if (!isFirebaseConfigured) {
      setError(
        lang === 'bn'
          ? 'Firebase Authentication কনফিগার করা নেই। অনুগ্রহ করে Firebase কনফিগ নিশ্চিত করুন।'
          : 'Firebase Authentication is not configured. Please ensure Firebase configuration is set.'
      );
      return;
    }

    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      // Request standard profile and email scopes
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // Execute official Firebase Google Sign-In via popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user.displayName) {
        localStorage.setItem('jol_user_name', user.displayName);
      }
      onAuthenticated(user);
    } catch (err: unknown) {
      console.error('Firebase Google Sign-In error:', err);
      const fbError = err as { code?: string; message?: string };

      if (fbError.code === 'auth/popup-closed-by-user') {
        setError(
          lang === 'bn'
            ? 'গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Google Sign-In window was closed. Please try again.'
        );
      } else if (fbError.code === 'auth/cancelled-popup-request') {
        setError(
          lang === 'bn'
            ? 'আগের অনুরোধ বাতিল হয়েছে। অনুগ্রহ করে আবার ক্লিক করুন।'
            : 'Previous sign-in request was cancelled. Please click again.'
        );
      } else if (fbError.code === 'auth/popup-blocked') {
        // If popup is blocked by the browser/iframe, attempt redirect flow
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          console.error('Firebase Google redirect error:', redirectErr);
          setError(
            lang === 'bn'
              ? 'ব্রাউজারে পপ-আপ ব্লক করা রয়েছে। অনুগ্রহ করে পপ-আপ অনুমোদন করুন।'
              : 'Pop-up was blocked by browser. Please allow pop-ups for this site and try again.'
          );
        }
      } else if (fbError.code === 'auth/unauthorized-domain') {
        setError(
          lang === 'bn'
            ? 'Firebase Console-এ বর্তমান ডোমেনটি Authorized Domains তালিকায় যুক্ত করা নেই।'
            : 'This domain is not in the Firebase Authorized Domains list. Please add it in Firebase Console -> Authentication -> Settings -> Authorized domains.'
        );
      } else if (fbError.code === 'auth/network-request-failed') {
        setError(
          lang === 'bn'
            ? 'ইন্টারনেট সংযোগ সমস্যা। অনুগ্রহ করে আপনার নেটওয়ার্ক চেক করুন।'
            : 'Network connection failed. Please check your internet connection and try again.'
        );
      } else {
        setError(
          fbError.message || 
          (lang === 'bn' ? 'গুগল সাইন-ইন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Google Sign-In failed. Please try again.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-40 flex flex-col justify-center items-center px-4 bg-[#040914] text-slate-100 select-none overflow-y-auto py-10"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 25%, #08152e 0%, #030712 100%)'
      }}
    >
      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-[#0a162d]/95 border border-blue-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
        {/* Government of West Bengal Official Emblem Branding */}
        <div className="flex flex-col items-center text-center pb-5 mb-5 border-b border-blue-900/35">
          <WestBengalEmblem size="md" lang={lang} />
          <div className="mt-2.5">
            <span className="text-xs font-bold tracking-wider text-slate-200 uppercase">
              {lang === 'bn' ? 'পশ্চিমবঙ্গ সরকার' : 'Government of West Bengal'}
            </span>
            <p className="text-[11px] text-slate-400">
              {lang === 'bn' 
                ? 'দুর্যোগ ব্যবস্থাপনা বিভাগ • নাগরিক সুরক্ষা পোর্টাল' 
                : 'Department of Disaster Management • Citizen Safety Portal'}
            </p>
          </div>
        </div>

        {/* JolSafety Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-sky-700 shadow-md shadow-blue-950/60 mb-2.5 border border-blue-400/20">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Kolkata <span className="text-sky-400">JolSafety</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {lang === 'bn'
              ? 'জরুরি জলমগ্নতা ও দুর্যোগ সহায়তা পোর্টালে গুগল অ্যাকাউন্ট দিয়ে প্রবেশ করুন'
              : 'Sign in to access real-time monsoon flood alerts, river lock-gate telemetry, and civic safe routes'}
          </p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-700/40 flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Official Google Sign-In Action */}
        <div className="space-y-4">
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm shadow-lg shadow-slate-950/50 flex items-center justify-center gap-3 transition-all cursor-pointer border border-slate-200"
          >
            {loading ? (
              <>
                <RotateCw className="w-5 h-5 animate-spin text-slate-700" />
                <span className="text-slate-800">
                  {lang === 'bn' ? 'গুগল সংযোগ করা হচ্ছে...' : 'Connecting to Google...'}
                </span>
              </>
            ) : (
              <>
                {/* Official Google Vector Logo */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span className="text-slate-800">
                  {lang === 'bn' ? 'গুগল দিয়ে প্রবেশ করুন' : 'Continue with Google'}
                </span>
              </>
            )}
          </button>

          {/* Quick Informational Highlights */}
          <div className="pt-2 grid grid-cols-2 gap-2 text-left">
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-[11px] text-slate-300 leading-tight">
                {lang === 'bn' ? 'কোনো ওটিপি ছাড়াই এক ক্লিকে সাইন-ইন' : 'One-click sign-in without waiting for OTP'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span className="text-[11px] text-slate-300 leading-tight">
                {lang === 'bn' ? 'স্থায়ী নিরাপদ এনক্রিপ্টেড সেশন' : 'Persistent, encrypted citizen session'}
              </span>
            </div>
          </div>
        </div>

        {/* Security & Accreditation Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {lang === 'bn'
              ? 'সুরক্ষিত Firebase Authentication • পশ্চিমবঙ্গ সরকার দুর্যোগ ব্যবস্থাপনা'
              : 'Secure Firebase Authentication • Govt. of West Bengal Disaster Management'}
          </span>
        </div>
      </div>
    </div>
  );
};
