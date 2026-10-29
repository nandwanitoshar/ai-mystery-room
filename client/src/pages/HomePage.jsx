import { Link } from 'react-router-dom';

export default function HomePage() {
  const rules = [
    {
      step: '01',
      title: 'Define the Mystery',
      desc: 'Enter a custom crime premise or select a vintage detective scenario across Easy, Medium, or Hard difficulty.',
    },
    {
      step: '02',
      title: 'Analyze the Dossiers',
      desc: 'Deconstruct suspect backgrounds, verify stated alibis, and uncover hidden motives.',
    },
    {
      step: '03',
      title: 'Uncover Key Clues',
      desc: 'Examine crime scene evidence (+5 pts each). Request confidential hints if you reach a dead end (-10 pts).',
    },
    {
      step: '04',
      title: 'Indict the Culprit',
      desc: 'Convene the tribunal, name the perpetrator, and receive your official detective score and case debrief.',
    },
  ];

  const difficulties = [
    {
      name: 'Easy',
      badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      suspects: 3,
      clues: 5,
      hints: 2,
      bonus: '+100 pts',
    },
    {
      name: 'Medium',
      badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      suspects: 4,
      clues: 7,
      hints: 3,
      bonus: '+150 pts',
    },
    {
      name: 'Hard',
      badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      suspects: 5,
      clues: 9,
      hints: 3,
      bonus: '+200 pts',
    },
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-8 sm:p-12 border border-slate-800 text-center shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono tracking-widest uppercase mb-6">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          AI-Powered Detective Investigation
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-100 max-w-3xl mx-auto leading-tight font-serif">
          Every Crime Leaves a Trace. <br />
          <span className="text-amber-500 italic">Can You Find It?</span>
        </h1>

        <p className="mt-6 text-slate-300 text-lg max-w-2xl mx-auto font-sans leading-relaxed">
          Step into a dark noir investigation room. Examine suspect alibis, catalog hidden physical and forensic clues, request tactical leads, and seal the indictment before your trail goes cold.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/create"
            className="px-8 py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base tracking-wide transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <span>Open New Case File</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* Investigation Rules Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-wide text-slate-200 font-mono uppercase">
            Detective Protocols
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Fair-play deduction rules. All evidence required to unmask the perpetrator is present in the case record.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.step}
              className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl relative hover:border-slate-700 transition-colors"
            >
              <div className="text-amber-500/40 text-4xl font-mono font-bold absolute top-4 right-4">
                {rule.step}
              </div>
              <h3 className="text-lg font-bold text-slate-200 mt-6">{rule.title}</h3>
              <p className="mt-2 text-slate-400 text-sm leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Difficulty Table */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-100 font-mono uppercase">
              Investigation Difficulty Tiers
            </h3>
            <p className="text-slate-400 text-sm">
              Reward bonuses increase with the complexity of suspects and evidence.
            </p>
          </div>
          <Link
            to="/create"
            className="text-amber-400 hover:text-amber-300 text-sm font-mono underline underline-offset-4"
          >
            Launch Investigation &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {difficulties.map((diff) => (
            <div
              key={diff.name}
              className="bg-slate-900 border border-slate-800/80 p-5 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded text-xs font-mono border ${diff.badge}`}>
                  {diff.name}
                </span>
                <span className="font-mono text-amber-400 font-bold text-sm">{diff.bonus}</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                <li>• {diff.suspects} Suspect Dossiers</li>
                <li>• {diff.clues} Evidence Clues (+5 pts each)</li>
                <li>• Max {diff.hints} Detective Hints (-10 pts each)</li>
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
