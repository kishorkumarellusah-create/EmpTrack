import React, { useState } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  Settings, 
  Activity,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface BallEvent {
  type: 'run' | 'wicket' | 'wide' | 'noball';
  value: number;
  label: string;
}

interface MatchState {
  runs: number;
  wickets: number;
  completedOvers: number;
  currentOverBalls: number; // 0 to 5
  recentBalls: BallEvent[];
  history: MatchState[]; // For undo
}

const INITIAL_STATE: MatchState = {
  runs: 0,
  wickets: 0,
  completedOvers: 0,
  currentOverBalls: 0,
  recentBalls: [],
  history: []
};

// --- Components ---
export default function App() {
  const [matchState, setMatchState] = useState<MatchState>(INITIAL_STATE);
  const [teamName, setTeamName] = useState('Home Team');
  const [targetScore, setTargetScore] = useState<number | null>(null);

  // --- Handlers ---
  const handleBall = (event: BallEvent) => {
    setMatchState(prev => {
      // Save current state to history for undo
      const historyState = { ...prev, history: [] }; // Don't nest history infinitely
      
      let newRuns = prev.runs + event.value;
      let newWickets = prev.wickets;
      let newCompletedOvers = prev.completedOvers;
      let newCurrentOverBalls = prev.currentOverBalls;
      
      if (event.type === 'wicket') {
        newWickets += 1;
        newCurrentOverBalls += 1;
      } else if (event.type === 'run') {
        newCurrentOverBalls += 1;
      } else if (event.type === 'wide' || event.type === 'noball') {
        // Extras don't count as legal deliveries
        // Value is usually 1 run penalty + any runs scored
      }

      // Handle over completion
      if (newCurrentOverBalls === 6) {
        newCompletedOvers += 1;
        newCurrentOverBalls = 0;
      }

      // Keep only last 12 balls for recent display
      const newRecentBalls = [...prev.recentBalls, event].slice(-12);

      return {
        runs: newRuns,
        wickets: newWickets,
        completedOvers: newCompletedOvers,
        currentOverBalls: newCurrentOverBalls,
        recentBalls: newRecentBalls,
        history: [...prev.history, historyState]
      };
    });
  };

  const undoLastBall = () => {
    setMatchState(prev => {
      if (prev.history.length === 0) return prev;
      const previousState = prev.history[prev.history.length - 1];
      return {
        ...previousState,
        history: prev.history.slice(0, -1)
      };
    });
  };

  const resetMatch = () => {
    if (confirm('Are you sure you want to reset the match?')) {
      setMatchState(INITIAL_STATE);
    }
  };

  // --- Derived ---
  const oversString = `${matchState.completedOvers}.${matchState.currentOverBalls}`;
  const runRate = matchState.completedOvers === 0 && matchState.currentOverBalls === 0 
    ? '0.00' 
    : (matchState.runs / (matchState.completedOvers + matchState.currentOverBalls / 6)).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">CricScore</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={undoLastBall}
              disabled={matchState.history.length === 0}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              title="Undo Last Ball"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={resetMatch}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-full transition-colors"
              title="Reset Match"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Score Display Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/80 rounded-3xl p-6 border border-slate-700/50 shadow-xl relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <input 
                type="text" 
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="bg-transparent border-none text-emerald-400 font-semibold text-sm focus:ring-0 p-0 m-0 uppercase tracking-wider w-3/4"
              />
              <span className="text-xs font-medium text-slate-400 bg-slate-900/50 px-2 py-1 rounded-md">1st INN</span>
            </div>
            
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-7xl font-black tracking-tighter text-white">
                {matchState.runs}<span className="text-4xl text-slate-400 font-bold">/{matchState.wickets}</span>
              </h2>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-0.5">Overs</p>
                  <p className="font-mono text-xl font-semibold text-slate-200">{oversString}</p>
                </div>
                <div className="w-px h-8 bg-slate-700"></div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-0.5">CRR</p>
                  <p className="font-mono text-xl font-semibold text-slate-200">{runRate}</p>
                </div>
              </div>
              
              {targetScore && (
                <div className="text-right">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-0.5">Target</p>
                  <p className="font-mono text-xl font-semibold text-emerald-400">{targetScore}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Balls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Balls</h3>
            <span className="text-xs text-slate-500 font-mono">This Over: {matchState.currentOverBalls}/6</span>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 min-h-[76px] flex items-center overflow-x-auto gap-2 scrollbar-hide">
            {matchState.recentBalls.length === 0 ? (
              <p className="text-sm text-slate-500 italic w-full text-center">No balls bowled yet</p>
            ) : (
              matchState.recentBalls.map((ball, i) => (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={i}
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm",
                    ball.type === 'wicket' ? "bg-rose-500 text-white" :
                    ball.type === 'run' && ball.value === 4 ? "bg-blue-500 text-white" :
                    ball.type === 'run' && ball.value === 6 ? "bg-emerald-500 text-white" :
                    ball.type === 'wide' || ball.type === 'noball' ? "bg-amber-500 text-white" :
                    ball.value === 0 ? "bg-slate-700 text-slate-300" :
                    "bg-slate-200 text-slate-900"
                  )}
                >
                  {ball.label}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Scoring Controls */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Add Runs</h3>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 6].map((runs) => (
              <button
                key={runs}
                onClick={() => handleBall({ type: 'run', value: runs, label: runs.toString() })}
                className={cn(
                  "h-16 rounded-2xl font-bold text-xl transition-all active:scale-95",
                  runs === 4 ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30" :
                  runs === 6 ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30" :
                  runs === 0 ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700" :
                  "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                )}
              >
                {runs}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => handleBall({ type: 'wide', value: 1, label: 'Wd' })}
              className="h-14 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl font-bold text-sm transition-all active:scale-95"
            >
              Wide
            </button>
            <button
              onClick={() => handleBall({ type: 'noball', value: 1, label: 'NB' })}
              className="h-14 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl font-bold text-sm transition-all active:scale-95"
            >
              No Ball
            </button>
            <button
              onClick={() => handleBall({ type: 'wicket', value: 0, label: 'W' })}
              className="h-14 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl font-bold text-sm transition-all active:scale-95"
            >
              Wicket
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
