import React, { useState, useEffect } from 'react';
import { Question, SurveyResponse, GamifiedQuestionData } from '../../types';
import { StorageService } from '../../services/storageService';
import { Loader2, Play, UserPlus, X, Send, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface Props {
  surveyId: string;
  questions: Question[];
  gamifiedData?: GamifiedQuestionData[];
  onComplete: () => void;
}

type GamePhase = 'SETUP' | 'ROLE_REVEAL' | 'QUESTION_PHASE' | 'DASHBOARD' | 'VOTING' | 'GAME_OVER' | 'ERROR';

interface Player {
  id: string;
  name: string;
  isImposter: boolean;
}

export const ImposterGame: React.FC<Props> = ({ surveyId, gamifiedData, onComplete }) => {
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
  const [startTime, setStartTime] = useState(0);

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
             type: dq.type as any,
             options: dq.choices_scales || null,
             originalQ: g.original_question
          })));

        if (aggregatedQuestions.length > 0) {
          setGameScenario({
            secretWord: imposterData.secret_word,
            questions: aggregatedQuestions.slice(0, 8) // Limit to 8 questions for game length
          });
          return;
        }
      }
    }
    
    setGameScenario(null);
  }, [gamifiedData]);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newPlayer: Player = { 
      id: `p_${Math.random().toString(36).substring(2, 11)}`, 
      name: newPlayerName.trim(), 
      isImposter: false 
    };
    setPlayers([...players, newPlayer]);
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
      setPhase('ERROR');
      return;
    }
    
    // Assign Imposter
    const imposterIdx = Math.floor(Math.random() * players.length);
    const assignedPlayers = players.map((p, idx) => ({
      ...p,
      isImposter: idx === imposterIdx
    }));
    setPlayers(assignedPlayers);
    setStartTime(Date.now());
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
    const responsesToSave: Omit<SurveyResponse, 'id' | 'timestamp'>[] = [];
    const duration = (Date.now() - startTime) / 1000;

    players.forEach(p => {
      if (p.isImposter) return;
      const playerAnswers: Record<string, any> = {};
      
      gameScenario?.questions.forEach((q, qIdx) => {
          const ans = roundAnswers[qIdx]?.[p.id];
          if (ans) {
            // We save the gamified question text as the key for now
            playerAnswers[q.originalQ || q.text] = ans;
          }
      });

      if (Object.keys(playerAnswers).length > 0) {
        responsesToSave.push({
          surveyId,
          gamePlayed: 'IMPOSTER',
          answers: playerAnswers,
          metadata: {
            duration, 
            playerType: 'REAL',
            isImposter: false
          }
        });
      }
    });

    Promise.all(responsesToSave.map(r => StorageService.saveResponse(r)))
      .catch(err => console.error(err))
      .finally(() => {
        setPhase('GAME_OVER');
      });
  };

  // --- RENDERERS ---

  if (phase === 'ERROR') {
    return (
      <div className="max-w-2xl mx-auto p-12 mt-20 bg-white rounded-xl shadow-2xl text-center border border-slate-200">
        <AlertCircle size={64} className="mx-auto text-red-500 mb-6" />
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Error: Game Data Not Ready</h1>
        <p className="text-slate-500 mb-8">No gamified content available for this survey. Please enable gamification in the Admin panel.</p>
        <Link 
          to="/" 
          className="inline-block bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (phase === 'SETUP') {
    return (
      <div className="max-w-2xl mx-auto p-10 mt-12 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="absolute top-0 right-0 p-6 opacity-5">
           <Users size={120} className="text-imposter-900" />
        </div>
        
        <div className="relative z-10">
           <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase italic">The Imposter</h1>
           <p className="text-slate-500 mb-10 font-bold">Gather the team around this device.</p>
           
           {!gameScenario && (
              <div className="mb-8 bg-red-50 text-red-600 p-5 rounded-2xl border-2 border-red-100 text-sm font-black flex items-center gap-3">
                <AlertCircle size={20} />
                <span>ERROR: Survey hasn't been gamified. Enable gamification in Admin first.</span>
              </div>
           )}

           <div className="mb-10">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Add Player</label>
              <div className="flex gap-3">
                <input 
                   type="text" 
                   value={newPlayerName}
                   onChange={e => setNewPlayerName(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && addPlayer()}
                   className="flex-1 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:border-imposter-500 outline-none bg-slate-50/50 focus:bg-white text-slate-900 font-bold transition-all placeholder:text-slate-300"
                   placeholder="Player name..."
                />
                <button onClick={addPlayer} className="btn-base bg-imposter-600 text-white hover:bg-imposter-700 shadow-lg shadow-imposter-100 border-none">
                  <UserPlus size={20} />
                </button>
              </div>
           </div>
           
           <div className="flex flex-wrap gap-3 mb-10 min-h-[120px] bg-imposter-50/50 p-6 rounded-[2rem] border-2 border-imposter-100 shadow-inner items-center content-center">
              {players.length === 0 && (
                <div className="flex flex-col items-center justify-center w-full text-imposter-300 gap-2">
                  <Users size={32} className="opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Team Empty</p>
                </div>
              )}
              {players.map(p => (
                <div key={p.id} className="bg-white pl-5 pr-2 py-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 animate-in fade-in zoom-in duration-300 hover:border-imposter-500 transition-colors">
                  <span className="font-black text-slate-900 text-sm tracking-tight">{p.name}</span>
                  <button 
                    onClick={() => removePlayer(p.id)} 
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border-none bg-transparent shadow-none"
                  >
                    <X size={16}/>
                  </button>
                </div>
              ))}
           </div>
           
           <button 
             onClick={startGame}
             disabled={players.length < 3 || !gameScenario}
             className="btn-hero w-full bg-slate-900 text-white hover:bg-black flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 border-none"
           >
             <Play fill="currentColor" size={20} /> START GAME
           </button>
        </div>
      </div>
    );
  }

  if (phase === 'ROLE_REVEAL') {
    const player = players[currentPlayerIndex];
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-2xl text-center border border-slate-100">
         <div className="mb-8">
            
         </div>
         
         {!showRole ? (
           <>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">Pass device to</h2>
             <h1 className="text-4xl font-bold text-imposter-600 mb-4">{player.name}</h1>
             <p className="text-slate-500 mb-8">Tap below to reveal your secret identity. Make sure no one else is looking.</p>
             <button 
               onClick={() => setShowRole(true)}
               className="btn-hero w-full bg-slate-800 text-white hover:bg-slate-900 shadow-lg"
             >
               Reveal Identity
             </button>
           </>
         ) : (
           <div className="animate-in zoom-in duration-300">
             <h2 className="text-lg font-bold text-slate-500 mb-4">Your Role</h2>
             {player.isImposter ? (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mb-6">
                   <h1 className="text-3xl font-bold text-red-600 mb-2 uppercase tracking-tighter">Imposter</h1>
                   <p className="text-red-800 font-bold">Blend in. You do NOT know the secret word.</p>
                </div>
             ) : (
                <div className="bg-imposter-50 p-6 rounded-2xl border border-imposter-100 mb-6">
                   <h1 className="text-3xl font-bold text-imposter-600 mb-2 uppercase tracking-tighter">Crewmate</h1>
                   <p className="text-imposter-800 font-bold mb-2">Secret Word:</p>
                   <div className="bg-white px-4 py-2 rounded-lg font-mono text-2xl border border-imposter-200 shadow-inner text-imposter-900">
                     {gameScenario?.secretWord}
                   </div>
                </div>
             )}
             <button 
               onClick={handleNextReveal}
               className="btn-hero w-full bg-imposter-600 text-white hover:bg-imposter-700 shadow-lg"
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
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
           {/* Header */}
           <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-imposter-500 flex items-center justify-center font-bold text-xl text-imposter-900">
                   {player.name[0]}
                 </div>
                  <div>
                     <p className="text-xs text-slate-300 uppercase tracking-widest font-bold">Current Player</p>
                     <p className="text-xl font-bold">{player.name}</p>
                  </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-imposter-400">Q{currentQuestionIdx + 1}/{gameScenario.questions.length}</span>
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
                                                ? 'border-imposter-500 text-imposter-600 shadow-lg scale-110 ring-4 ring-imposter-100' 
                                                : 'border-slate-200 text-slate-500 group-hover:border-imposter-200'
                                            }
                                        `}>
                                            {isSelected ? <CheckCircle2 size={24} fill="currentColor" className="text-white" /> : <span className="font-bold text-lg">{i + 1}</span>}
                                        </div>
                                        <div className={`mt-3 text-xs font-bold text-center leading-tight transition-colors px-1 ${isSelected ? 'text-imposter-700' : 'text-slate-500'}`}>
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
                        className="btn-hero w-full bg-imposter-600 text-white hover:bg-imposter-700 shadow-lg flex items-center justify-center gap-2"
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
                        className="p-4 text-left border-2 border-slate-100 rounded-xl hover:border-imposter-500 hover:bg-imposter-50 transition-all font-medium text-slate-700 group flex items-center justify-between"
                      >
                        {opt}
                        <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-imposter-500 flex items-center justify-center">
                           <div className="w-2.5 h-2.5 rounded-full bg-imposter-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                      className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-imposter-500 outline-none bg-white text-slate-900"
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
                      className="bg-imposter-600 text-white px-6 rounded-xl hover:bg-imposter-700 disabled:opacity-50 transition-colors"
                    >
                      <Send size={20} />
                    </button>
                 </div>
              )}
           </div>
           <p className="text-center text-slate-500 mb-6 text-sm">Pass the device to {player.name}. Don't let others see your answer!</p>
        </div>
      </div>
    );
  }

  if (phase === 'DASHBOARD') {
    const q = gameScenario!.questions[currentQuestionIdx];
    
    return (
      <div className="max-w-4xl mx-auto p-6 mt-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Round Recap</h1>
        <p className="text-slate-500 mb-8">Discuss the answers. Who seems suspicious?</p>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 mb-8">
           <h2 className="text-xl font-bold text-imposter-800 mb-6 border-b border-slate-100 pb-4 italic">"{q.text}"</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {players.map(p => (
                <div key={p.id} className="flex gap-4 items-start">
                   <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 shrink-0">
                      {p.name[0]}
                   </div>
                   <div className="bg-slate-50 p-4 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-slate-200 w-full relative">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">{p.name}</p>
                      <p className="text-lg font-medium text-slate-800 leading-snug">
                        "{roundAnswers[currentQuestionIdx]?.[p.id]}"
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <button 
          onClick={handleNextRound}
          className="btn-hero w-full bg-slate-900 text-white hover:bg-black shadow-lg flex items-center justify-center gap-2"
        >
          {currentQuestionIdx < gameScenario!.questions.length - 1 ? 'Next Question' : 'Proceed to Voting'} <Play size={20} fill="currentColor"/>
        </button>
      </div>
    );
  }

  if (phase === 'VOTING') {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center mt-10">
         <h1 className="text-4xl font-bold text-red-600 mb-4 uppercase tracking-tighter italic text-pretty">Emergency Meeting</h1>
         <p className="text-xl text-slate-600 mb-12 font-bold">Discuss and identify the Imposter!</p>

         <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
            {players.map(p => (
               <div key={p.id} className="bg-white p-6 rounded-xl shadow-md border border-slate-200 opacity-100 transform transition-transform hover:scale-105">
                  <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                     👤
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">{p.name}</h3>
               </div>
            ))}
         </div>

         <button 
           onClick={() => handleVote()}
           className="btn-hero bg-red-600 text-white px-12 hover:bg-red-700 shadow-xl"
         >
           Reveal Truth
         </button>
      </div>
    );
  }

  if (phase === 'GAME_OVER') {
    const imposter = players.find(p => p.isImposter);
    return (
      <div className="max-w-2xl mx-auto p-8 text-center mt-10 bg-white rounded-xl shadow-2xl border border-slate-100">
         <div className="mb-8 animate-in zoom-in duration-500">
            <p className="text-slate-500 uppercase font-bold tracking-widest mb-2 text-sm">The Imposter Was</p>
            <h1 className="text-5xl font-bold text-slate-900 mb-4">{imposter?.name}</h1>
            <div className="text-7xl mb-4">🕵️</div>
         </div>
         
         <div className="bg-imposter-50 p-8 rounded-xl border border-imposter-100 mb-8">
            <h3 className="text-imposter-900 font-bold text-xl mb-2">Game Summary</h3>
            <p className="text-imposter-700">
               Secret Word: <span className="font-bold">{gameScenario?.secretWord}</span>
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-imposter-700 font-medium">
               <CheckCircle2 size={20} /> Survey data securely uploaded from all crewmates.
            </div>
         </div>

         <button onClick={onComplete} className="text-slate-500 hover:text-slate-800 underline font-medium">
            Return to Dashboard
         </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
       <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-imposter-500" size={48} />
          <p className="text-slate-500 font-medium">Loading session...</p>
       </div>
    </div>
  );
};
