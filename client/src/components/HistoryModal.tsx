import React, { useEffect, useState } from 'react';
import { HistoryItemSummary } from '../types';
import { fetchHistory, deleteCalculationRecord } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Database, Trash2, Calendar, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCalculation: (dob: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectCalculation
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [items, setItems] = useState<HistoryItemSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchHistory(1, 20);
      setItems(data.calculations);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load MongoDB calculation history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved calculation?')) return;

    try {
      await deleteCalculationRecord(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error deleting calculation.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md h-full glass-card border-l p-6 flex flex-col shadow-2xl transition-all"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl text-cyan-500" style={{ background: 'var(--father-bg)' }}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {isAuthenticated && user ? `${user.name}'s History` : 'Calculation History'}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {isAuthenticated && user ? `${items.length} records saved in your cloud database` : 'Calculations saved in MongoDB'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={loadHistory}
              className="p-2 rounded-lg transition hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Guest Warning / Login Prompt */}
        {!isAuthenticated ? (
          <div className="mt-4 p-3 rounded-xl border text-xs flex items-center justify-between"
            style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Guest Mode:</strong> Sign in to permanently bind your calculations to your user account.
            </span>
            <button
              onClick={() => { onClose(); openAuthModal('login'); }}
              className="font-bold underline shrink-0 ml-2 text-fuchsia-500 hover:opacity-80"
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="mt-3 p-2.5 px-3 rounded-xl border text-xs flex items-center justify-between"
            style={{ background: 'var(--mother-bg)', borderColor: 'var(--mother-border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Logged in as <strong style={{ color: 'var(--mother-mid)' }}>{user?.email}</strong>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#059669' }}>
              Cloud Synced
            </span>
          </div>
        )}

        {/* List Content */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
              Loading calculations...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border text-xs flex items-center space-x-2"
              style={{ color: '#e879f9', background: 'var(--error-bg)', borderColor: 'var(--error-border)' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
              No saved calculations found. Select a date of birth on the dashboard to calculate and store results!
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectCalculation(item.dob);
                  onClose();
                }}
                className="p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-fuchsia-400" />
                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {item.dob}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={
                        item.dominantParent === 'Mother'
                          ? { background: 'var(--mother-bg)', color: 'var(--mother-mid)', borderColor: 'var(--mother-border)' }
                          : { background: 'var(--father-bg)', color: 'var(--father-mid)', borderColor: 'var(--father-border)' }
                      }
                    >
                      {item.dominantParent} Lineage
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition hover:text-rose-500"
                    title="Delete record"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <div>
                    Mother: <strong style={{ color: 'var(--mother-mid)' }}>{item.motherTotal.toFixed(3)}</strong>
                  </div>
                  <div>
                    Father: <strong style={{ color: 'var(--father-mid)' }}>{item.fatherTotal.toFixed(3)}</strong>
                  </div>
                  <div>
                    Total: <strong style={{ color: '#d97706' }}>{item.grandTotal.toFixed(3)}</strong>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t flex items-center justify-between text-[10px]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  <span>Saved on {new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className="font-bold group-hover:translate-x-0.5 transition-transform flex items-center"
                    style={{ color: 'var(--mother-mid)' }}>
                    Load <ArrowRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
