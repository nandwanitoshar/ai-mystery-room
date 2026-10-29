import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import caseApi from '../api/caseApi';

const PRESETS = [
  'A priceless Renaissance diamond vanishes from a locked museum display case during an evening gala.',
  'A corporate whistleblower collapses in a private dining car aboard the Midnight Express in the Alps.',
  'An encrypted prototype drive disappears from a high-tech laboratory during an unexpected power blackout.',
  'The wealthy patriarch is found dead in his study during the stormy reading of his updated will.',
];

const LOADING_MESSAGES = [
  'Securing crime scene perimeter tape...',
  'Summoning persons of interest for formal questioning...',
  'Processing forensic dust and digital security logs...',
  'Sealing culprit identity in the evidence vault...',
  'Opening official case dossier...',
];

export default function CreatePage() {
  const navigate = useNavigate();
  const [premise, setPremise] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await caseApi.createCase({
        premise: premise.trim() || undefined,
        difficulty,
      });

      if (response.success && response.data?._id) {
        navigate(`/case/${response.data._id}`);
      } else {
        throw new Error(response.message || 'Failed to synthesize mystery case.');
      }
    } catch (err) {
      console.error('Case generation error:', err);
      const apiMessage = err.response?.data?.message || err.message || 'Unable to connect to investigation server.';
      setError(apiMessage);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <span className="text-amber-500 font-mono text-xs uppercase tracking-widest">
          Bureau Case Intake
        </span>
        <h1 className="text-3xl font-bold text-slate-100 font-serif mt-1">
          Open a New Investigation
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Supply a scenario premise or choose a classic prompt, then select the case complexity.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <span className="text-rose-400 font-bold font-mono">WARNING:</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Premise Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="premise" className="font-mono font-medium text-slate-300">
              Mystery Scenario & Premise
            </label>
            <span className="text-xs text-slate-500 font-mono">
              {premise.length} / 300 chars
            </span>
          </div>
          <textarea
            id="premise"
            rows={3}
            maxLength={300}
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            placeholder="E.g., A rare emerald scarab is stolen from the penthouse safe during a lightning storm..."
            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
          />

          {/* Quick Idea Pills */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-slate-500 font-mono">Or select a quick starter prompt:</span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPremise(preset)}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700/60 transition-colors text-left"
                >
                  {preset.slice(0, 48)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-3">
          <label className="block font-mono font-medium text-slate-300 text-sm">
            Investigation Difficulty
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'easy',
                label: 'Easy',
                suspects: 3,
                clues: 5,
                hints: 2,
                bonus: '+100 pts',
                accent: 'border-emerald-500/40 text-emerald-400',
              },
              {
                id: 'medium',
                label: 'Medium',
                suspects: 4,
                clues: 7,
                hints: 3,
                bonus: '+150 pts',
                accent: 'border-amber-500/40 text-amber-400',
              },
              {
                id: 'hard',
                label: 'Hard',
                suspects: 5,
                clues: 9,
                hints: 3,
                bonus: '+200 pts',
                accent: 'border-rose-500/40 text-rose-400',
              },
            ].map((tier) => (
              <label
                key={tier.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  difficulty === tier.id
                    ? 'bg-slate-900 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-200 text-base">{tier.label}</span>
                  <input
                    type="radio"
                    name="difficulty"
                    value={tier.id}
                    checked={difficulty === tier.id}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="accent-amber-500"
                  />
                </div>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>• {tier.suspects} Suspects</div>
                  <div>• {tier.clues} Evidence Clues</div>
                  <div>• Max {tier.hints} Hints</div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 font-mono text-xs font-bold text-amber-400">
                  {tier.bonus} Correct Bonus
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-base tracking-wider uppercase font-mono transition-all shadow-lg shadow-amber-500/20"
          >
            {loading ? 'Synthesizing Case Dossier...' : 'Synthesize Mystery Case'}
          </button>
        </div>
      </form>

      {/* Atmospheric Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-6"></div>
          <div className="font-mono text-amber-500 text-xs tracking-widest uppercase mb-2 animate-pulse">
            CLASSIFIED DOSSIER IN GENERATION
          </div>
          <h2 className="text-2xl font-bold text-slate-100 font-serif max-w-md">
            {LOADING_MESSAGES[loadingMessageIndex]}
          </h2>
          <p className="text-slate-500 text-xs mt-4 font-mono">
            Compiling suspects, physical evidence, and forensic fingerprints...
          </p>
        </div>
      )}
    </div>
  );
}
