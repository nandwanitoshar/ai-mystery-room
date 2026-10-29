import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import caseApi from '../api/caseApi';

export default function InvestigationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('suspects'); // 'suspects' | 'clues' | 'hints'
  const [discoveringClueId, setDiscoveringClueId] = useState(null);
  const [requestingHint, setRequestingHint] = useState(false);
  const [showHintConfirm, setShowHintConfirm] = useState(false);

  // Fetch case data
  const loadCase = async () => {
    try {
      const response = await caseApi.getCaseById(id);
      if (response.success && response.data) {
        setCaseData(response.data);
        // If already completed, redirect to results
        if (response.data.status !== 'in_progress') {
          navigate(`/case/${id}/result`);
        }
      } else {
        throw new Error(response.message || 'Case file not found.');
      }
    } catch (err) {
      console.error('Failed to load case:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load case data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [id]);

  // Discover clue handler
  const handleDiscoverClue = async (clueId) => {
    setDiscoveringClueId(clueId);
    try {
      const response = await caseApi.discoverClue(id, clueId);
      if (response.success) {
        // Refresh case data
        await loadCase();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to examine clue.');
    } finally {
      setDiscoveringClueId(null);
    }
  };

  // Request hint handler
  const handleRequestHint = async () => {
    setShowHintConfirm(false);
    setRequestingHint(true);
    try {
      const response = await caseApi.requestHint(id);
      if (response.success) {
        await loadCase();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request hint.');
    } finally {
      setRequestingHint(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
        <div className="font-mono text-slate-400 text-sm">Retrieving classified case file...</div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error || 'Unable to open case dossier.'}
        </div>
        <Link
          to="/create"
          className="inline-block px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-mono"
        >
          Return to Case Intake
        </Link>
      </div>
    );
  }

  const discoveredCount = caseData.discoveredClueIds?.length || 0;
  const totalClues = caseData.clues?.length || 0;
  const hintsUsed = caseData.revealedHints?.length || 0;
  const maxHints = caseData.maxHints || 2;
  const canRequestHint = hintsUsed < maxHints;

  return (
    <div className="space-y-6 py-2">
      {/* Investigation Dossier Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                ACTIVE CASE FILE
              </span>
              <span className="text-xs font-mono uppercase text-slate-400">
                Difficulty: <strong className="text-slate-200">{caseData.difficulty}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-100 mt-1">
              {caseData.title}
            </h1>
          </div>

          <Link
            to={`/case/${id}/accuse`}
            className="px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
          >
            <span>Convene Tribunal</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* Premise & Crime Scene Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono pt-1">
          <div className="md:col-span-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <span className="text-slate-500 uppercase tracking-widest text-[10px] block">
              Crime Scene & Incident Brief
            </span>
            <p className="text-slate-200 text-sm font-sans leading-relaxed">
              {caseData.crimeSceneSummary}
            </p>
          </div>

          {/* Quick Stats Ledger */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-around gap-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Evidence Found:</span>
              <span data-testid="evidence-counter" className="text-amber-400 font-bold">
                {discoveredCount} / {totalClues} (+{discoveredCount * 5} pts)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Hints Revealed:</span>
              <span data-testid="hints-counter" className="text-slate-300 font-bold">
                {hintsUsed} / {maxHints} (-{hintsUsed * 10} pts)
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-800/80 pt-1 text-[11px] text-slate-400">
              <span>Status:</span>
              <span className="text-amber-400">In Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 text-sm font-mono">
        <button
          data-testid="tab-suspects"
          onClick={() => setActiveTab('suspects')}
          className={`px-5 py-3 border-b-2 font-medium transition-colors ${
            activeTab === 'suspects'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Persons of Interest ({caseData.suspects?.length || 0})
        </button>
        <button
          data-testid="tab-clues"
          onClick={() => setActiveTab('clues')}
          className={`px-5 py-3 border-b-2 font-medium transition-colors ${
            activeTab === 'clues'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Evidence Locker ({discoveredCount} / {totalClues})
        </button>
        <button
          data-testid="tab-hints"
          onClick={() => setActiveTab('hints')}
          className={`px-5 py-3 border-b-2 font-medium transition-colors ${
            activeTab === 'hints'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Detective Notebook ({hintsUsed} / {maxHints})
        </button>
      </div>

      {/* Tab 1: Suspects */}
      {activeTab === 'suspects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {caseData.suspects?.map((suspect, idx) => (
            <div
              key={suspect.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-amber-400 text-sm">
                    {suspect.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{suspect.name}</h3>
                    <span className="text-xs font-mono text-amber-500/80">{suspect.role}</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {suspect.id}
                </span>
              </div>

              <div className="space-y-2 text-xs font-sans">
                <div className="text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 font-mono text-[10px] block uppercase mb-1">Background</span>
                  {suspect.bio}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 space-y-1">
                    <span className="text-slate-500 text-[10px] block uppercase">Stated Alibi</span>
                    <p className="text-slate-300 text-xs font-sans">{suspect.alibi}</p>
                  </div>
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 space-y-1">
                    <span className="text-slate-500 text-[10px] block uppercase">Suspected Motive</span>
                    <p className="text-slate-300 text-xs font-sans">{suspect.potentialMotive}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Clues & Evidence Locker */}
      {activeTab === 'clues' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 px-1">
            <span>Examine uncataloged evidence to reveal forensic observations (+5 pts each).</span>
            <span>{discoveredCount} of {totalClues} uncovered</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {caseData.clues?.map((clue) => (
              <div
                key={clue.id}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                  clue.isDiscovered
                    ? 'bg-slate-900 border-slate-700/80 shadow-md shadow-amber-500/5'
                    : 'bg-slate-950 border-slate-800/70 border-dashed text-slate-500'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${
                        clue.isDiscovered
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      {clue.type} evidence
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{clue.id}</span>
                  </div>

                  <h4 className="font-bold text-slate-100 text-sm">{clue.title}</h4>

                  <div className="text-xs font-mono text-slate-400">
                    Location: <span className="text-slate-200">{clue.locationFound}</span>
                  </div>

                  {clue.isDiscovered ? (
                    <div className="pt-2 text-xs text-slate-300 leading-relaxed font-sans border-t border-slate-800/80">
                      {clue.description}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-500 font-mono">
                      [ SEALED EVIDENCE LOCKER ]
                    </div>
                  )}
                </div>

                {!clue.isDiscovered && (
                  <button
                    onClick={() => handleDiscoverClue(clue.id)}
                    disabled={discoveringClueId === clue.id}
                    className="mt-4 w-full py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold transition-all"
                  >
                    {discoveringClueId === clue.id ? 'Examining...' : 'Examine Clue (+5 pts)'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Detective Hints Notebook */}
      {activeTab === 'hints' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Hint Action Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-200 text-base">Senior Detective Consultation</h3>
              <p className="text-xs text-slate-400 mt-1">
                Request confidential advice on contradictions. Each hint used deducts 10 points.
              </p>
            </div>
            <button
              data-testid="btn-request-hint"
              onClick={() => setShowHintConfirm(true)}
              disabled={!canRequestHint || requestingHint}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider transition-all whitespace-nowrap"
            >
              {canRequestHint ? 'Request Hint (-10 pts)' : 'Max Hints Reached'}
            </button>
          </div>

          {/* Hint Confirmation Modal */}
          {showHintConfirm && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                <h4 className="text-lg font-bold text-slate-100 font-serif">Consult Senior Detective?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Revealing this hint will permanently deduct <strong className="text-rose-400">10 points</strong> from your final investigation score.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowHintConfirm(false)}
                    className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    data-testid="btn-confirm-hint"
                    onClick={handleRequestHint}
                    className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono"
                  >
                    Confirm & Unlock (-10 pts)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List of Revealed Hints */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Revealed Case Leads ({hintsUsed} of {maxHints})
            </span>

            {hintsUsed === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-slate-800/80 rounded-xl bg-slate-950/40 text-xs font-mono">
                No hints have been requested yet. Use deductive reasoning to preserve your score!
              </div>
            ) : (
              caseData.revealedHints?.map((hint) => (
                <div
                  key={hint.id}
                  className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 space-y-1.5 shadow-md"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-amber-500">
                    <span>CASE LEAD #{hint.order}</span>
                    <span>{hint.id}</span>
                  </div>
                  <p className="text-slate-200 text-sm font-sans">{hint.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
