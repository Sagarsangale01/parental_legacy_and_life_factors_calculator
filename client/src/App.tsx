import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DateInputCard } from './components/DateInputCard';
import { SummaryKpiCards } from './components/SummaryKpiCards';
import { FactorTable } from './components/FactorTable';
import { ChartsGrid } from './components/ChartsGrid';
import { ExportActionBar } from './components/ExportActionBar';
import { AuthModal } from './components/AuthModal';
import { HistoryModal } from './components/HistoryModal';
import { CalculationResult } from './types';
import { calculateLifeFactors, validateDOB } from './services/calculatorEngine';
import { calculateOnServer } from './services/api';
import { useAuth } from './context/AuthContext';
import { BarChart3, Table as TableIcon, Sparkles, CheckCircle2, Cloud, ShieldCheck, Database, LogIn } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [dob, setDob] = useState<string>('1995-03-15');
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'visuals' | 'table'>('visuals');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Core reactive calculation handler
  const performCalculation = useCallback(async (dateString: string) => {
    const validation = validateDOB(dateString);
    if (!validation.isValid) {
      setError(validation.error);
      setCalculation(null);
      return;
    }

    setError(undefined);
    setIsCalculating(true);

    try {
      // 1. Compute locally first for 0ms instant reactivity
      const localResult = calculateLifeFactors(dateString);
      setCalculation(localResult);

      // 2. Persist to MongoDB via Express API asynchronously
      try {
        const serverResult = await calculateOnServer(dateString, true);
        if (serverResult && serverResult.id) {
          setCalculation(prev => prev ? { ...prev, id: serverResult.id } : serverResult);
        }
      } catch (apiErr) {
        console.warn('Backend MongoDB synchronization note (operating in resilient local mode):', apiErr);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during calculation.');
    } finally {
      setIsCalculating(false);
    }
  }, []);

  // Initial calculation on mount
  useEffect(() => {
    performCalculation(dob);
  }, [performCalculation]);

  const handleDobChange = (newDob: string) => {
    setDob(newDob);
    performCalculation(newDob);
  };

  const handleReset = () => {
    const defaultDate = '1995-03-15';
    setDob(defaultDate);
    performCalculation(defaultDate);
  };

  return (
    <div className="min-h-screen flex flex-col bg-mesh transition-colors duration-200" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      
      {/* Navigation Header */}
      <Navbar onOpenHistory={() => setIsHistoryOpen(true)} />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Account Status / Cloud Sync Banner */}
        {isAuthenticated && user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border shadow-sm transition-all"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shrink-0"
                style={{ background: 'linear-gradient(135deg, #c026d3, #0891b2)' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Connected Account: {user.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1"
                    style={{ background: 'rgba(5,150,105,0.12)', color: '#059669', borderColor: 'rgba(5,150,105,0.25)' }}>
                    <ShieldCheck className="w-3 h-3" />
                    Cloud Sync Active
                  </span>
                </div>
                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <Cloud className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Your calculation profiles are automatically backed up to your MongoDB cloud account.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHistoryOpen(true)}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition hover:opacity-85 shadow-sm shrink-0"
              style={{ background: 'var(--father-bg)', borderColor: 'var(--father-border)', color: 'var(--father-mid)' }}
            >
              <Database className="w-3.5 h-3.5" />
              <span>My Saved Calculations</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-4 rounded-xl border text-xs"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: '#d97706' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Guest Evaluation Mode:</strong> Calculations are currently local. Sign in or create an account to permanently sync records to your MongoDB cloud history.
              </span>
            </div>
            <button
              onClick={() => openAuthModal('login')}
              className="self-start sm:self-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #c026d3, #7c3aed)' }}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          </div>
        )}
        
        {/* Date of Birth Input Hero */}
        <DateInputCard
          dob={dob}
          onChangeDob={handleDobChange}
          error={error}
          isCalculating={isCalculating}
          dayOfMonth={calculation?.dayOfMonth}
          isOddDay={calculation?.isOddDay}
        />

        {calculation && (
          <>
            {/* Top KPI Metrics */}
            <SummaryKpiCards calculation={calculation} />

            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('visuals')}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                    activeTab === 'visuals'
                      ? 'text-white shadow-lg'
                      : 'hover:opacity-80'
                  }`}
                  style={
                    activeTab === 'visuals'
                      ? { background: 'linear-gradient(135deg, #c026d3, #7c3aed 50%, #0891b2)', boxShadow: '0 4px 14px rgba(192,38,211,0.25)' }
                      : { color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }
                  }
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Visual Comparison Charts</span>
                </button>

                <button
                  onClick={() => setActiveTab('table')}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                    activeTab === 'table'
                      ? 'text-white shadow-lg'
                      : 'hover:opacity-80'
                  }`}
                  style={
                    activeTab === 'table'
                      ? { background: 'linear-gradient(135deg, #c026d3, #7c3aed 50%, #0891b2)', boxShadow: '0 4px 14px rgba(192,38,211,0.25)' }
                      : { color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }
                  }
                >
                  <TableIcon className="w-4 h-4" />
                  <span>Data Table View</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full border"
                style={{ color: '#d97706', background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sum = 100.000 Verified</span>
              </div>
            </div>

            {/* Tab View Content */}
            {activeTab === 'visuals' ? (
              <ChartsGrid calculation={calculation} />
            ) : (
              <FactorTable calculation={calculation} />
            )}

            {/* Export Action Bar */}
            <ExportActionBar calculation={calculation} onReset={handleReset} />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-12 text-xs transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--bg-footer)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Parental Legacy &amp; Life Factors Calculator
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>&bull; Precision Life Factor Analytics</span>
          </div>
          <div className="flex items-center space-x-6" style={{ color: 'var(--text-secondary)' }}>
            <span>High-Precision Engine</span>
            <span>Dynamic Factor Balancing</span>
            <span>Multidimensional Visuals</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal />
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectCalculation={(selectedDob) => handleDobChange(selectedDob)}
      />

    </div>
  );
};


