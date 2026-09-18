import React from 'react';
import { CalculationResult } from '../types';
import { exportToPDF } from '../services/pdfExport';
import { exportToCSV } from '../services/csvExport';
import { FileText, Download, RotateCcw, Check, Copy } from 'lucide-react';

interface ExportActionBarProps {
  calculation: CalculationResult;
  onReset: () => void;
}

export const ExportActionBar: React.FC<ExportActionBarProps> = ({ calculation, onReset }) => {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleShare = () => {
    const text = `Parental Legacy Report for DOB ${calculation.dob}: Mother: ${calculation.motherTotal.toFixed(3)}%, Father: ${calculation.fatherTotal.toFixed(3)}%, Dominant: ${calculation.dominantParent}. Total: 100.000.`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
      style={{ borderColor: 'var(--border)' }}>

      {/* Left info */}
      <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
        <span>
          Active calculation for <strong style={{ color: 'var(--text-primary)' }}>{calculation.dob}</strong>
          {' '}(Grand Total = 100.000)
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">

        {/* PDF Export — Fuchsia gradient */}
        <button
          onClick={() => exportToPDF(calculation)}
          className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white transition-all duration-200 shadow-md hover:opacity-95"
          style={{ background: 'linear-gradient(135deg, #c026d3, #7c3aed)', boxShadow: '0 4px 14px rgba(192,38,211,0.25)' }}
        >
          <FileText className="w-4 h-4" />
          <span>Export PDF</span>
        </button>

        {/* CSV Export — Cyan gradient */}
        <button
          onClick={() => exportToCSV(calculation)}
          className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white transition-all duration-200 shadow-md hover:opacity-95"
          style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)', boxShadow: '0 4px 14px rgba(8,145,178,0.2)' }}
        >
          <Download className="w-4 h-4" />
          <span>Download CSV</span>
        </button>

        {/* Copy Summary */}
        <button
          onClick={handleShare}
          className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-all duration-200 hover:opacity-80"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
        >
          {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          <span>{isCopied ? 'Summary Copied!' : 'Copy Summary'}</span>
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-2 rounded-xl border transition-all duration-200 hover:opacity-80"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
          title="Reset to default date"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

