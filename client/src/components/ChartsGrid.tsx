import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { CalculationResult } from '../types';
import { useTheme } from '../context/ThemeContext';
import { BarChart3, PieChart as PieIcon, Activity, Heart, Shield } from 'lucide-react';

interface ChartsGridProps {
  calculation: CalculationResult;
}

// Fresh Fuchsia × Cyan palette
const MOTHER_COLOR  = '#d946ef'; // Fuchsia-500
const FATHER_COLOR  = '#06b6d4'; // Cyan-500

export const ChartsGrid: React.FC<ChartsGridProps> = ({ calculation }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'bar' | 'donut' | 'radar'>('all');
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Dynamic colors based on theme for maximum contrast
  const gridColor = isLight ? '#cbd5e1' : '#1a2d45';
  const radarGridColor = isLight ? '#94a3b8' : '#234260';
  const axisTextColor = isLight ? '#0f172a' : '#8baec8';
  const legendTextColor = isLight ? '#0f172a' : '#c5d8ec';
  
  const tooltipStyle = {
    backgroundColor: isLight ? '#ffffff' : '#0c1425',
    borderColor: isLight ? '#cbd5e1' : '#1a2d45',
    borderRadius: '12px',
    color: isLight ? '#0b1829' : '#f0f6ff',
    fontSize: '12px',
    boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.1)' : '0 12px 24px rgba(0,0,0,0.5)',
    border: `1px solid ${isLight ? '#cbd5e1' : '#1a2d45'}`
  };

  const factorData = calculation.factors.map(f => ({
    name: f.factorName,
    shortName: f.factorName.length > 14 ? f.factorName.substring(0, 12) + '…' : f.factorName,
    Mother: f.motherValue,
    Father: f.fatherValue,
    Total: f.totalValue,
  }));

  const donutData = [
    { name: 'Mother Legacy', value: calculation.motherTotal, color: MOTHER_COLOR },
    { name: 'Father Legacy', value: calculation.fatherTotal, color: FATHER_COLOR }
  ];

  const tabCls = (tab: string) =>
    `px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 ${
      activeTab === tab
        ? 'bg-fuchsia-600/90 text-white shadow-md shadow-fuchsia-500/25 ring-1 ring-fuchsia-400/40 font-bold'
        : 'hover:opacity-80'
    }`;

  return (
    <div className="space-y-6">

      {/* Header + Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Visual Data Analytics
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Interactive maternal and paternal life factor comparisons.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl border self-start"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <button
            onClick={() => setActiveTab('all')}
            className={tabCls('all')}
            style={activeTab !== 'all' ? { color: 'var(--text-secondary)' } : {}}
          >
            All Visuals
          </button>
          <button
            onClick={() => setActiveTab('bar')}
            className={tabCls('bar')}
            style={activeTab !== 'bar' ? { color: 'var(--text-secondary)' } : {}}
          >
            <BarChart3 className="w-3.5 h-3.5" /><span>Bar Chart</span>
          </button>
          <button
            onClick={() => setActiveTab('donut')}
            className={tabCls('donut')}
            style={activeTab !== 'donut' ? { color: 'var(--text-secondary)' } : {}}
          >
            <PieIcon className="w-3.5 h-3.5" /><span>Donut Split</span>
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={tabCls('radar')}
            style={activeTab !== 'radar' ? { color: 'var(--text-secondary)' } : {}}
          >
            <Activity className="w-3.5 h-3.5" /><span>Radar Profile</span>
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Grouped Bar Chart */}
        {(activeTab === 'all' || activeTab === 'bar') && (
          <div className={`glass-card rounded-2xl p-6 border shadow-card ${
            activeTab === 'bar' ? 'lg:col-span-2' : ''
          }`} style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <BarChart3 className="w-4 h-4 text-fuchsia-400" />
                Factor Dimension Comparison — Mother vs Father
              </h4>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg border"
                style={{ background: 'var(--bg-badge)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                7 Core Factors
              </span>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={factorData} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={isLight ? 0.9 : 0.7} />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fill: axisTextColor, fontSize: 11, fontWeight: 600 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fill: axisTextColor, fontSize: 11, fontWeight: 600 }} domain={[0, 12]} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: any, name: any) => [`${Number(value).toFixed(3)}`, name]}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    formatter={(val) => <span className="text-xs font-semibold" style={{ color: legendTextColor }}>{val}</span>}
                  />
                  <Bar dataKey="Mother" fill={MOTHER_COLOR} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Father" fill={FATHER_COLOR} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 2. Donut / Legacy Proportion Chart */}
        {(activeTab === 'all' || activeTab === 'donut') && (
          <div className="glass-card rounded-2xl p-6 border shadow-card flex flex-col justify-between"
            style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <PieIcon className="w-4 h-4 text-amber-400" />
                Overall Legacy Equilibrium Split
              </h4>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                style={{ background: 'var(--accent-bg)', color: '#d97706', borderColor: 'var(--accent-border)' }}>
                100% Total
              </span>
            </div>

            {/* Donut graphic with center circular badge & slice labels */}
            <div className="h-72 w-full flex items-center justify-center relative my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={68} outerRadius={108}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#ffffff"
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="text-xs font-black"
                          style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                        >
                          {`${(percent * 100).toFixed(1)}%`}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={isLight ? '#ffffff' : '#0c1425'} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [`${Number(val).toFixed(3)}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* High-contrast Center Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-28 h-28 rounded-full flex flex-col items-center justify-center border shadow-md transition-all duration-300"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-strong)',
                  }}
                >
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-secondary)' }}>
                    Total
                  </span>
                  <span className="text-lg font-black tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    100.000%
                  </span>
                  <span
                    className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full mt-0.5 border"
                    style={{
                      background: 'var(--accent-bg)',
                      color: '#d97706',
                      borderColor: 'var(--accent-border)'
                    }}
                  >
                    Balanced
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom High-Contrast Legend & Split Comparison Cards */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              
              {/* Mother Share Card */}
              <div
                className="p-3.5 rounded-xl border transition-all duration-200 relative overflow-hidden"
                style={{
                  background: 'var(--mother-bg)',
                  borderColor: 'var(--mother-border)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--mother-mid)' }}>
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    Mother Share
                  </span>
                  <span
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white shadow-sm"
                    style={{ background: MOTHER_COLOR }}
                  >
                    Maternal
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {calculation.motherTotal.toFixed(3)}%
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {calculation.motherTotal > calculation.fatherTotal ? 'Primary' : 'Secondary'}
                  </span>
                </div>
                {/* Mini proportional bar */}
                <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--bar-track)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${calculation.motherTotal}%`, background: MOTHER_COLOR }}
                  />
                </div>
              </div>

              {/* Father Share Card */}
              <div
                className="p-3.5 rounded-xl border transition-all duration-200 relative overflow-hidden"
                style={{
                  background: 'var(--father-bg)',
                  borderColor: 'var(--father-border)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--father-mid)' }}>
                    <Shield className="w-3.5 h-3.5 fill-current" />
                    Father Share
                  </span>
                  <span
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white shadow-sm"
                    style={{ background: FATHER_COLOR }}
                  >
                    Paternal
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {calculation.fatherTotal.toFixed(3)}%
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {calculation.fatherTotal > calculation.motherTotal ? 'Primary' : 'Secondary'}
                  </span>
                </div>
                {/* Mini proportional bar */}
                <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--bar-track)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${calculation.fatherTotal}%`, background: FATHER_COLOR }}
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 3. Radar / Spider Web Chart */}
        {(activeTab === 'all' || activeTab === 'radar') && (
          <div className="glass-card rounded-2xl p-6 border shadow-card lg:col-span-2"
            style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Activity className="w-4 h-4 text-cyan-400" />
                Multidimensional Lineage Radar Profile
              </h4>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg border"
                style={{ background: 'var(--bg-badge)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Radial Envelope
              </span>
            </div>

            {/* Legend row — rendered outside the chart to avoid SVG clipping issues */}
            <div className="flex items-center justify-center gap-6 mb-4">
              <span className="flex items-center gap-2 text-xs font-bold" style={{ color: legendTextColor }}>
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: MOTHER_COLOR }} />
                Mother Value
              </span>
              <span className="flex items-center gap-2 text-xs font-bold" style={{ color: legendTextColor }}>
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: FATHER_COLOR }} />
                Father Value
              </span>
            </div>

            {/* Fixed pixel height + display:block ensures ResponsiveContainer has measurable bounds */}
            <div style={{ width: '100%', height: 380, display: 'block' }}>
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="68%"
                  data={factorData}
                  margin={{ top: 20, right: 40, bottom: 20, left: 40 }}
                >
                  <PolarGrid
                    stroke={isLight ? '#475569' : '#2d4a6a'}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                  <PolarAngleAxis
                    dataKey="shortName"
                    tick={{
                      fill: isLight ? '#0b1829' : '#e2e8f0',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 12]}
                    tickCount={5}
                    tick={{
                      fill: isLight ? '#1e3a52' : '#8baec8',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                    stroke={isLight ? '#94a3b8' : '#2d4a6a'}
                  />
                  <Radar
                    name="Mother Value"
                    dataKey="Mother"
                    stroke={MOTHER_COLOR}
                    fill={MOTHER_COLOR}
                    fillOpacity={0.30}
                    strokeWidth={3}
                    dot={{ r: 5, fill: MOTHER_COLOR, stroke: isLight ? '#ffffff' : '#0c1425', strokeWidth: 1.5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Radar
                    name="Father Value"
                    dataKey="Father"
                    stroke={FATHER_COLOR}
                    fill={FATHER_COLOR}
                    fillOpacity={0.30}
                    strokeWidth={3}
                    dot={{ r: 5, fill: FATHER_COLOR, stroke: isLight ? '#ffffff' : '#0c1425', strokeWidth: 1.5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: any, name: any) => [`${Number(value).toFixed(3)}`, name]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

