import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Database, User as UserIcon, LogOut, Sparkles, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenHistory }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors"
      style={{ background: 'var(--bg-header)', borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl p-0.5 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #c026d3, #7c3aed, #0891b2)' }}>
            <div className="w-full h-full rounded-[10px] flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-app)' }}>
              <Sparkles className="w-5 h-5 text-fuchsia-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Parental Legacy
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border"
                style={{ background: 'var(--father-bg)', color: 'var(--father-mid)', borderColor: 'var(--father-border)' }}>
                Analytics Edition
              </span>
            </div>
            <p className="text-xs hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
              Life Factors &amp; Hereditary Balance Engine
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
            title="View Saved Calculation History"
          >
            <Database className="w-4 h-4" style={{ color: 'var(--father-mid)' }} />
            <span className="hidden md:inline">Saved History</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border transition-all duration-200 hover:opacity-80"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Auth Section */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2.5 pl-2.5 border-l" style={{ borderColor: 'var(--border)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow-md shrink-0"
                style={{ background: 'linear-gradient(135deg, #c026d3, #0891b2)' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <div className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase border"
                    style={{ background: 'rgba(5,150,105,0.12)', color: '#059669', borderColor: 'rgba(5,150,105,0.25)' }}>
                    Synced
                  </span>
                </div>
                <div className="text-[10px] truncate max-w-[140px]" style={{ color: 'var(--text-secondary)' }}>{user.email}</div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-80 border"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                title={`Sign Out (${user.name})`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition-all duration-200 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #c026d3, #7c3aed 50%, #0891b2)', boxShadow: '0 4px 14px rgba(192,38,211,0.25)' }}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In / Join</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

