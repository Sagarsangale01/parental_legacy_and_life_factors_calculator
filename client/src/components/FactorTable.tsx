import React from 'react';
import { CalculationResult } from '../types';
import { Info } from 'lucide-react';

interface FactorTableProps {
  calculation: CalculationResult;
}

export const FactorTable: React.FC<FactorTableProps> = ({ calculation }) => {
  const { factors, motherTotal, fatherTotal, grandTotal } = calculation;

  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-xl border" style={{ borderColor: 'var(--border)' }}>

      {/* Table Header */}
      <div className="p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Detailed Life Factors Breakdown
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Calibrated proportional distribution across maternal and paternal hereditary lines.
          </p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-semibold">
          <span className="flex items-center" style={{ color: 'var(--mother-mid)' }}>
            <span className="w-2.5 h-2.5 rounded-full mr-1.5 inline-block" style={{ background: 'var(--mother-mid)' }} />
            Mother Value
          </span>
          <span className="flex items-center" style={{ color: 'var(--father-mid)' }}>
            <span className="w-2.5 h-2.5 rounded-full mr-1.5 inline-block" style={{ background: 'var(--father-mid)' }} />
            Father Value
          </span>
          <span className="flex items-center" style={{ color: '#d97706' }}>
            <span className="w-2.5 h-2.5 rounded-full mr-1.5 inline-block" style={{ background: '#d97706' }} />
            Total Sum
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs font-bold uppercase tracking-wider border-b"
            style={{ background: 'var(--bg-header)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
            <tr>
              <th scope="col" className="px-6 py-3.5">Life Factors</th>
              <th scope="col" className="px-5 py-3.5 text-right" style={{ color: 'var(--mother-mid)' }}>Mother</th>
              <th scope="col" className="px-5 py-3.5 text-right" style={{ color: 'var(--father-mid)' }}>Father</th>
              <th scope="col" className="px-5 py-3.5 text-right" style={{ color: '#d97706' }}>Total</th>
              <th scope="col" className="px-5 py-3.5 text-right">Minimum</th>
              <th scope="col" className="px-5 py-3.5 text-right">Maximum</th>
              <th scope="col" className="px-6 py-3.5 text-center">Relative Balance</th>
            </tr>
          </thead>
          <tbody>
            {factors.map((factor, index) => {
              const motherShare = (factor.motherValue / factor.totalValue) * 100;
              const fatherShare = (factor.fatherValue / factor.totalValue) * 100;

              return (
                <tr
                  key={factor.factorId}
                  className="transition-colors border-b"
                  style={{
                    borderColor: 'var(--border)',
                    background: index % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'var(--bg-row-alt)')}
                >
                  {/* Factor Name */}
                  <td className="px-6 py-4 font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {factor.factorName}
                  </td>

                  {/* Mother Value */}
                  <td className="px-5 py-4 text-right font-mono font-bold tabular-nums" style={{ color: 'var(--mother-mid)' }}>
                    {factor.motherValue.toFixed(3)}
                  </td>

                  {/* Father Value */}
                  <td className="px-5 py-4 text-right font-mono font-bold tabular-nums" style={{ color: 'var(--father-mid)' }}>
                    {factor.fatherValue.toFixed(3)}
                  </td>

                  {/* Factor Total */}
                  <td className="px-5 py-4 text-right font-mono font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {factor.totalValue.toFixed(3)}
                  </td>

                  {/* Minimum */}
                  <td className="px-5 py-4 text-right font-mono text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {factor.min.toFixed(3)}
                  </td>

                  {/* Maximum */}
                  <td className="px-5 py-4 text-right font-mono text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {factor.max.toFixed(3)}
                  </td>

                  {/* Micro Bar */}
                  <td className="px-6 py-4">
                    <div className="w-40 mx-auto flex items-center space-x-2">
                      <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ background: 'var(--bar-track)' }}>
                        <div
                          className="h-full transition-all duration-500"
                          style={{ width: `${motherShare}%`, background: 'var(--mother-mid)' }}
                          title={`Mother: ${motherShare.toFixed(1)}%`}
                        />
                        <div
                          className="h-full transition-all duration-500"
                          style={{ width: `${fatherShare}%`, background: 'var(--father-mid)' }}
                          title={`Father: ${fatherShare.toFixed(1)}%`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded border"
                        style={
                          factor.higherParent === 'Mother'
                            ? { background: 'var(--mother-bg)', color: 'var(--mother-mid)', borderColor: 'var(--mother-border)' }
                            : { background: 'var(--father-bg)', color: 'var(--father-mid)', borderColor: 'var(--father-border)' }
                        }>
                        {factor.higherParent === 'Mother' ? 'Maternal' : 'Paternal'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* TOTAL Summary Row */}
            <tr className="font-extrabold border-t-2" style={{ background: 'var(--bg-tfoot)', borderColor: 'var(--border-strong)' }}>
              <td className="px-6 py-4 uppercase tracking-wider text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span>TOTAL</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded border"
                  style={{ color: '#d97706', background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
                  100.000 Invariant
                </span>
              </td>
              <td className="px-5 py-4 text-right font-mono text-base tabular-nums" style={{ color: 'var(--mother-mid)' }}>
                {motherTotal.toFixed(3)}
              </td>
              <td className="px-5 py-4 text-right font-mono text-base tabular-nums" style={{ color: 'var(--father-mid)' }}>
                {fatherTotal.toFixed(3)}
              </td>
              <td className="px-5 py-4 text-right font-mono text-base tabular-nums" style={{ color: '#d97706' }}>
                {grandTotal.toFixed(3)}
              </td>
              <td className="px-5 py-4 text-right font-mono text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>—</td>
              <td className="px-5 py-4 text-right font-mono text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>—</td>
              <td className="px-6 py-4 text-center">
                <span className="px-2.5 py-1 text-xs rounded-full font-bold uppercase tracking-wider border"
                  style={{ background: 'var(--accent-bg)', color: '#d97706', borderColor: 'var(--accent-border)' }}>
                  Equilibrium 100.000
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="p-4 border-t flex items-center space-x-2 text-xs"
        style={{ background: 'var(--bg-note)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
        <Info className="w-4 h-4 shrink-0" />
        <span>
          Mathematical invariant: Individual factor parameters dynamically balance such that cumulative hereditary totals resolve to exactly 100.000.
        </span>
      </div>
    </div>
  );
};

