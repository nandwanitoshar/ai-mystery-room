import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import caseApi from '../api/caseApi';

export default function ResultsPage() {
  const { id } = useParams();

  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await caseApi.getCaseResult(id);
        if (response.success && response.data) {
          setResultData(response.data);
        } else {
          throw new Error(response.message || 'Results could not be retrieved.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to retrieve case verdict.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
        <div className="font-mono text-slate-400 text-sm">Unsealing verdict and forensic debrief...</div>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error || 'Unable to display verdict.'}
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

  const { isCorrect, score, solution, accusedSuspect, title, difficulty, playerRationale } = resultData;
  const breakdown = score?.breakdown || { bonus: 0, cluesBonus: 0, hintsPenalty: 0 };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-8">
      {/* Verdict Seal Banner */}
      <div
        className={`rounded-2xl p-8 border text-center shadow-2xl relative overflow-hidden ${
          isCorrect
            ? 'bg-gradient-to-b from-emerald-950/60 to-slate-900 border-emerald-500/40 shadow-emerald-950/30'
            : 'bg-gradient-to-b from-rose-950/60 to-slate-900 border-rose-500/40 shadow-rose-950/30'
        }`}
      >
        <div className="inline-block px-4 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase mb-4 border border-current">
          {isCorrect ? 'CASE CLOSED • GUILTY VERDICT' : 'COLD CASE • WRONG SUSPECT ACCUSED'}
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-slate-100 tracking-tight">
          {isCorrect ? 'Justice Prevails' : 'The Trail Went Cold'}
        </h1>

        <p className="mt-3 text-slate-300 text-sm max-w-lg mx-auto font-sans leading-relaxed">
          {isCorrect
            ? `Your indictment of ${accusedSuspect?.name || 'the suspect'} was corroborated by the forensic record.`
            : `You indicted ${accusedSuspect?.name || 'the suspect'}, but the true perpetrator slipped through.`}
        </p>

        {/* Big Score Stamp */}
        <div className="mt-6 inline-flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/80 border border-slate-800 min-w-[180px]">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            Final Detective Score
          </span>
          <span
            className={`text-4xl sm:text-5xl font-bold font-mono ${
              isCorrect ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            {score?.total || 0}
          </span>
          <span className="text-[10px] font-mono text-slate-500 mt-1">PTS EARNED</span>
        </div>
      </div>

      {/* Itemized Score Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold border-b border-slate-800 pb-2">
          Investigation Score Ledger
        </h3>

        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between items-center text-slate-300">
            <span>Accusation Accuracy Bonus ({difficulty}):</span>
            <span className={isCorrect ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              +{breakdown.bonus} pts
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span>Evidence Clues Discovered:</span>
            <span className="text-amber-400">+{breakdown.cluesBonus} pts</span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span>Tactical Hints Penalty:</span>
            <span className="text-rose-400">-{breakdown.hintsPenalty} pts</span>
          </div>

          <div className="flex justify-between items-center text-slate-100 font-bold text-base border-t border-slate-800 pt-3">
            <span>Total Tally:</span>
            <span className="text-amber-400">{score?.total || 0} pts</span>
          </div>
        </div>
      </div>

      {/* The Solution & Debrief */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-3 flex justify-between items-baseline">
          <h2 className="text-xl font-bold font-serif text-slate-100">
            The Truth Revealed
          </h2>
          <span className="text-xs font-mono text-amber-500">Official Case Debrief</span>
        </div>

        {/* Culprit Card */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wider">
              IDENTIFIED PERPETRATOR
            </span>
            <span className="text-xs font-mono text-slate-500">{solution?.culpritId}</span>
          </div>
          <div className="text-xl font-bold text-slate-100 font-serif">
            {solution?.culpritName}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans pt-2 border-t border-slate-800">
            <div>
              <span className="text-slate-500 font-mono text-[10px] block uppercase">Motive</span>
              <p className="text-slate-300 mt-0.5">{solution?.motive}</p>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] block uppercase">Method</span>
              <p className="text-slate-300 mt-0.5">{solution?.method}</p>
            </div>
          </div>
        </div>

        {/* Comprehensive Forensic Narrative */}
        <div className="space-y-2 text-sm">
          <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
            Forensic Reconstruction & Deduction
          </h4>
          <p className="text-slate-300 font-sans leading-relaxed text-sm bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            {solution?.explanation}
          </p>
        </div>

        {/* Player Rationale if provided */}
        {playerRationale && (
          <div className="space-y-1 text-xs">
            <span className="font-mono text-slate-500 uppercase tracking-wider block text-[10px]">
              Your Closing Argument
            </span>
            <p className="italic text-slate-400 bg-slate-950/30 p-3 rounded-lg border border-slate-800/60 font-sans">
              "{playerRationale}"
            </p>
          </div>
        )}
      </div>

      {/* Navigation CTA */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Link
          to="/"
          className="flex-1 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono font-bold text-xs uppercase tracking-wider text-center border border-slate-800 transition-colors"
        >
          Return to Bureau Main
        </Link>
        <Link
          to="/create"
          className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-sm uppercase tracking-wider text-center transition-all shadow-lg shadow-amber-500/20"
        >
          Investigate Another Mystery &rarr;
        </Link>
      </div>
    </div>
  );
}
