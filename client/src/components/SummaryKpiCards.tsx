import React from 'react';
import { CalculationResult } from '../types';
import { Heart, Shield, Scale, Trophy, ArrowUpRight } from 'lucide-react';

interface SummaryKpiCardsProps {
  calculation: CalculationResult;
}

export const SummaryKpiCards: React.FC<SummaryKpiCardsProps> = ({ calculation }) => {
  const { motherTotal, fatherTotal, grandTotal, dominantParent } = calculation;
  const margin = Math.abs(motherTotal - fatherTotal).toFixed(3);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">

      {/* 1. Mother Total Card — Fuchsia */}
      <div className="glass-card rounded-2xl p-5 border border-fuchsia-500/25 relative overflow-hidden group hover:border-fuchsia-400/40 transition-all duration-300"
        style={{ background: `linear-gradient(135deg, var(--mother-bg) 0%, var(--bg-surface) 70%)` }}>
        {/* Subtle corner glow */}
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-fuchsia-500/10 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--mother-mid)' }}>
            Mother Legacy
          </span>
          <div className="p-2 rounded-xl bg-fuchsia-500/15 ring-1 ring-fuchsia-400/20">
            <Heart className="w-4 h-4 text-fuchsia-400 fill-fuchsia-500/25" />
          </div>
        </div>
        <div className="mt-3 relative">
          <div className="text-3xl font-black tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {motherTotal.toFixed(3)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>Share of 100</span>
            <span className="font-bold" style={{ color: 'var(--mother-mid)' }}>{motherTotal.toFixed(2)}%</span>
          </div>
        </div>
        <div className="mt-3.5 w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bar-track)' }}>
          <div
            className="h-full rounded-full bar-fill"
            style={{ width: `${motherTotal}%`, background: `linear-gradient(90deg, var(--mother-primary), var(--mother-light))` }}
          />
        </div>
      </div>

      {/* 2. Father Total Card — Cyan */}
      <div className="glass-card rounded-2xl p-5 border border-cyan-500/25 relative overflow-hidden group hover:border-cyan-400/40 transition-all duration-300"
        style={{ background: `linear-gradient(135deg, var(--father-bg) 0%, var(--bg-surface) 70%)` }}>
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--father-mid)' }}>
            Father Legacy
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/15 ring-1 ring-cyan-400/20">
            <Shield className="w-4 h-4 text-cyan-400 fill-cyan-500/25" />
          </div>
        </div>
        <div className="mt-3 relative">
          <div className="text-3xl font-black tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {fatherTotal.toFixed(3)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>Share of 100</span>
            <span className="font-bold" style={{ color: 'var(--father-mid)' }}>{fatherTotal.toFixed(2)}%</span>
          </div>
        </div>
        <div className="mt-3.5 w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bar-track)' }}>
          <div
            className="h-full rounded-full bar-fill"
            style={{ width: `${fatherTotal}%`, background: `linear-gradient(90deg, var(--father-primary), var(--father-light))` }}
          />
        </div>
      </div>

      {/* 3. Grand Total Equilibrium Card — Amber/Gold */}
      <div className="glass-card rounded-2xl p-5 border border-amber-400/25 relative overflow-hidden group hover:border-amber-400/40 transition-all duration-300"
        style={{ background: `linear-gradient(135deg, var(--accent-bg) 0%, var(--bg-surface) 70%)` }}>
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-amber-500/8 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#d97706' }}>
            Grand Equilibrium
          </span>
          <div className="p-2 rounded-xl bg-amber-500/15 ring-1 ring-amber-400/20">
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
        </div>
        <div className="mt-3 relative">
          <div className="text-3xl font-black tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {grandTotal.toFixed(3)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>Mathematical Invariant</span>
            <span className="font-bold" style={{ color: '#d97706' }}>100.000 Exact</span>
          </div>
        </div>
        <div className="mt-3.5 w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bar-track)' }}>
          <div className="h-full rounded-full w-full" style={{ background: `linear-gradient(90deg, var(--accent-gold), var(--accent-amber))` }} />
        </div>
      </div>

      {/* 4. Primary Lineage Outcome Card */}
      <div className={`glass-card rounded-2xl p-5 border relative overflow-hidden transition-all duration-300 ${
        dominantParent === 'Mother'
          ? 'border-fuchsia-500/30 hover:border-fuchsia-400/50'
          : 'border-cyan-500/30 hover:border-cyan-400/50'
      }`}
        style={{
          background: dominantParent === 'Mother'
            ? 'linear-gradient(135deg, var(--mother-bg) 0%, var(--bg-surface) 70%)'
            : 'linear-gradient(135deg, var(--father-bg) 0%, var(--bg-surface) 70%)'
        }}>
        <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none ${
          dominantParent === 'Mother' ? 'bg-fuchsia-500/12' : 'bg-cyan-500/12'
        }`} />
        <div className="flex items-center justify-between relative">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            Primary Lineage
          </span>
          <div className={`p-2 rounded-xl ring-1 ${
            dominantParent === 'Mother'
              ? 'bg-fuchsia-500/15 ring-fuchsia-400/20 text-fuchsia-400'
              : 'bg-cyan-500/15 ring-cyan-400/20 text-cyan-400'
          }`}>
            <Trophy className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 relative">
          <div className="flex items-center space-x-1.5">
            <span className="text-2xl font-black tracking-tight"
              style={{ color: dominantParent === 'Mother' ? 'var(--mother-mid)' : 'var(--father-mid)' }}>
              {dominantParent}
            </span>
            <ArrowUpRight className="w-5 h-5"
              style={{ color: dominantParent === 'Mother' ? 'var(--mother-primary)' : 'var(--father-primary)' }} />
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Hereditary variance margin: <strong style={{ color: 'var(--text-primary)' }}>{margin}%</strong>
          </div>
        </div>
        <div className="mt-3 text-[11px] font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
          {dominantParent === 'Mother'
            ? 'Maternal line governs primary legacy'
            : 'Paternal line governs primary legacy'}
        </div>
      </div>

    </div>
  );
};

