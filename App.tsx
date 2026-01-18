
import React, { useState, useCallback, useEffect, useRef } from 'react';
import TableGrid from './components/TableGrid';
import Keypad from './components/Keypad';
import { Question, GeminiFeedback, Difficulty } from './types';
import { getGeminiFeedback } from './services/geminiService';
import { soundService } from './services/soundService';

const DEFAULT_DIFFICULTY_CONFIG = {
  easy: { maxRange: 5, timer: 20, color: 'bg-green-500', label: 'Facile (1-5)' },
  medium: { maxRange: 10, timer: 15, color: 'bg-blue-500', label: 'Medio (1-10)' },
  hard: { maxRange: 12, timer: 10, color: 'bg-red-500', label: 'Difficile (1-12)' }
};

interface TableStat {
  correct: number;
  total: number;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'landing' | 'playing' | 'gameover'>('landing');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [customTimers, setCustomTimers] = useState({
    easy: 20,
    medium: 15,
    hard: 10,
  });
  
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [solvedCells, setSolvedCells] = useState<Set<string>>(new Set());
  const [tableStats, setTableStats] = useState<Record<number, TableStat>>({});
  const [feedback, setFeedback] = useState<GeminiFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isHintActive, setIsHintActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerActive, setTimerActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const questionPoolRef = useRef<Question[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('tabelline_highscore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore));
    
    const savedTimers = localStorage.getItem('tabelline_timers');
    if (savedTimers) setCustomTimers(JSON.parse(savedTimers));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('tabelline_highscore', score.toString());
    }
  }, [score, highScore]);

  const generatePool = (diff: Difficulty) => {
    const config = DEFAULT_DIFFICULTY_CONFIG[diff];
    const newPool: Question[] = [];
    for (let a = 1; a <= config.maxRange; a++) {
      for (let b = 1; b <= config.maxRange; b++) {
        newPool.push({ a, b, result: a * b });
      }
    }
    for (let i = newPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newPool[i], newPool[j]] = [newPool[j], newPool[i]];
    }
    return newPool;
  };

  const updateTableStats = (num: number, isCorrect: boolean) => {
    setTableStats(prev => {
      const current = prev[num] || { correct: 0, total: 0 };
      return {
        ...prev,
        [num]: {
          correct: current.correct + (isCorrect ? 1 : 0),
          total: current.total + 1
        }
      };
    });
  };

  const extractNewQuestion = useCallback((targetDifficulty?: Difficulty) => {
    const activeDiff = targetDifficulty || difficulty;
    
    if (questionPoolRef.current.length === 0) {
      const maxCells = Math.pow(DEFAULT_DIFFICULTY_CONFIG[activeDiff].maxRange, 2);
      if (solvedCells.size >= maxCells) {
        setGameState('gameover');
        setTimerActive(false);
        return;
      }
      questionPoolRef.current = generatePool(activeDiff).filter(q => !solvedCells.has(`${q.a}x${q.b}`));
      if (questionPoolRef.current.length === 0) {
        setGameState('gameover');
        setTimerActive(false);
        return;
      }
    }

    const nextQ = questionPoolRef.current.pop() || null;
    
    setCurrentQuestion(nextQ);
    setUserInput('');
    setFeedback(null);
    setIsError(false);
    setIsHintActive(false);
    setTimeLeft(customTimers[activeDiff]);
    setTimerActive(true);
  }, [difficulty, customTimers, solvedCells]);

  const startGame = () => {
    soundService.playClick();
    setGameState('playing');
    setTableStats({});
    setSolvedCells(new Set());
    setCorrectCount(0);
    setWrongCount(0);
    setScore(0);
    setStreak(0);
    questionPoolRef.current = generatePool(difficulty);
    extractNewQuestion(difficulty);
  };

  const handleHint = () => {
    if (isHintActive || !timerActive || score < 5) return;
    soundService.playClick();
    setIsHintActive(true);
    setScore(prev => Math.max(0, prev - 5));
  };

  const changeDifficulty = (newDiff: Difficulty) => {
    if (newDiff === difficulty) return;
    soundService.playClick();
    setDifficulty(newDiff);
    setStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setSolvedCells(new Set());
    setTableStats({});
    questionPoolRef.current = generatePool(newDiff);
    setTimeLeft(customTimers[newDiff]);
    if (gameState === 'playing') extractNewQuestion(newDiff);
  };

  const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseInt(e.target.value);
    const updated = { ...customTimers, [difficulty]: newVal };
    setCustomTimers(updated);
    localStorage.setItem('tabelline_timers', JSON.stringify(updated));
    if (timerActive) setTimeLeft(newVal);
  };

  useEffect(() => {
    if (gameState === 'playing' && timerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 6 && prev > 1) soundService.playTick();
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleTimeout();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft, timerActive, gameState]);

  const handleTimeout = async () => {
    setTimerActive(false);
    soundService.playIncorrect();
    setWrongCount(prev => prev + 1);
    setStreak(0);
    setIsError(true);

    if (!currentQuestion) return;
    updateTableStats(currentQuestion.a, false);
    setIsLoading(true);
    const fb = await getGeminiFeedback(currentQuestion.a, currentQuestion.b, false, "Tempo scaduto");
    setFeedback(fb);
    setIsLoading(false);

    setTimeout(() => extractNewQuestion(), 4000);
  };

  const handleSubmit = async () => {
    if (!currentQuestion || userInput === '' || !timerActive) return;

    setTimerActive(false);
    const numericInput = parseInt(userInput);
    const isCorrect = numericInput === currentQuestion.result;

    updateTableStats(currentQuestion.a, isCorrect);

    if (isCorrect) {
      soundService.playCorrect();
      setCorrectCount(prev => prev + 1);
      setSolvedCells(prev => new Set([...prev, `${currentQuestion.a}x${currentQuestion.b}`]));
      setScore(s => s + 10 + Math.floor(timeLeft / 2));
      setStreak(s => s + 1);
      setIsError(false);
    } else {
      soundService.playIncorrect();
      setWrongCount(prev => prev + 1);
      setStreak(0);
      setIsError(true);
    }

    setIsLoading(true);
    const fb = await getGeminiFeedback(currentQuestion.a, currentQuestion.b, isCorrect, numericInput);
    setFeedback(fb);
    setIsLoading(false);

    setTimeout(() => extractNewQuestion(), isCorrect ? 3000 : 5000);
  };

  if (gameState === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-8 border-blue-100 max-w-lg w-full transform transition-all hover:scale-[1.02]">
          <div className="text-7xl mb-6 animate-float">🎩</div>
          <h1 className="text-4xl font-brand text-blue-600 mb-4">Tabelline Magiche</h1>
          <p className="text-gray-600 mb-8 text-lg">Pronto per un po' di magia matematica? Entra nel regno di Merlino!</p>
          <button 
            onClick={startGame}
            className="w-full py-5 bg-blue-500 hover:bg-blue-600 text-white font-brand text-2xl rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95"
          >
            INIZIA L'AVVENTURA 🚀
          </button>
          <div className="mt-8 pt-8 border-t border-gray-100 flex justify-around text-sm text-gray-400 font-semibold">
            <div>🏆 Record: {highScore}</div>
            <div>🔢 Tabelline 1-12</div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    const sortedStats = (Object.entries(tableStats) as [string, TableStat][]).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 text-center">
        <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border-8 border-green-100 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="text-6xl mb-4 animate-bounce">🏆</div>
          <h1 className="text-3xl md:text-4xl font-brand text-green-600 mb-2">Sei un Campione!</h1>
          <p className="text-gray-600 mb-6 italic">Hai conquistato tutta la tabella!</p>
          
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-green-50 p-4 rounded-3xl text-green-700 shadow-sm border border-green-100">
              <div className="text-2xl md:text-3xl font-brand">{correctCount}</div>
              <div className="text-[10px] uppercase font-black tracking-wider">Risposte Corrette</div>
            </div>
            <div className="bg-red-50 p-4 rounded-3xl text-red-700 shadow-sm border border-red-100">
              <div className="text-2xl md:text-3xl font-brand">{wrongCount}</div>
              <div className="text-[10px] uppercase font-black tracking-wider">Risposte Sbagliate</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-3xl text-yellow-700 shadow-sm border border-yellow-100">
              <div className="text-2xl md:text-3xl font-brand">{score}</div>
              <div className="text-[10px] uppercase font-black tracking-wider">Punti Totali</div>
            </div>
          </div>

          <div className="mb-8 text-left">
            <h3 className="font-brand text-blue-600 mb-6 text-center border-b pb-4 text-xl">Analisi Dettagliata per Tabellina 📊</h3>
            <div className="grid grid-cols-1 gap-4">
              {sortedStats.map(([num, stat]) => {
                const correctPerc = Math.round((stat.correct / stat.total) * 100);
                const wrongPerc = 100 - correctPerc;
                const wrongCountLocal = stat.total - stat.correct;
                
                return (
                  <div key={num} className="bg-white p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between border border-gray-100 shadow-sm hover:shadow-md transition-shadow gap-4">
                    <div className="flex items-center gap-4 w-full md:w-40">
                      <span className="font-brand text-blue-600 text-xl w-14 h-14 flex items-center justify-center bg-blue-50 rounded-2xl shrink-0">×{num}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Tabellina del</span>
                        <span className="font-brand text-gray-700 text-lg">{num}</span>
                      </div>
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest px-1">
                        <span className="text-green-600">Esatte: {correctPerc}%</span>
                        <span className="text-red-500">Errate: {wrongPerc}%</span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                        <div 
                          className="h-full bg-green-500 transition-all duration-1000 ease-out" 
                          style={{ width: `${correctPerc}%` }}
                        ></div>
                        <div 
                          className="h-full bg-red-400 transition-all duration-1000 ease-out" 
                          style={{ width: `${wrongPerc}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-32 justify-center md:justify-end">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-green-600">{stat.correct}</span>
                        <span className="text-[8px] font-black uppercase text-gray-400">SI</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-red-500">{wrongCountLocal}</span>
                        <span className="text-[8px] font-black uppercase text-gray-400">NO</span>
                      </div>
                      <div className="flex flex-col items-center border-l pl-4 border-gray-100">
                        <span className="text-xs font-bold text-gray-700">{stat.total}</span>
                        <span className="text-[8px] font-black uppercase text-gray-400">TOT</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={startGame} 
              className="flex-1 py-5 bg-blue-500 hover:bg-blue-600 text-white font-brand text-xl rounded-[2rem] shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              NUOVA PARTITA 🔄
            </button>
            <button 
              onClick={() => setGameState('landing')} 
              className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-brand text-xl rounded-[2rem] transition-all active:scale-95"
            >
              MENU PRINCIPALE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center">
      <header className="w-full bg-white/80 backdrop-blur-md shadow-sm py-3 px-6 flex flex-col lg:flex-row justify-between items-center sticky top-0 z-50 gap-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => setGameState('landing')} className="text-2xl font-brand text-blue-600 hover:scale-105 transition-transform">🎩 Magiche</button>
          <div className="flex gap-2">
            <button 
              onClick={() => { setSoundEnabled(!soundEnabled); soundService.playClick(); }} 
              className={`p-2 rounded-xl transition-colors ${soundEnabled ? 'text-blue-500 bg-blue-50' : 'text-gray-300 bg-gray-50'}`}
              title={soundEnabled ? 'Disattiva Audio' : 'Attiva Audio'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <button 
              onClick={() => { if(window.confirm("Vuoi ricominciare la partita da zero?")) startGame(); }}
              className="p-2 rounded-xl text-orange-500 bg-orange-50 hover:bg-orange-100 transition-colors"
              title="Ricomincia Partita"
            >
              🔄
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button key={d} onClick={() => changeDifficulty(d)} className={`px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${difficulty === d ? `${DEFAULT_DIFFICULTY_CONFIG[d].color} text-white shadow-sm` : 'text-gray-500 hover:bg-white/50'}`}>
                {d === 'easy' ? '1-5' : d === 'medium' ? '1-10' : '1-12'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Tempo:</span>
            <input type="range" min="3" max="60" value={customTimers[difficulty]} onChange={handleTimerChange} className="w-20 md:w-24 h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            <span className="text-xs font-bold text-blue-600 w-6">{customTimers[difficulty]}s</span>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg font-bold border border-yellow-100 text-xs md:text-sm">⭐ {score}</div>
          <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-lg font-bold border border-orange-100 text-xs md:text-sm">🔥 {streak}</div>
        </div>
      </header>

      <main className="max-w-6xl w-full px-4 mt-8 pb-20 flex flex-col lg:flex-row gap-8 items-start justify-center">
        <section className="flex-1 w-full flex flex-col items-center">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-t-3xl font-brand shadow-lg w-full max-w-[420px] text-center">Tabellone Misterioso 🔍</div>
          <TableGrid highlighted={currentQuestion} solvedCells={solvedCells} maxRange={DEFAULT_DIFFICULTY_CONFIG[difficulty].maxRange} isHintActive={isHintActive} />
          <div className="mt-4 flex gap-6 text-sm font-bold">
            <div className="text-green-600">✅ {correctCount}</div>
            <div className="text-red-500">❌ {wrongCount}</div>
            <div className="text-blue-500">🎯 {solvedCells.size}/{Math.pow(DEFAULT_DIFFICULTY_CONFIG[difficulty].maxRange, 2)}</div>
          </div>
        </section>

        <section className="flex-1 w-full max-w-md mx-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-white ring-1 ring-black/5 relative overflow-hidden">
            <div className="h-2 w-full bg-gray-100">
              <div className={`h-full transition-all duration-1000 ease-linear ${timeLeft > 5 ? 'bg-blue-400' : 'bg-red-400'}`} style={{ width: `${(timeLeft / customTimers[difficulty]) * 100}%` }}></div>
            </div>

            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Domanda</span>
                <span className={`font-brand text-2xl ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-blue-500'}`}>{timeLeft}s</span>
              </div>
              
              <div className="flex items-center justify-center gap-4 text-6xl md:text-7xl font-brand text-gray-800 mb-6">
                <span>{currentQuestion?.a}</span>
                <span className="text-blue-300 text-4xl">×</span>
                <span>{currentQuestion?.b}</span>
                <span className="text-blue-300 text-4xl">=</span>
                <div className={`min-w-[80px] border-b-8 ${isError ? 'border-red-400 text-red-500' : 'border-blue-400 text-blue-600'}`}>{userInput || '?'}</div>
              </div>

              <div className="flex justify-center mb-6">
                 <button onClick={handleHint} disabled={isHintActive || score < 5 || !timerActive} className={`flex items-center gap-2 px-6 py-2 rounded-2xl font-brand transition-all shadow-md active:scale-95 ${isHintActive || score < 5 || !timerActive ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-orange-100 text-orange-600 hover:bg-orange-200 border border-orange-200'}`}>
                  <span className="text-lg">💡</span> Suggerimento (-5⭐)
                </button>
              </div>

              <Keypad onPress={(v) => { if(userInput.length < 3 && timerActive) { soundService.playClick(); setUserInput(prev => prev + v); } }} onClear={() => { soundService.playClick(); setUserInput(''); }} onSubmit={handleSubmit} />
            </div>
          </div>

          <div className={`mt-6 transition-all duration-500 ${feedback ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            {feedback && (
              <div className={`p-6 rounded-3xl shadow-xl border-l-8 ${isError ? 'bg-red-50 border-red-400 text-red-900' : 'bg-green-50 border-green-400 text-green-900'}`}>
                <div className="flex gap-4">
                  <span className="text-4xl shrink-0 animate-bounce">{feedback.emoji}</span>
                  <div>
                    <h4 className="font-brand text-lg mb-1">{isError ? 'Quasi!' : 'Magico!'}</h4>
                    <p className="text-sm opacity-90 leading-relaxed">{feedback.message}</p>
                    {feedback.tip && <div className="mt-3 p-3 bg-white/60 rounded-xl text-xs italic border border-dashed border-gray-200">💡 {feedback.tip}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {isLoading && <div className="mt-6 flex justify-center gap-2 py-4"><div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div><div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.5s]"></div></div>}
        </section>
      </main>
    </div>
  );
};

export default App;
