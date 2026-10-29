import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import caseApi from '../api/caseApi';

export default function AccusationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [selectedSuspectId, setSelectedSuspectId] = useState('');
  const [rationale, setRationale] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const response = await caseApi.getCaseById(id);
        if (response.success && response.data) {
          if (response.data.status !== 'in_progress') {
            navigate(`/case/${id}/result`);
            return;
          }
          setCaseData(response.data);
        } else {
          throw new Error('Case file could not be retrieved.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error loading case file.');
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [id, navigate]);

  const handleSubmitAccusation = async () => {
    if (!selectedSuspectId) {
      alert('Please select a prime suspect before convening the indictment.');
      return;
    }

    setShowConfirmModal(false);
    setSubmitting(true);
    setError(null);

    try {
      const response = await caseApi.submitAccusation(id, {
        suspectId: selectedSuspectId,
        rationale: rationale.trim() || undefined,
      });

      if (response.success) {
        navigate(`/case/${id}/result`);
      } else {
        throw new Error(response.message || 'Accusation tribunal failed.');
      }
    } catch (err) {
      console.error('Accusation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit accusation.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto"></div>
        <div className="font-mono text-slate-400 text-sm">Preparing formal indictment proceedings...</div>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
        <Link
          to={`/case/${id}`}
          className="inline-block px-4 py-2 rounded bg-slate-800 text-slate-200 text-sm font-mono"
        >
          Return to Investigation
        </Link>
      </div>
    );
  }

  const selectedSuspect = caseData?.suspects?.find((s) => s.id === selectedSuspectId);

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-8">
      {/* Header & Warning */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Link
            to={`/case/${id}`}
            className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            &larr; Return to Investigation Room
          </Link>
          <span className="text-xs font-mono text-rose-500 font-bold tracking-widest uppercase">
            FINAL INDICTMENT
          </span>
        </div>

        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-700/50 text-rose-200 space-y-1">
          <div className="font-mono font-bold text-xs tracking-wider text-rose-400 uppercase flex items-center gap-2">
            <span>&#9888; CAUTION: IRREVERSIBLE ACTION</span>
          </div>
          <p className="text-xs leading-relaxed text-rose-300/90 font-sans">
            Once you commit your prime accusation, this case file is permanently sealed. The true culprit, motive, and method will be unmasked, and your final detective score will be calculated.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Suspect Selection */}
      <div className="space-y-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-slate-300 font-bold">
          Step 1: Select the Perpetrator
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {caseData?.suspects?.map((suspect) => {
            const isSelected = selectedSuspectId === suspect.id;
            return (
              <label
                key={suspect.id}
                onClick={() => setSelectedSuspectId(suspect.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'bg-rose-950/30 border-rose-500 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="accused"
                  value={suspect.id}
                  checked={isSelected}
                  onChange={() => setSelectedSuspectId(suspect.id)}
                  className="mt-1 accent-rose-500"
                />
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm">{suspect.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{suspect.id}</span>
                  </div>
                  <div className="text-amber-500/80 font-mono text-[11px]">{suspect.role}</div>
                  <p className="text-slate-400 font-sans text-[11px] pt-1 leading-snug">
                    Alibi: {suspect.alibi}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Rationale Input */}
      <div className="space-y-2">
        <h2 className="text-sm font-mono uppercase tracking-wider text-slate-300 font-bold">
          Step 2: Closing Deductive Argument (Optional)
        </h2>
        <textarea
          rows={3}
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Detail the critical clue or contradiction that exposed their guilt..."
          className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-3 text-slate-200 placeholder-slate-500 text-xs font-sans focus:outline-none focus:border-rose-500"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          to={`/case/${id}`}
          className="px-6 py-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 font-mono text-xs font-bold text-center border border-slate-700 transition-colors"
        >
          Cancel & Continue Investigating
        </Link>
        <button
          type="button"
          onClick={() => {
            if (!selectedSuspectId) {
              alert('Please select a suspect first.');
              return;
            }
            setShowConfirmModal(true);
          }}
          disabled={!selectedSuspectId || submitting}
          className="flex-1 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-mono font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-rose-600/30"
        >
          {submitting ? 'Rendering Verdict...' : 'Indict Prime Suspect'}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="text-xs font-mono text-rose-400 font-bold tracking-wider uppercase">
              CONFIRM CHARGE OF GUILT
            </div>
            <h3 className="text-xl font-bold text-slate-100 font-serif">
              Indict {selectedSuspect?.name}?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Are you prepared to stake your detective reputation on this verdict? Once handed down, the solution will be disclosed and your score locked permanently.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                Re-examine Clues
              </button>
              <button
                onClick={handleSubmitAccusation}
                className="px-5 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono tracking-wider"
              >
                Seal Indictment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
