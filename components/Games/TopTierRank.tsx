import React, { useState, useEffect, useMemo } from 'react';
import { Question, SurveyResponse, TierItem, TierLevel } from '../../types';
import { StorageService } from '../../services/storageService';
import { Star, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';

interface Props {
  surveyId: string;
  questions: Question[];
  onComplete: (rankings: Record<TierLevel, TierItem[]>, allItems: TierItem[]) => void;
  onQuit: () => void;
}

const TIERS: { label: TierLevel; color: string; bg: string; border: string; hover: string }[] = [
  { label: 'S', color: 'text-yellow-300', bg: 'bg-yellow-900/10', border: 'border-yellow-500/20', hover: 'hover:bg-yellow-900/30' },
  { label: 'A', color: 'text-red-300', bg: 'bg-red-900/10', border: 'border-red-500/20', hover: 'hover:bg-red-900/30' },
  { label: 'B', color: 'text-orange-300', bg: 'bg-orange-900/10', border: 'border-orange-500/20', hover: 'hover:bg-orange-900/30' },
  { label: 'C', color: 'text-blue-300', bg: 'bg-blue-900/10', border: 'border-blue-500/20', hover: 'hover:bg-blue-900/30' },
  { label: 'D', color: 'text-slate-300', bg: 'bg-slate-800/20', border: 'border-slate-500/20', hover: 'hover:bg-slate-800/40' },
];

export const TopTierRank: React.FC<Props> = ({ surveyId, questions, onComplete, onQuit }) => {
  const rankingQuestions = useMemo(() => questions.filter(q => q.type === 'RANKING'), [questions]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [items, setItems] = useState<TierItem[]>([]);
  const [placements, setPlacements] = useState<Record<TierLevel, TierItem[]>>({
    S: [], A: [], B: [], C: [], D: []
  });
  const [startTime, setStartTime] = useState(Date.now());
  const [results, setResults] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (rankingQuestions[currentQIndex]) {
      const q = rankingQuestions[currentQIndex];
      setItems(q.options?.map((opt, idx) => ({ id: `${idx}`, content: opt })) || []);
      setPlacements({ S: [], A: [], B: [], C: [], D: [] });
      setStartTime(Date.now());
    }
  }, [currentQIndex, rankingQuestions]);

  const moveItem = (item: TierItem, fromSource: 'pool' | TierLevel, toTarget: 'pool' | TierLevel) => {
    if (fromSource === toTarget) return;

    // 1. Remove from Source
    if (fromSource === 'pool') {
      setItems(prev => prev.filter(i => i.id !== item.id));
    } else {
      setPlacements(prev => ({
        ...prev,
        [fromSource as TierLevel]: prev[fromSource as TierLevel].filter(i => i.id !== item.id)
      }));
    }

    // 2. Add to Target
    if (toTarget === 'pool') {
       setItems(prev => [...prev, item]);
    } else {
      setPlacements(prev => ({
        ...prev,
        [toTarget as TierLevel]: [...prev[toTarget as TierLevel], item]
      }));
    }
  };

  const handleDragStart = (e: React.DragEvent, item: TierItem, source: 'pool' | TierLevel) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ item, source }));
    e.dataTransfer.effectAllowed = 'move';
    
    // Visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, target: 'pool' | TierLevel) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('text/plain');
    if (!dataStr) return;
    
    try {
      const { item, source } = JSON.parse(dataStr);
      moveItem(item, source, target);
    } catch (err) { 
      console.error("Drop failed", err);
    }
  };

  const handleNext = () => {
    const currentQ = rankingQuestions[currentQIndex];
    
    const currentAnswer = Object.entries(placements).reduce((acc, [tier, items]) => {
      acc[tier] = (items as TierItem[]).map(i => i.content);
      return acc;
    }, {} as Record<string, string[]>);

    const updatedResults = { ...results, [currentQ.id]: currentAnswer };
    setResults(updatedResults);

    if (currentQIndex < rankingQuestions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      const response: Omit<SurveyResponse, 'id' | 'timestamp'> = {
        surveyId,
        gamePlayed: 'TOP_TIER',
        answers: updatedResults,
        metadata: {
          duration: (Date.now() - startTime) / 1000,
          playerType: 'REAL'
        }
      };
      StorageService.saveResponse(response).then(() => {
        onComplete(placements, items.concat(Object.values(placements).flat()));
      }).catch(err => {
        console.error("Save failed", err);
        onComplete(placements, items.concat(Object.values(placements).flat())); 
      });
    }
  };

  if (rankingQuestions.length === 0) {
    return <div className="p-8 text-white">No questions available.</div>;
  }

  const currentQ = rankingQuestions[currentQIndex];

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col font-sans overflow-hidden select-none">
      
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <button onClick={onQuit} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer">
              <ArrowLeft size={20} />
           </button>
           <div>
              <h2 className="text-lg font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 flex items-center gap-2">
                 TOP TIER <Star size={16} className="text-yellow-400 fill-yellow-400" />
              </h2>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-xs font-mono text-purple-300 bg-purple-900/30 px-2 py-1 rounded">
              {currentQIndex + 1} / {rankingQuestions.length}
           </div>
        </div>
      </div>

      {/* Question Text */}
      <div className="flex-none p-4 bg-slate-900 border-b border-slate-800">
         <p className="text-sm md:text-base text-slate-200 font-medium leading-relaxed">{currentQ.text}</p>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden relative">
         
         {/* LEFT: Tiers Area */}
         <div className="w-[60%] md:w-[65%] h-full overflow-y-auto p-2 space-y-2 border-r border-slate-800 bg-slate-900/50 custom-scrollbar pb-20">
            {TIERS.map((tier) => (
              <div 
                key={tier.label}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, tier.label)}
                className={`relative flex rounded-lg border-2 min-h-[90px] ${tier.bg} ${tier.border} ${tier.hover}`}
              >
                {/* Tier Label */}
                <div className={`w-10 md:w-16 flex items-center justify-center text-3xl font-black shrink-0 ${tier.color} bg-black/20 rounded-l-sm`}>
                  {tier.label}
                </div>
                
                {/* Tier Content */}
                <div className="flex-1 p-1.5 flex flex-wrap content-start gap-1.5">
                    {placements[tier.label].map(item => (
                      <div 
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item, tier.label)}
                        onDragEnd={handleDragEnd}
                        className="text-[10px] md:text-xs font-medium bg-slate-800 border border-slate-600 text-slate-200 hover:border-slate-400 shadow-sm px-2 py-1.5 rounded flex items-center gap-1 z-20 cursor-move"
                      >
                         <span className="line-clamp-2 leading-tight">{item.content}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
         </div>

         {/* RIGHT: Item Pool */}
         <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'pool')}
            className="w-[40%] md:w-[35%] h-full bg-slate-950 flex flex-col border-l border-slate-800 shadow-2xl z-10"
         >
            {/* Pool Header */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Queue</span>
               <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">{items.length}</span>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-24 custom-scrollbar">
                {items.map(item => (
                   <div 
                     key={item.id}
                     draggable
                     onDragStart={(e) => handleDragStart(e, item, 'pool')}
                     onDragEnd={handleDragEnd}
                     className="p-3 rounded-lg border border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800 cursor-move shadow-sm flex flex-col gap-1"
                   >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium leading-snug text-slate-300">
                          {item.content}
                        </span>
                      </div>
                   </div>
                ))}
                
                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 opacity-30 text-slate-500">
                     <CheckCircle2 size={32} className="mb-2" />
                     <span className="text-xs">All Ranked</span>
                  </div>
                )}
            </div>

             {/* Bottom Action Bar */}
             <div className="absolute bottom-0 right-0 w-[40%] md:w-[35%] p-3 bg-slate-900/95 border-t border-slate-800 backdrop-blur z-30">
                <button
                   onClick={(e) => { e.stopPropagation(); handleNext(); }}
                   disabled={items.length > 0}
                   className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-lg ${
                     items.length === 0 
                       ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-[1.02] shadow-green-900/20 cursor-pointer active:scale-95' 
                       : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                   }`}
                 >
                    {items.length === 0 ? (currentQIndex < rankingQuestions.length - 1 ? 'Next' : 'Finish') : 'Rank All'} 
                    {items.length === 0 && <ArrowRight size={14} />}
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};
