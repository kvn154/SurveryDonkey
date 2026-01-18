import React, { useState, useEffect } from 'react';
import { Question, SurveyResponse, GamifiedQuestionData, ImposterGameData } from '../../types';
import { StorageService } from '../../services/storageService';
import { Users, Eye, EyeOff, Loader2, Play, UserPlus, X, RefreshCw, Send, CheckCircle2 } from 'lucide-react';

interface Props {
  surveyId: string;
  questions: Question[];
  gamifiedData?: GamifiedQuestionData[];
  onComplete: () => void;
}

type GamePhase = 'SETUP' | 'ROLE_REVEAL' | 'QUESTION_PHASE' | 'DASHBOARD' | 'VOTING' | 'GAME_OVER';

interface Player {
  id: string;
  name: string;
  isImposter: boolean;
}

export const ImposterGame: React.FC<Props> = ({ surveyId, questions, gamifiedData, onComplete }) => {
  // Game State
  const [phase, setPhase] = useState<GamePhase>('SETUP');
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  
  // Flattened Imposter Data for Gameplay
  const [gameScenario, setGameScenario] = useState<{
    secretWord: string;
    questions: {
      text: string;
      type: 'text' | 'scale' | 'multiple_choice';
      options: string[] | null;
      originalQ?: string;
    }[]
  } | null>(null);
  
  // Gameplay State
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [showRole, setShowRole] = useState(false);
  const [roundAnswers, setRoundAnswers] = useState<Record<number, Record<string, string>>>({});
  const [answerText, setAnswerText] = useState('');

  // Prepare Data on Mount
  useEffect(() => {
    if (gamifiedData) {
      // 1. Find a secret word (Use the first applicable one found)
      const validGame = gamifiedData.find(g => g.games.imposter_spyfall.applicable);
      if (validGame) {
        const imposterData = validGame.games.imposter_spyfall;
        
        // 2. Aggregate questions from ALL applicable parts
        const aggregatedQuestions = gamifiedData
          .filter(g => g.games.imposter_spyfall.applicable)
          .flatMap(g => g.games.imposter_spyfall.derived_questions.map(dq => ({
             text: dq.question,
             type: dq.type,
             options: dq.choices_scales,
             originalQ: g.original_question
          })));

        // Shuffle questions or pick first N
        setGameScenario({
          secretWord: imposterData.secret_word,
          questions: aggregatedQuestions.slice(0, 8) // Limit to 8 questions for game length
        });
      }
    }
  }, [gamifiedData]);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    setPlayers([...players, { id: crypto.randomUUID(), name: newPlayerName.trim(), isImposter: false }]);
    setNewPlayerName('');
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const startGame = async () => {
    if (players.length < 3) {
      alert("Need at least 3 players!");
      return;
    }
    
    if(!gameScenario) {
      alert("Game data not ready. Did you run 'AI Gamify' in the dashboard?");
      return;
    }
    
    // Assign Imposter
    const imposterIdx = Math.floor(Math.random() * players.length);
    const assignedPlayers = players.map((p, idx) => ({
      ...p,
      isImposter: idx === imposterIdx
    }));
    setPlayers(assignedPlayers);
    setPhase('ROLE_REVEAL');
    setCurrentPlayerIndex(0);
  };

  const handleNextReveal = () => {
    setShowRole(false);
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else {
      setPhase('QUESTION_PHASE');
      setCurrentPlayerIndex(0);
      setCurrentQuestionIdx(0);
    }
  };

  const submitAnswer = (answer: string) => {
    const player = players[currentPlayerIndex];

    setRoundAnswers(prev => ({
      ...prev,
      [currentQuestionIdx]: {
        ...(prev[currentQuestionIdx] || {}),
        [player.id]: answer
      }
    }));
    
    setAnswerText(''); // Clear input for next player

    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else {
      setPhase('DASHBOARD');
    }
  };

  const handleNextRound = () => {
    if (!gameScenario) return;
    if (currentQuestionIdx < gameScenario.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setCurrentPlayerIndex(0);
      setPhase('QUESTION_PHASE');
    } else {
      setPhase('VOTING');
    }
  };

  const handleVote = () => {
    // Save Data for all NON-IMPOSTERS
    const responsesToSave: SurveyResponse[] = [];
    const timestamp = Date.now();

    players.forEach(p => {
      if (p.isImposter) return;

      const playerAnswers: Record<string, any> = {};
      
      gameScenario?.questions.forEach((q, qIdx) => {
          const ans = roundAnswers[qIdx]?.[p.id];
          // We save the gamified question text as the key for now, 
          // or map back to originalQ if strict analytics needed.
          if (ans) {
            playerAnswers[q.originalQ || q.text] = ans;
          }
      });

      if (Object.keys(playerAnswers).length > 0) {
        responsesToSave.push({
          id: crypto.randomUUID(),
          surveyId,
          gamePlayed: 'IMPOSTER',
          timestamp,
          answers: playerAnswers,
          metadata: {
            duration: 0, 
            playerType: 'REAL',
            isImposter: false
          }
        });
      }
    });

    responsesToSave.forEach(r => StorageService.saveResponse(r));
    setPhase('GAME_OVER');
  };

  // --- RENDERERS ---

  if (phase === 'SETUP') {
    return (
      <div className="max-w-2xl mx-auto p-8 mt-8 bg-white rounded-2xl shadow-xl border border-slate-100">
        <h1 className="text-4xl font-black text-brand-900 mb-2">The Imposter</h1>
        <p className="text-slate-500 mb-8">Gather everyone around this device.</p>
        
        {!gameScenario && (
           <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm">
             Warning: This survey hasn't been gamified yet. Go back to Admin and click "AI Gamify".
           </div>
        )}

        <div className="mb-8">
           <label className="block text-sm font-bold text-slate-700 mb-2">Add Players</label>
           <div className="flex gap-2">
             <input 
                type="text" 
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPlayer()}
                className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none bg-white text-slate-900"
                placeholder="Enter name..."
             />
             <button onClick={addPlayer} className="bg-brand-600 text-white px-6 rounded-lg hover:bg-brand-700">
               <UserPlus />
             </button>
           </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8 min-h-[100px] bg-slate-50 p-4 rounded-xl">
           {players.map(p => (
             <div key={p.id} className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 flex items-center gap-2">
               <span className="font-bold text-slate-700">{p.name}</span>
               <button onClick={() => removePlayer(p.id)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
             </div>
           ))}
        </div>

        <button 
          onClick={startGame}
          disabled={players.length < 3 || !gameScenario}
          className="w-full bg-brand-900 text-white py-4 rounded-xl font-bold text-xl disabled:opacity-50 hover:bg-brand-800 transition-colors flex items-center justify-center gap-2"
        >
          <Play fill="currentColor" /> Start Mission
        </button>
      </div>
    );
  }

  if (phase === 'ROLE_REVEAL') {
    const player = players[currentPlayerIndex];
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-2xl text-center border-4 border-slate-100">
         <div className="mb-8">
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">Confidential</span>
         </div>
         
         {!showRole ? (
           <>
             <h2 className="text-3xl font-bold text-slate-800 mb-2">Pass device to</h2>
             <h1 className="text-5xl font-black text-brand-600 mb-8">{player.name}</h1>
             <p className="text-slate-400 mb-8">Tap below to reveal your secret identity. Make sure no one else is looking.</p>
             <button 
               onClick={() => setShowRole(true)}
               className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-900 shadow-lg"
             >
               Reveal Identity
             </button>
           </>
         ) : (
           <div className="animate-in zoom-in duration-300">
             <h2 className="text-xl font-bold text-slate-500 mb-4">Your Role</h2>
             {player.isImposter ? (
                <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-100 mb-6">
                   <h1 className="text-4xl font-black text-red-600 mb-2">IMPOSTER</h1>
                   <p className="text-red-800">Blend in. You do NOT know the secret word.</p>
                </div>
             ) : (
                <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-100 mb-6">
                   <h1 className="text-4xl font-black text-green-600 mb-2">CREWMATE</h1>
                   <p className="text-green-800 font-medium mb-2">Secret Word:</p>
                   <div className="bg-white px-4 py-2 rounded-lg font-mono text-2xl border border-green-200 shadow-inner">
                     {gameScenario?.secretWord}
                   </div>
                </div>
             )}
             <button 
               onClick={handleNextReveal}
               className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 shadow-lg"
             >
               Got it
             </button>
           </div>
         )}
      </div>
    );
  }

  if (phase === 'QUESTION_PHASE' && gameScenario) {
    const player = players[currentPlayerIndex];
    const q = gameScenario.questions[currentQuestionIdx];
    
    return (
      <div className="max-w-2xl mx-auto p-6 mt-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
           {/* Header */}
           <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center font-bold text-xl">
                   {player.name[0]}
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Current Player</p>
                    <p className="text-xl font-bold">{player.name}</p>
                 </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-brand-400">Q{currentQuestionIdx + 1}/{gameScenario.questions.length}</span>
              </div>
           </div>

           {/* Content */}
           <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-8 leading-relaxed">
                {q.text}
              </h2>

              {q.type === 'scale' && q.options ? (
                 <div className="mt-8">
                    <div className="relative mb-12 px-2">
                         {/* Line */}
                         <div className="absolute left-4 right-4 top-6 h-1 bg-slate-100 rounded-full z-0"></div>
                         
                         <div className="flex justify-between relative z-10">
                            {q.options.map((opt, i) => {
                                const isSelected = answerText === opt;
                                return (
                                    <button 
                                      key={i} 
                                      onClick={() => setAnswerText(opt)}
                                      className="group flex flex-col items-center focus:outline-none flex-1" 
                                    >
                                        <div className={`
                                            w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-200 bg-white
                                            ${isSelected 
                                                ? 'border-brand-500 text-brand-600 shadow-lg scale-110 ring-4 ring-brand-100' 
                                                : 'border-slate-200 text-slate-400 group-hover:border-brand-200'
                                            }
                                        `}>
                                            {isSelected ? <CheckCircle2 size={24} fill="currentColor" className="text-white" /> : <span className="font-bold text-lg">{i + 1}</span>}
                                        </div>
                                        <div className={`mt-3 text-xs font-bold text-center leading-tight transition-colors px-1 ${isSelected ? 'text-brand-700' : 'text-slate-400'}`}>
                                            {opt}
                                        </div>
                                    </button>
                                )
                            })}
                         </div>
                    </div>
                    
                    <button 
                        onClick={() => submitAnswer(answerText)}
                        disabled={!answerText}
                        className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-900/10"
                    >
                        Confirm Selection <Send size={18} />
                    </button>
                 </div>
              ) : q.options && q.options.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                   {q.options.map((opt, i) => (
                     <button 
                       key={i}
                       onClick={() => submitAnswer(opt)}
                       className="p-4 text-left border-2 border-slate-100 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all font-medium text-slate-700 group flex items-center justify-between"
                     >
                       {opt}
                       <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-brand-500 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                     </button>
                   ))}
                </div>
              ) : (
                <div className="flex gap-2">
                   <input 
                     type="text"
                     placeholder="Type your answer..."
                     value={answerText}
                     onChange={(e) => setAnswerText(e.target.value)}
                     className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-brand-500 outline-none bg-white text-slate-900"
                     onKeyDown={(e) => {
                       if(e.key === 'Enter' && answerText.trim()) submitAnswer(answerText);
                     }}
                     id="text-answer-input"
                   />
                   <button 
                     onClick={() => {
                        if(answerText.trim()) submitAnswer(answerText);
                     }}
                     disabled={!answerText.trim()}
                     className="bg-brand-600 text-white px-6 rounded-xl hover:bg-brand-700 disabled:opacity-50"
                   >
                     <Send size={20} />
                   </button>
                </div>
              )}
           </div>
        </div>
        <p className="text-center text-slate-400 mt-6 text-sm">Pass the device to {player.name}. Don't let others see your answer!</p>
      </div>
    );
  }

  if (phase === 'DASHBOARD') {
    const q = gameScenario!.questions[currentQuestionIdx];
    return (
      <div className="max-w-4xl mx-auto p-6 mt-6">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Round Recap</h1>
        <p className="text-slate-500 mb-8">Discuss the answers. Who seems suspicious?</p>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
           <h2 className="text-xl font-bold text-brand-800 mb-6 border-b pb-4">{q.text}</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {players.map(p => (
                <div key={p.id} className="flex gap-4 items-start">
                   <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 shrink-0">
                      {p.name[0]}
                   </div>
                   <div className="bg-slate-50 p-4 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-slate-200 w-full">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">{p.name}</p>
                      <p className="text-lg font-medium text-slate-800">
                        "{roundAnswers[currentQuestionIdx]?.[p.id]}"
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <button 
          onClick={handleNextRound}
          className="w-full bg-black text-white py-4 rounded-xl font-bold text-xl hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2"
        >
          {currentQuestionIdx < gameScenario!.questions.length - 1 ? 'Next Question' : 'Proceed to Voting'} <Play size={20} fill="currentColor"/>
        </button>
      </div>
    );
  }

  if (phase === 'VOTING') {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center mt-10">
         <h1 className="text-4xl font-black text-red-600 mb-4">Emergency Meeting</h1>
         <p className="text-xl text-slate-600 mb-12">Discuss and identify the Imposter!</p>

         <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {players.map(p => (
               <div key={p.id} className="bg-white p-6 rounded-xl shadow-md border border-slate-200 opacity-100">
                  <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                     👤
                  </div>
                  <h3 className="font-bold text-lg">{p.name}</h3>
               </div>
            ))}
         </div>

         <button 
           onClick={() => handleVote()}
           className="bg-red-600 text-white px-12 py-4 rounded-full font-bold text-2xl hover:bg-red-700 shadow-xl transition-transform hover:scale-105"
         >
           Reveal Truth
         </button>
      </div>
    );
  }

  if (phase === 'GAME_OVER') {
    const imposter = players.find(p => p.isImposter);
    return (
      <div className="max-w-2xl mx-auto p-8 text-center mt-10">
         <div className="mb-8 animate-in zoom-in duration-500">
            <p className="text-slate-500 uppercase font-bold tracking-widest mb-2">The Imposter Was</p>
            <h1 className="text-6xl font-black text-slate-900 mb-4">{imposter?.name}</h1>
            <div className="text-8xl mb-4">🕵️</div>
         </div>

         <div className="bg-brand-50 p-8 rounded-2xl border border-brand-100 mb-8">
            <h3 className="text-brand-900 font-bold text-xl mb-2">Mission Debrief</h3>
            <p className="text-brand-700">
               Secret Word: <span className="font-bold">{gameScenario?.secretWord}</span>
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-green-700 font-medium">
               <CheckCircle2 /> Survey data securely uploaded from all crewmates.
            </div>
         </div>

         <button onClick={onComplete} className="text-slate-500 hover:text-slate-800 underline">
            Return to Dashboard
         </button>
      </div>
    );
  }

  return <div>Loading...</div>;
};