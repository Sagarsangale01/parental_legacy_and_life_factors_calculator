import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, login, register, isLoading } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(authModalTab);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setErrorMessage(null);
  }, []);

  // When modal opens/closes or initial tab changes, sync tab and clear form
  useEffect(() => {
    if (isAuthModalOpen) {
      setTab(authModalTab);
      resetForm();
    } else {
      resetForm();
    }
  }, [isAuthModalOpen, authModalTab, resetForm]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    resetForm();
    closeAuthModal();
  };

  const handleTabChange = (newTab: 'login' | 'register') => {
    setTab(newTab);
    resetForm();
  };

  // Password complexity checks for registration
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&#^()_+={}\[\]:;"'<>,.?\/\\~`|-]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        if (!isPasswordValid) {
          setErrorMessage('Please ensure your password meets all complexity requirements below.');
          return;
        }
        await register(name, email, password);
      }
      // Clear form upon successful authentication
      resetForm();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Authentication failed. Please try again.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl glass-card border p-6 sm:p-8 shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg transition hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl p-0.5 mx-auto mb-3 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #c026d3, #7c3aed, #0891b2)' }}>
            <div className="w-full h-full rounded-[14px] flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-app)' }}>
              <ShieldCheck className="w-6 h-6 text-fuchsia-400" />
            </div>
          </div>
          <h3 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {tab === 'login' ? 'Sign In to Your Account' : 'Create Account'}
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {tab === 'login'
              ? 'Access and manage your saved parental legacy calculations'
              : 'Save and access your parental lineage reports securely anytime'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl p-1 border mb-6"
          style={{ background: 'var(--bg-app)', borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              tab === 'login'
                ? 'text-white shadow-md'
                : 'hover:opacity-80'
            }`}
            style={
              tab === 'login'
                ? { background: 'linear-gradient(135deg, #c026d3, #7c3aed)' }
                : { color: 'var(--text-secondary)' }
            }
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              tab === 'register'
                ? 'text-white shadow-md'
                : 'hover:opacity-80'
            }`}
            style={
              tab === 'register'
                ? { background: 'linear-gradient(135deg, #c026d3, #7c3aed)' }
                : { color: 'var(--text-secondary)' }
            }
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 flex items-center space-x-2 text-xs p-3 rounded-xl border"
            style={{ color: '#e879f9', background: 'var(--error-bg)', borderColor: 'var(--error-border)' }}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-3" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition"
                  style={{
                    border: '1px solid var(--border-input)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-input)')}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition"
                style={{
                  border: '1px solid var(--border-input)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-input)')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3" style={{ color: 'var(--text-secondary)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-medium outline-none transition"
                style={{
                  border: '1px solid var(--border-input)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-input)')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password checklist (shown on registration) */}
          {tab === 'register' && (
            <div className="p-3 rounded-xl border text-[11px] space-y-1"
              style={{ background: 'var(--bg-app)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Password Security Requirements:</div>
              <div className={`flex items-center space-x-1.5 ${hasMinLength ? 'text-emerald-500 font-semibold' : ''}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${hasUppercase && hasLowercase ? 'text-emerald-500 font-semibold' : ''}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Upper and lower case letters</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${hasNumber && hasSpecial ? 'text-emerald-500 font-semibold' : ''}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>At least one number and special symbol (!@#$)</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (tab === 'register' && !isPasswordValid)}
            className="w-full mt-2 py-3 rounded-xl text-white font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2"
            style={{
              background: 'linear-gradient(135deg, #c026d3, #7c3aed 50%, #0891b2)',
              boxShadow: '0 4px 14px rgba(192,38,211,0.25)'
            }}
          >
            {isLoading ? (
              <span className="inline-block animate-pulse">Authenticating...</span>
            ) : (
              <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

