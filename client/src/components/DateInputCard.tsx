import React from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface DateInputCardProps {
  dob: string;
  onChangeDob: (newDob: string) => void;
  error?: string;
  isCalculating: boolean;
  dayOfMonth?: number;
  isOddDay?: boolean;
}

export const DateInputCard: React.FC<DateInputCardProps> = ({
  dob, onChangeDob, error, isCalculating, dayOfMonth, isOddDay
}) => {
  const today = new Date().toISOString().split('T')[0];

  const presets = [
    { label: 'Sample Profile A', date: '1995-03-15' },
    { label: 'Sample Profile B', date: '1992-06-24' },
    { label: 'Millennium Profile', date: '2000-02-29' }
  ];

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-xl border"
      style={{ borderColor: 'var(--border)' }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

        {/* Left: Input & Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: 'var(--mother-mid)' }}>
            <Calendar className="w-4 h-4" />
            <span>Select Date of Birth</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Calculate Your Parental Lineage Factors
          </h2>

          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Pick a date of birth. Factor weights and parental equilibrium are dynamically generated in real time.
          </p>

          {/* Form Input */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                id="dob-picker-input"
                type="date"
                value={dob}
                max={today}
                min="1900-01-01"
                onChange={(e) => onChangeDob(e.target.value)}
                className="themed-input w-56 sm:w-64 px-4 py-2.5 rounded-xl text-sm font-medium outline-none shadow-inner transition-all duration-200"
                style={{
                  border: '1px solid var(--border-input)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-input)')}
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs hidden lg:inline mr-1" style={{ color: 'var(--text-secondary)' }}>Presets:</span>
              {presets.map((preset) => (
                <button
                  key={preset.date}
                  type="button"
                  onClick={() => onChangeDob(preset.date)}
                  className="px-2.5 py-1 text-xs rounded-lg border transition-all duration-200"
                  style={
                    dob === preset.date
                      ? { borderColor: 'var(--mother-primary)', background: 'var(--mother-bg)', color: 'var(--mother-mid)', fontWeight: 700 }
                      : { borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }
                  }
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 flex items-center space-x-2 text-xs px-3 py-2 rounded-lg border"
              style={{ color: '#e879f9', background: 'var(--error-bg)', borderColor: 'var(--error-border)' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right: Hereditary Profile Callout */}
        <div className="md:w-72 p-4 rounded-xl border flex flex-col justify-center"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
          <div className="flex items-center justify-between text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            <span>HEREDITARY PROFILE</span>
            {isCalculating ? (
              <span className="flex items-center text-[10px]" style={{ color: '#d97706' }}>
                <Clock className="w-3 h-3 animate-spin mr-1" />Computing
              </span>
            ) : (
              <span className="flex items-center text-[10px]" style={{ color: '#059669' }}>
                <CheckCircle2 className="w-3 h-3 mr-1" />Calibrated
              </span>
            )}
          </div>

          {dayOfMonth !== undefined ? (
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  Day {dayOfMonth}
                </span>
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border"
                  style={
                    isOddDay
                      ? { background: 'var(--mother-bg)', color: 'var(--mother-mid)', borderColor: 'var(--mother-border)' }
                      : { background: 'var(--father-bg)', color: 'var(--father-mid)', borderColor: 'var(--father-border)' }
                  }>
                  {isOddDay ? 'Maternal Primary' : 'Paternal Primary'}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Proportional hereditary balance calibrated across core dimensions based on biological birth markers.
              </p>
            </div>
          ) : (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Select a date above to evaluate hereditary profile and calculate proportional life factors.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

