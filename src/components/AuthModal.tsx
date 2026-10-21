import React, { useState } from 'react';
import { X, User, Lock, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types/travel';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSwitchUser: (user: Partial<UserProfile>) => void;
}

const DEMO_PERSONAS = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@globetrotter.in',
    role: 'Solo Explorer & Culture Buff (New Delhi)',
    avatar: '/src/assets/images/avatar_indian_traveler_1792578895981.jpg',
    currency: 'INR',
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@globetrotter.in',
    role: 'Heritage & Family Route Planner (Mumbai)',
    avatar: '/src/assets/images/avatar_indian_traveler_1792578895981.jpg',
    currency: 'INR',
  },
  {
    name: 'Rohan Iyer',
    email: 'rohan.iyer@globetrotter.in',
    role: 'Himalayan Expedition Leader (Bengaluru)',
    avatar: '/src/assets/images/avatar_indian_traveler_1792578895981.jpg',
    currency: 'INR',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchUser,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'forgot') {
      setNotification(`Password reset instructions dispatched to ${email}`);
      return;
    }

    onSwitchUser({
      full_name: name || email.split('@')[0] || 'GlobeTrotter Explorer',
      email: email || 'traveler@globetrotter.io',
    });
    setNotification('Successfully authenticated!');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-white">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5">
        
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-lg font-serif font-bold text-white">
              {mode === 'login' ? 'Traveler Sign In' : mode === 'signup' ? 'Create GlobeTrotter Account' : 'Recover Account Password'}
            </h3>
            <span className="text-xs text-slate-400">Secure access to personal journeys</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notification && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Demo Persona Quick Switcher */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">
            Quick Persona Switch (Hackathon Demo):
          </span>
          <div className="space-y-1.5">
            {DEMO_PERSONAS.map((p) => (
              <button
                key={p.email}
                type="button"
                onClick={() => {
                  onSwitchUser({
                    full_name: p.name,
                    email: p.email,
                    home_currency: p.currency,
                  });
                  setNotification(`Switched active traveler to ${p.name}`);
                  setTimeout(() => onClose(), 800);
                }}
                className={`w-full p-2 rounded-lg flex items-center justify-between text-left text-xs transition-colors cursor-pointer ${
                  currentUser.email === p.email
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <div>
                  <span className="font-medium text-white block">{p.name}</span>
                  <span className="text-[10px] text-slate-400">{p.role}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">{p.currency}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Standard Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Explorer"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                required
              />
            </div>
          )}

          <div>
            <label className="text-slate-300 block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="elena.vance@globetrotter.io"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors cursor-pointer mt-2"
          >
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Recovery Link'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-emerald-400 font-semibold hover:underline cursor-pointer"
              >
                Sign up free
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-emerald-400 font-semibold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
