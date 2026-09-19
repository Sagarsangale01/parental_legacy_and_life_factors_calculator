import React, { useState, useMemo } from 'react';
import { CalculationResult, QssTable, QssTableRow, QssCalibrationConfig } from '../types';
import {
  calculateQSS,
  DEFAULT_QSS_CONFIG,
  MIN_BOUNDS_QSS_CONFIG,
  MAX_BOUNDS_QSS_CONFIG
} from '../services/calculatorEngine';
import {
  Zap, Sparkles, Layers, Wind, Brain, Star, Info,
  ChevronDown, ChevronRight, Target, TrendingUp, Activity,
  SlidersHorizontal, RotateCcw, Check, HelpCircle, ShieldCheck
} from 'lucide-react';

interface QssDashboardProps {
  calculation: CalculationResult;
}

// ─── Colour palette per tier ──────────────────────────────────────────────────
const TIER_COLORS: Record<number, { bg: string; border: string; text: string; accent: string }> = {
  2: { bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.25)',  text: '#818cf8', accent: '#6366f1' },
  3: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#fbbf24', accent: '#f59e0b' },
  4: { bg: 'rgba(160,185,129,0.08)', border: 'rgba(16,185,129,0.25)', text: '#34d399', accent: '#10b981' },
  5: { bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.25)', text: '#f472b6', accent: '#ec4899' },
  6: { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)', text: '#c084fc', accent: '#a855f7' },
};

const TIER_ICONS: Record<number, React.ReactNode> = {
  2: <Zap className="w-4 h-4" />,
  3: <Layers className="w-4 h-4" />,
  4: <Activity className="w-4 h-4" />,
  5: <Brain className="w-4 h-4" />,
  6: <Star className="w-4 h-4" />,
};

