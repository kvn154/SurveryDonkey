import React, { useState, useEffect } from 'react';
import { Question, SurveyResponse, TierItem, TierLevel, GamifiedQuestionData } from '../../types';
import { StorageService } from '../../services/storageService';
import { Star, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';

interface Props {
  surveyId: string;
  questions: Question[];
  gamifiedData?: GamifiedQuestionData[];
  onComplete: (rankings: Record<TierLevel, TierItem[]>, items: TierItem[]) => void;
  onQuit: () => void;
}

const TIERS: { label: TierLevel; color: string; bg: string; border: string; hover: string }[] = [
  { label: 'S', color: 'text-yellow-300', bg: 'bg-yellow-900/10', border: 'border-yellow-500/20', hover: 'hover:bg-yellow-900/30' },
  { label: 'A', color: 'text-red-300', bg: 'bg-red-900/10', border: 'border-red-500/20', hover: 'hover:bg-red-900/30' },
  { label: 'B', color: 'text-orange-300', bg: 'bg-orange-900/10', border: 'border-orange-500/20', hover: 'hover:bg-orange-900/30' },
  { label: 'C', color: 'text-blue-300', bg: 'bg-blue-900/10', border: 'border-blue-500/20', hover: 'hover:bg-blue-900/30' },
  { label: 'D', color: 'text-slate-300', bg: 'bg-slate-800/20', border: 'border-slate-500/20', hover: 'hover:bg-slate-800/40' },
];

export const TopTierRank: React.FC<Props> = ({ surveyId, questions, gamifiedData, onComplete, onQuit }) => {
  
  // 1. Prepare Items derived from Gamified Data OR fallback to raw questions
  const [items, setItems] = useState<TierItem[]>([]);
  const [activePrompt, setActivePrompt] = useState<string>("Rank these items based on your preference");

  useEffect(() => {
    let generatedItems: TierItem[] = [];
    
    if (gamifiedData) {
      // Aggregate all applicable concepts
      gamifiedData.forEach((gData, idx) => {
        if (gData.games.top_tier_rank.applicable) {
          // Use the first prompt found from the first applicable question as the main game title
          if(generatedItems.length === 0 && gData.games.top_tier_rank.derived_questions.length > 0) {
             setActivePrompt(gData.games.top_tier_rank.derived_questions[0]);
          }

          gData.games.top_tier_rank.concepts.forEach((concept, cIdx) => {
            generatedItems.push({
              id: `g_${idx}_${cIdx}`,
              content: concept,
            });
          });
        }
      });
    }

    // Fallback to legacy ranking questions if no gamified data
    if (generatedItems.length === 0) {
      const rankingQuestions = questions.filter(q => q.type === 'RANKING');
      generatedItems = rankingQuestions.flatMap(q => 
        q.options?.map((option, index) => ({
          id: `${q.id}_${index}`,
          content: option,
        })) || []
      );
    }

    setItems(generatedItems);
    setStartTime(Date.now());
  }, [gamifiedData, questions]);

  const [placements, setPlacements] = useState<Record<TierLevel, TierItem[]>>({
    S: [], A: [], B: [], C: [], D: []
  });
  const [startTime, setStartTime] = useState(Date.now());
  const [selectedItem, setSelectedItem] = useState<{ item: TierItem, source: 'pool' | TierLevel } | null>(null);

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

  const handleItemInteraction = (e: React.MouseEvent | React.TouchEvent, item: TierItem, source: 'pool' | TierLevel) => {
    e.stopPropagation();
    if (selectedItem?.item.id === item.id) {
      setSelectedItem(null);
    } else {
      setSelectedItem({ item, source });
    }
  };

  const handleContainerInteraction = (target: 'pool' | TierLevel) => {
    if (selectedItem) {
      moveItem(selectedItem.item, selectedItem.source, target);
      setSelectedItem(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: TierItem, source: 'pool' | TierLevel) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ item, source }));
    e.dataTransfer.effectAllowed = 'move';
    setSelectedItem({ item, source });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, target: 'pool' | TierLevel) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (dataStr) {
      try {
        const { item, source } = JSON.parse(dataStr);
        moveItem(item, source, target);
        setSelectedItem(null);
      } catch (err) { console.error(err); }
    } else if (selectedItem) {
      moveItem(selectedItem.item, selectedItem.source, target);
      setSelectedItem(null);
    }
  };

  const handleNext = () => {
    const currentRankings = Object.entries(placements).reduce((acc, [tier, tierItems]) => {
      acc[tier as TierLevel] = tierItems.map(i => ({
        id: i.id,
        content: i.content,
      }));
      return acc;
    }, {} as Record<TierLevel, TierItem[]>);

    const allRankedItems = Object.values(currentRankings).flat();

    const response: SurveyResponse = {
      id: crypto.randomUUID(),
      surveyId,
      gamePlayed: 'TOP_TIER',
      timestamp: Date.now(),
      answers: {
        rankings: currentRankings,
        items: allRankedItems,
      },
      metadata: {
        duration: (Date.now() - startTime) / 1000,
        playerType: 'REAL',
      }
    };

    StorageService.saveResponse(response);
    onComplete(currentRankings, allRankedItems);
  };

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col font-sans overflow-hidden select-none">
      
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <button onClick={onQuit} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
           </button>
           <div>
             <h2 className="text-lg font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 flex items-center gap-2">
                TOP TIER <Star size={16} className="text-yellow-400 fill-yellow-400" />
             </h2>
           </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden relative">
         
         {/* LEFT: Tiers Area (Target) */}
         <div className="w-[60%] md:w-[65%] h-full overflow-y-auto p-2 space-y-2 border-r border-slate-800 bg-slate-900/50 custom-scrollbar pb-20">
            {TIERS.map((tier) => (
              <div 
                key={tier.label}
                onClick={() => handleContainerInteraction(tier.label)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, tier.label)}
                className={`
                   relative flex rounded-lg border-2 transition-all min-h-[90px] group
                   ${tier.bg} ${tier.border} ${tier.hover}
                   ${selectedItem && selectedItem.source !== tier.label ? 'ring-2 ring-purple-500/40 cursor-pointer' : ''}
                `}
              >
                {selectedItem && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur font-bold">
                      Place Here
                    </span>
                  </div>
                )}

                <div className={`w-10 md:w-16 flex items-center justify-center text-3xl font-black shrink-0 ${tier.color} bg-black/20 rounded-l-sm`}>
                  {tier.label}
                </div>
                
                <div className="flex-1 p-1.5 flex flex-wrap content-start gap-1.5">
                  {placements[tier.label].map(item => (
                    <div 
                      key={item.id}
                      onClick={(e) => handleItemInteraction(e, item, tier.label)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item, tier.label)}
                      className={`
                        text-[10px] md:text-xs font-bold bg-slate-800 shadow-sm px-2 py-1.5 rounded flex items-center gap-1 z-20 cursor-pointer active:scale-95 transition-transform
                        ${selectedItem?.item.id === item.id 
                           ? 'border-2 border-purple-500 ring-2 ring-purple-500/50 text-white' 
                           : 'border border-slate-600 text-slate-200 hover:border-slate-500'
                        }
                      `}
                    >
                       <span className="line-clamp-2 leading-tight">{item.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
         </div>

         {/* RIGHT: Item Pool (Source) */}
         <div 
            onClick={() => handleContainerInteraction('pool')}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'pool')}
            className="w-[40%] md:w-[35%] h-full bg-slate-950 flex flex-col border-l border-slate-800 shadow-2xl z-10"
         >
            <div className="p-3 bg-slate-900 border-b border-slate-800">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Queue</span>
               <p className="text-xs text-slate-300 font-medium leading-tight">{activePrompt}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-24 custom-scrollbar">
               {items.map(item => (
                  <div 
                    key={item.id}
                    onClick={(e) => handleItemInteraction(e, item, 'pool')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item, 'pool')}
                    className={`
                      p-3 rounded-lg border cursor-pointer shadow-sm transition-all active:scale-95 flex flex-col gap-1
                      ${selectedItem?.item.id === item.id 
                        ? 'bg-purple-900/50 border-purple-500 ring-1 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)] z-10' 
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-700'
                      }
                    `}
                  >
                     <div className="flex justify-between items-start">
                       <span className={`text-xs font-bold leading-snug ${selectedItem?.item.id === item.id ? 'text-white' : 'text-slate-200'}`}>
                         {item.content}
                       </span>
                       {selectedItem?.item.id === item.id && <CheckCircle2 size={14} className="text-purple-400 shrink-0" />}
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

            <div className="absolute bottom-0 right-0 w-[40%] md:w-[35%] p-3 bg-slate-900/95 border-t border-slate-800 backdrop-blur z-30">
               <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  disabled={items.length > 0}
                  className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-lg ${
                    items.length === 0 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-[1.02] shadow-green-900/20' 
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                  }`}
                >
                    {items.length === 0 && <ArrowRight size={14} />}
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};