// ─── Reusable single QSS table ────────────────────────────────────────────────
const QssTableCard: React.FC<{ table: QssTable; defaultOpen?: boolean }> = ({ table, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const c = TIER_COLORS[table.tier] ?? TIER_COLORS[2];

  const progressPct = (row: QssTableRow) =>
    Math.min(100, (row.currentStatus / (row.targetLevel || 1)) * 100);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-300 shadow-sm"
      style={{ background: 'var(--bg-surface)', borderColor: c.border }}
    >
      {/* Header — click to expand/collapse */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left transition hover:opacity-90"
        style={{ background: c.bg }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-md border tracking-wider"
            style={{ color: c.text, borderColor: c.border, background: 'transparent' }}
          >
            TABLE {table.tableNumber}
          </span>
          <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {table.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Totals inline */}
          <span className="hidden sm:flex items-center gap-4 text-xs font-mono">
            <span style={{ color: c.text }}>CS: {table.totalCurrentStatus.toFixed(3)}</span>
            <span style={{ color: 'var(--text-secondary)' }}>→</span>
            <span style={{ color: '#34d399' }}>TL: {table.totalTargetLevel.toFixed(3)}</span>
            <span style={{ color: '#f472b6' }}>(Gap: {table.totalGapToGoal.toFixed(3)})</span>
          </span>
          {open ? (
            <ChevronDown className="w-4 h-4 shrink-0" style={{ color: c.text }} />
          ) : (
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: c.text }} />
          )}
        </div>
      </button>

      {/* Authoritative Excel Guideline Badge */}
      {table.guideline && (
        <div
          className="px-5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b"
          style={{ background: 'rgba(0,0,0,0.12)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400 text-[11px] flex items-center gap-1">
              <span>📋</span> Excel Guideline:
            </span>
            <span className="text-[11px] leading-tight" style={{ color: 'var(--text-secondary)' }}>
              {table.guideline.guidanceText}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
            <span className="px-2 py-0.5 rounded font-bold border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
              Current: {table.guideline.appliedCurrentPct}% ({table.guideline.currentMinPct}%–{table.guideline.currentMaxPct}%)
            </span>
            <span className="px-2 py-0.5 rounded font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Target: {table.guideline.appliedTargetPct}% ({table.guideline.targetMinPct}%–{table.guideline.targetMaxPct}%)
            </span>
          </div>
        </div>
      )}

      {/* Table body */}
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className="uppercase tracking-wider font-bold border-b"
              style={{ background: 'var(--bg-header)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              <tr>
                <th className="px-5 py-2.5">Dimension</th>
                <th className="px-4 py-2.5 text-right" style={{ color: c.text }}>Current Status</th>
                <th className="px-4 py-2.5 text-right" style={{ color: '#34d399' }}>Target Level</th>
                <th className="px-4 py-2.5 text-right" style={{ color: '#f472b6' }}>Gap to Goal</th>
                <th className="px-5 py-2.5 text-center">Progress</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, idx) => {
                const pct = progressPct(row);
                return (
                  <tr
                    key={row.id}
                    className="border-b transition-colors"
                    style={{
                      borderColor: 'var(--border)',
                      background: idx % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)')}
                  >
                    <td className="px-5 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums" style={{ color: c.text }}>
                      {row.currentStatus.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums" style={{ color: '#34d399' }}>
                      {row.targetLevel.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums" style={{ color: '#f472b6' }}>
                      {row.gapToGoal.toFixed(3)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bar-track)' }}>
                          <div
                            className="h-full rounded-full bar-fill"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 80 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f472b6'
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-mono w-8 text-right" style={{ color: 'var(--text-muted)' }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Table Total row */}
              <tr
                className="font-extrabold border-t-2"
                style={{ background: 'var(--bg-tfoot)', borderColor: 'var(--border-strong)' }}
              >
                <td className="px-5 py-3 uppercase tracking-wider text-[11px]" style={{ color: 'var(--text-primary)' }}>
                  TOTAL ({table.rows.length} Factors)
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-sm" style={{ color: c.text }}>
                  {table.totalCurrentStatus.toFixed(3)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-sm" style={{ color: '#34d399' }}>
                  {table.totalTargetLevel.toFixed(3)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-sm" style={{ color: '#f472b6' }}>
                  {table.totalGapToGoal.toFixed(3)}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
                    style={{ color: c.text, borderColor: c.border, background: c.bg }}>
                    Σ Summary
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Tier Section Wrapper ─────────────────────────────────────────────────────
const TierSection: React.FC<{
  tier: number;
  label: string;
  description: string;
  tables: QssTable[];
  defaultFirstOpen?: boolean;
}> = ({ tier, label, description, tables, defaultFirstOpen }) => {
  const [sectionOpen, setSectionOpen] = useState(true);
  const c = TIER_COLORS[tier] ?? TIER_COLORS[2];

  return (
    <div className="space-y-3">
      {/* Tier Header */}
      <button
        onClick={() => setSectionOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3 rounded-xl border text-left transition hover:opacity-90"
        style={{ background: c.bg, borderColor: c.border }}
      >
        <span style={{ color: c.text }}>{TIER_ICONS[tier]}</span>
        <div className="flex-1">
          <span className="font-extrabold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {label}
          </span>
          <span className="text-xs ml-3" style={{ color: 'var(--text-secondary)' }}>{description}</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded border" style={{ color: c.text, borderColor: c.border }}>
          {tables.length} TABLE{tables.length !== 1 ? 'S' : ''}
        </span>
        {sectionOpen ? <ChevronDown className="w-4 h-4" style={{ color: c.text }} /> : <ChevronRight className="w-4 h-4" style={{ color: c.text }} />}
      </button>

      {sectionOpen && (
        <div className="space-y-2 pl-2">
          {tables.map((t, idx) => (
            <QssTableCard key={t.tableNumber} table={t} defaultOpen={defaultFirstOpen && idx === 0} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Cosmic Code Card ─────────────────────────────────────────────────────────
const CosmicCodeCard: React.FC<{ code: { codeNumber: number; title: string; subtitle: string; currentStatus: number; targetLevel: number; gapToGoal: number; contributingFactors: string[]; color: string; icon: string } }> = ({ code }) => {
  const pct = Math.min(100, (code.currentStatus / (code.targetLevel || 1)) * 100);
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3 transition hover:scale-[1.01] duration-200"
      style={{
        background: `rgba(${hexToRgb(code.color)},0.07)`,
        borderColor: `rgba(${hexToRgb(code.color)},0.25)`
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{code.icon}</span>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: code.color }}>
              Code {code.codeNumber}
            </div>
            <div className="font-bold text-xs leading-tight mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {code.title}
            </div>
          </div>
        </div>
      </div>
      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{code.subtitle}</p>
      <div className="space-y-1">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bar-track)' }}>
          <div className="h-full rounded-full bar-fill" style={{ width: `${pct}%`, background: code.color }} />
        </div>
        <div className="flex justify-between text-[10px] font-mono font-semibold">
          <span style={{ color: code.color }}>{code.currentStatus.toFixed(3)}</span>
          <span style={{ color: '#34d399' }}>→ {code.targetLevel.toFixed(3)}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {code.contributingFactors.map(f => (
          <span key={f} className="text-[9px] px-1.5 py-0.5 rounded border font-semibold"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-badge)' }}>
            {f}
          </span>
        ))}
      </div>
    </div>
  );
};

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ─── Main QSS Dashboard ───────────────────────────────────────────────────────
export const QssDashboard: React.FC<QssDashboardProps> = ({ calculation }) => {
  const [config, setConfig] = useState<QssCalibrationConfig>(() => calculation.qss?.config ?? DEFAULT_QSS_CONFIG);
  const [isCustomDrawerOpen, setIsCustomDrawerOpen] = useState<boolean>(false);

  // Instant reactive recalculation across all 54 tables whenever sliders or presets change
  const activeQss = useMemo(() => {
    return calculateQSS(calculation.factors, config);
  }, [calculation.factors, config]);

  const { tables, spiritualObservances, vedicMappings, cosmicCodes } = activeQss;

  // Group tables by tier
  const tier2Tables = tables.filter(t => t.tier === 2);
  const tier3Tables = tables.filter(t => t.tier === 3);
  const tier4Tables = tables.filter(t => t.tier === 4);
  const tier5Tables = tables.filter(t => t.tier === 5);
  const tier6Tables = tables.filter(t => t.tier === 6 && t.tableNumber !== 54);

  const applyPreset = (presetName: 'midpoint' | 'min' | 'max') => {
    if (presetName === 'midpoint') setConfig(DEFAULT_QSS_CONFIG);
    else if (presetName === 'min') setConfig(MIN_BOUNDS_QSS_CONFIG);
    else if (presetName === 'max') setConfig(MAX_BOUNDS_QSS_CONFIG);
  };

  const updateConfigVal = (key: keyof QssCalibrationConfig, value: number) => {
    setConfig(prev => ({
      ...prev,
      mode: 'custom',
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">

      {/* ── Dashboard Header ─────────────────────────────────────────────────── */}
      <div
        className="glass-card rounded-2xl p-6 border shadow-lg"
        style={{ borderColor: 'rgba(168,85,247,0.3)', background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(99,102,241,0.06) 100%)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-[11px] font-black uppercase tracking-widest text-purple-400">
                QSS TRUE SCAN-R
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                54 TABLES · 6 TIERS
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Quantum System Scanning & Multi-Tier Matrix
            </h2>
            <p className="text-xs mt-1 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
              Complete 54-table system from <code className="text-amber-400 font-mono">QSS TRUE SCAN-R.xlsx</code> with authoritative percentage guidelines, custom simulation sliders, and real-time cascade calculations.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 shrink-0">
            {[
              { label: 'Tables', value: '54', icon: <Target className="w-3.5 h-3.5" />, color: '#c084fc' },
              { label: 'Cosmic Codes', value: '12', icon: <Star className="w-3.5 h-3.5" />, color: '#fbbf24' },
              { label: 'Tiers', value: '6', icon: <TrendingUp className="w-3.5 h-3.5" />, color: '#34d399' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="text-center px-3 py-2 rounded-xl border bg-black/20"
                style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-center mb-0.5" style={{ color }}>{icon}</div>
                <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{value}</div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Calibration & Presets Controller ───────────────────────────────── */}
        <div className="mt-6 pt-5 border-t border-purple-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 mr-1 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Guidelines & Calibration:
            </span>

            <button
              onClick={() => applyPreset('midpoint')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                config.mode === 'midpoint'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                  : 'bg-surface text-secondary hover:text-primary border-border hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Excel Midpoint (Recommended)
            </button>

            <button
              onClick={() => applyPreset('min')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                config.mode === 'min'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                  : 'bg-surface text-secondary hover:text-primary border-border hover:bg-white/5'
              }`}
            >
              📉 Minimum Bounds
            </button>

            <button
              onClick={() => applyPreset('max')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                config.mode === 'max'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                  : 'bg-surface text-secondary hover:text-primary border-border hover:bg-white/5'
              }`}
            >
              📈 Maximum Bounds
            </button>
          </div>

          <button
            onClick={() => setIsCustomDrawerOpen(o => !o)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 ml-auto lg:ml-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {isCustomDrawerOpen ? 'Hide Custom Sliders' : 'Customize Ratios & Multipliers'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCustomDrawerOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* ─── Collapsible Custom Calibration Drawer ─────────────────────────── */}
        {isCustomDrawerOpen && (
          <div className="mt-4 p-5 rounded-xl border border-purple-500/30 bg-black/40 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-purple-300 uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                Custom Ratio & Multiplier Calibration Panel
              </div>
              <button
                onClick={() => applyPreset('midpoint')}
                className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 underline"
              >
                <RotateCcw className="w-3 h-3" /> Reset to Excel Midpoint
              </button>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Adjust Current Status (%) and Target Multipliers (%) in real-time. The approved Excel guideline range is displayed on every slider:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Chakra Slider */}
              <div className="p-3 rounded-lg border border-purple-500/20 bg-white/5 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Chakras (Table 2)</span>
                  <span className="text-purple-400 font-mono">{config.chakraPct}%</span>
                </div>
                <input
                  type="range"
                  min="38.0"
                  max="46.0"
                  step="0.1"
                  value={config.chakraPct}
                  onChange={e => updateConfigVal('chakraPct', parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted font-mono">
                  <span>Min 39.5%</span>
                  <span className="text-amber-400 font-bold">Guideline: 39.5%–44.5%</span>
                  <span>Max 44.5%</span>
                </div>
              </div>

              {/* Aura Slider */}
              <div className="p-3 rounded-lg border border-purple-500/20 bg-white/5 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Auras (Table 3)</span>
                  <span className="text-indigo-400 font-mono">{config.auraPct}%</span>
                </div>
                <input
                  type="range"
                  min="32.0"
                  max="40.0"
                  step="0.1"
                  value={config.auraPct}
                  onChange={e => updateConfigVal('auraPct', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted font-mono">
                  <span>Min 33.5%</span>
                  <span className="text-amber-400 font-bold">Guideline: 33.5%–38.5%</span>
                  <span>Max 38.5%</span>
                </div>
              </div>

              {/* Positive Karmic Slider */}
              <div className="p-3 rounded-lg border border-purple-500/20 bg-white/5 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Positive Karmic Deeds (Table 4)</span>
                  <span className="text-amber-400 font-mono">{config.positiveKarmicPct}%</span>
                </div>
                <input
                  type="range"
                  min="27.0"
                  max="35.0"
                  step="0.1"
                  value={config.positiveKarmicPct}
                  onChange={e => updateConfigVal('positiveKarmicPct', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted font-mono">
                  <span>Min 28.5%</span>
                  <span className="text-amber-400 font-bold">Guideline: 28.5%–33.5%</span>
                  <span>Max 33.5%</span>
                </div>
              </div>

              {/* Karmic Refinement Slider */}
              <div className="p-3 rounded-lg border border-purple-500/20 bg-white/5 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Karmic Refinement (Table 5)</span>
                  <span className="text-pink-400 font-mono">{config.karmicRefinementPct}%</span>
                </div>
                <input
                  type="range"
                  min="40.0"
                  max="46.0"
                  step="0.1"
                  value={config.karmicRefinementPct}
                  onChange={e => updateConfigVal('karmicRefinementPct', parseFloat(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted font-mono">
                  <span>Min 41.5%</span>
                  <span className="text-amber-400 font-bold">Guideline: 41.5%–44.5%</span>
                  <span>Max 44.5%</span>
                </div>
              </div>

              {/* Karmic Balancing Slider */}
              <div className="p-3 rounded-lg border border-purple-500/20 bg-white/5 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Karmic Balancing (Table 6)</span>
                  <span className="text-emerald-400 font-mono">{config.karmicBalancingPct}%</span>
                </div>
                <input
                  type="range"
                  min="84.0"
                  max="90.0"
                  step="0.1"
                  value={config.karmicBalancingPct}
                  onChange={e => updateConfigVal('karmicBalancingPct', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted font-mono">
                  <span>Min 85.5%</span>
                  <span className="text-amber-400 font-bold">Guideline: 85.5%–88.5%</span>
                  <span>Max 88.5%</span>
                </div>
              </div>

              {/* Target Multiplier Slider */}
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                <div className="flex justify-between font-bold text-emerald-300">
                  <span>Target Level Multiplier</span>
                  <span className="font-mono">{config.targetMultiplierPct}%</span>
                </div>
                <input
                  type="range"
                  min="130.0"
                  max="145.0"
                  step="0.5"
                  value={config.targetMultiplierPct}
                  onChange={e => updateConfigVal('targetMultiplierPct', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted font-mono">
                  <span>Min 135%</span>
                  <span className="text-emerald-400 font-bold">Guideline: 135%–140%</span>
                  <span>Max 140%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Tier 1 Recap (Parental Legacy) ──────────────────────────────────── */}
      <div className="glass-card rounded-xl border p-5 shadow-sm" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-6 rounded-full" style={{ background: 'linear-gradient(180deg,#c026d3,#0891b2)' }} />
          <span className="font-extrabold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Table 1 — Parental Legacy (Authoritative Seed Data)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded border font-semibold ml-auto"
            style={{ color: '#d97706', borderColor: 'var(--accent-border)', background: 'var(--accent-bg)' }}>
            Tier 1: Baseline Genesis
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="uppercase tracking-wider font-bold border-b"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'var(--bg-header)' }}>
              <tr>
                <th className="px-4 py-2.5">Life Factor</th>
                <th className="px-4 py-2.5 text-right">Mother</th>
                <th className="px-4 py-2.5 text-right">Father</th>
                <th className="px-4 py-2.5 text-right" style={{ color: '#d97706' }}>Total (Seed)</th>
                <th className="px-4 py-2.5 text-right" style={{ color: '#818cf8' }}>
                  → Current (×{config.chakraPct}%)
                </th>
                <th className="px-4 py-2.5 text-right" style={{ color: '#34d399' }}>
                  → Target (×{config.targetMultiplierPct}%)
                </th>
              </tr>
            </thead>
            <tbody>
              {calculation.factors.map((f, idx) => {
                const cs = Number((f.totalValue * (config.chakraPct / 100)).toFixed(3));
                const tl = Number((cs * (config.targetMultiplierPct / 100)).toFixed(3));
                return (
                  <tr key={f.factorId} className="border-b transition-colors"
                    style={{ borderColor: 'var(--border)', background: idx % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)')}>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{f.factorName}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums" style={{ color: 'var(--mother-mid)' }}>{f.motherValue.toFixed(3)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums" style={{ color: 'var(--father-mid)' }}>{f.fatherValue.toFixed(3)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums" style={{ color: '#d97706' }}>{f.totalValue.toFixed(3)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums" style={{ color: '#818cf8' }}>{cs.toFixed(3)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums" style={{ color: '#34d399' }}>{tl.toFixed(3)}</td>
                  </tr>
                );
              })}
              <tr className="font-extrabold border-t-2"
                style={{ background: 'var(--bg-tfoot)', borderColor: 'var(--border-strong)' }}>
                <td className="px-4 py-3 uppercase tracking-wider text-[11px]" style={{ color: 'var(--text-primary)' }}>GRAND TOTAL</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums" style={{ color: 'var(--mother-mid)' }}>{calculation.motherTotal.toFixed(3)}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums" style={{ color: 'var(--father-mid)' }}>{calculation.fatherTotal.toFixed(3)}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-amber-500">{calculation.grandTotal.toFixed(3)}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-indigo-400">
                  {(calculation.grandTotal * (config.chakraPct / 100)).toFixed(3)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-400">
                  {((calculation.grandTotal * (config.chakraPct / 100)) * (config.targetMultiplierPct / 100)).toFixed(3)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 12 Cosmic Master Codes (Tables 42–53 Cards Grid) ─────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-purple-400" />
          <h3 className="font-extrabold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
            The 12 Master Cosmic Codes (Transcendence Synthesis)
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded border font-semibold ml-auto"
            style={{ color: '#c084fc', borderColor: 'rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.1)' }}>
            Tables 42–53 · Dual Factor Averages
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {cosmicCodes.map(code => (
            <CosmicCodeCard key={code.codeNumber} code={code} />
          ))}
        </div>
      </div>

      {/* ── Collapsible Tier Sections (Tiers 2–6) ────────────────────────────── */}
      <div className="space-y-4">
        <TierSection
          tier={2}
          label="Tier 2: Energy Architecture & Subtle Centers"
          description="Chakra levels (Muladhara to Sahasrara) & Subtle Auras (Physical to Ketheric)"
          tables={tier2Tables}
          defaultFirstOpen={true}
        />

        <TierSection
          tier={3}
          label="Tier 3: Subtle Body, Karmic Merit & Dimensional Elements"
          description="Positive Karmic Deeds, Refinement Sectors, Karmic Balancing & 7 Elements"
          tables={tier3Tables}
        />

        <TierSection
          tier={4}
          label="Tier 4: Granular Chakra Facets & 7 Koshas (Sheaths of Existence)"
          description="7 detailed sub-factor tables for each Chakra & 7 Kosha layers (Annamaya to Shivamaya)"
          tables={tier4Tables}
        />

        <TierSection
          tier={5}
          label="Tier 5: Behavioral Foundations, Mind & Ayurvedic Tridosha"
          description="4 Pillars of Life, 3 Psychological Complexes, Tridosha & 4 Antahkarana Faculties"
          tables={tier5Tables}
        />

        <TierSection
          tier={6}
          label="Tier 6: 12 Cosmic Master Codes & System Synthesis"
          description="12 specialized synthesis codes and Table 54 Master Comparison audit"
          tables={tier6Tables}
        />
      </div>

      {/* ── Sheet 2: Spiritual Observances ───────────────────────────────────── */}
      <div className="glass-card rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-3.5 border-b flex items-center gap-3"
          style={{ borderColor: 'var(--border)', background: 'rgba(245,158,11,0.07)' }}>
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>
            Sheet 2 — Spiritual Observances & Daily Disciplines
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded border font-semibold ml-auto"
            style={{ color: '#fbbf24', borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.08)' }}>
            Required = Present × 45% · Min = Present × 25%
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="uppercase tracking-wider font-bold border-b"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'var(--bg-header)' }}>
              <tr>
                <th className="px-5 py-2.5">Discipline / Practice</th>
                <th className="px-4 py-2.5 text-right" style={{ color: '#d97706' }}>Present Level</th>
                <th className="px-4 py-2.5 text-right" style={{ color: '#34d399' }}>Required Level (45%)</th>
                <th className="px-4 py-2.5 text-right" style={{ color: '#818cf8' }}>Minimum Level (25%)</th>
                <th className="px-5 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {spiritualObservances.map((obs, idx) => {
                const adequate = obs.presentLevel >= obs.requiredLevel;
                return (
                  <tr key={obs.id} className="border-b transition-colors"
                    style={{ borderColor: 'var(--border)', background: idx % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)')}>
                    <td className="px-5 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{obs.name}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums" style={{ color: '#d97706' }}>
                      {obs.presentLevel.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums" style={{ color: '#34d399' }}>
                      {obs.requiredLevel.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums" style={{ color: '#818cf8' }}>
                      {obs.minimumLevel.toFixed(3)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
                        style={adequate
                          ? { color: '#34d399', borderColor: 'rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.1)' }
                          : { color: '#f472b6', borderColor: 'rgba(244,114,182,0.3)', background: 'rgba(244,114,182,0.1)' }}>
                        {adequate ? 'Adequate' : 'Needs Work'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {/* Totals */}
              <tr className="font-extrabold border-t-2" style={{ background: 'var(--bg-tfoot)', borderColor: 'var(--border-strong)' }}>
                <td className="px-5 py-3 uppercase tracking-wider text-[11px]" style={{ color: 'var(--text-primary)' }}>TOTAL</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums" style={{ color: '#d97706' }}>
                  {spiritualObservances.reduce((a, o) => a + o.presentLevel, 0).toFixed(1)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums" style={{ color: '#34d399' }}>
                  {spiritualObservances.reduce((a, o) => a + o.requiredLevel, 0).toFixed(3)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums" style={{ color: '#818cf8' }}>
                  {spiritualObservances.reduce((a, o) => a + o.minimumLevel, 0).toFixed(3)}
                </td>
                <td className="px-5 py-3 text-center" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Sheet 3: Vedic Terminology ───────────────────────────────────────── */}
      <div className="glass-card rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-3.5 border-b flex items-center gap-3"
          style={{ borderColor: 'var(--border)', background: 'rgba(99,102,241,0.07)' }}>
          <Info className="w-4 h-4 text-indigo-400" />
          <span className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>
            Sheet 3 — Vedic & Cosmic Terminology Mapping
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded border font-semibold ml-auto"
            style={{ color: '#818cf8', borderColor: 'rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.08)' }}>
            Sanskrit Nomenclature
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="uppercase tracking-wider font-bold border-b"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'var(--bg-header)' }}>
              <tr>
                <th className="px-5 py-2.5">#</th>
                <th className="px-4 py-2.5">Original Name</th>
                <th className="px-4 py-2.5" style={{ color: '#818cf8' }}>Vedic / Cosmic Name</th>
                <th className="px-5 py-2.5">Description</th>
              </tr>
            </thead>
            <tbody>
              {vedicMappings.map((v, idx) => (
                <tr key={v.factorId} className="border-b transition-colors"
                  style={{ borderColor: 'var(--border)', background: idx % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)')}>
                  <td className="px-5 py-3 font-mono font-bold" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{v.originalName}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: '#818cf8' }}>{v.vedicName}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{v.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula & Guideline Legend Footer */}
      <div className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs shadow-sm"
        style={{ background: 'var(--bg-note)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
        <HelpCircle className="w-4 h-4 shrink-0 text-purple-400" />
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span><strong style={{ color: '#818cf8' }}>Active Chakras:</strong> {config.chakraPct}% (Guideline: 39.5%–44.5%)</span>
          <span><strong style={{ color: '#fbbf24' }}>Active Auras:</strong> {config.auraPct}% (Guideline: 33.5%–38.5%)</span>
          <span><strong style={{ color: '#f472b6' }}>Karmic Deeds:</strong> {config.positiveKarmicPct}% (Guideline: 28.5%–33.5%)</span>
          <span><strong style={{ color: '#34d399' }}>Target Multiplier:</strong> {config.targetMultiplierPct}% (Guideline: 135%–140%)</span>
          <span><strong style={{ color: '#a855f7' }}>Koshas:</strong> 65% of Chakra</span>
        </div>
      </div>

    </div>
  );
};
