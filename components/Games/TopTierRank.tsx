import React, { useState, useEffect } from 'react';
import { SurveyResponse, TierItem, TierLevel, GamifiedQuestionData } from '../../types';
import { StorageService } from '../../services/storageService';
import { Star, ArrowRight, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface Props {
  surveyId: string;
  gamifiedData?: GamifiedQuestionData[];
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

export const TopTierRank: React.FC<Props> = ({ surveyId, gamifiedData, onComplete, onQuit }) => {
  const [items, setItems] = useState<TierItem[]>([]);
  const [placements, setPlacements] = useState<Record<TierLevel, TierItem[]>>({
    S: [], A: [], B: [], C: [], D: []
  });
  const [startTime, setStartTime] = useState(Date.now());
  const [activePrompt, setActivePrompt] = useState<string>("Rank these items based on your preference");
  const [hasError, setHasError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ item: TierItem, source: 'pool' | TierLevel } | null>(null);

  useEffect(() => {
    if (gamifiedData && gamifiedData.length > 0) {
      const validGames = gamifiedData.filter(g => g.games.top_tier_rank.applicable);
      
      if (validGames.length > 0) {
        // Use the first prompt found from the first applicable question as the main game title
        const foundPrompt = validGames[0].games.top_tier_rank.derived_questions[0] || "Rank these items by preference";
        
        const generatedItems: TierItem[] = validGames.flatMap((gData, idx) => 
          gData.games.top_tier_rank.concepts.map((concept, cIdx) => ({
            id: `g_${idx}_${cIdx}`,
            content: concept,
          }))
        );

        if (generatedItems.length > 0) {
          setItems(generatedItems);
          setActivePrompt(foundPrompt);
          setPlacements({ S: [], A: [], B: [], C: [], D: [] });
          setStartTime(Date.now());
          setHasError(false);
          return;
        }
      }
    }

    setHasError(true);
  }, [gamifiedData]);

  const moveItem = (item: TierItem, fromSource: 'pool' | TierLevel, toTarget: 'pool' | TierLevel) => {
    if (fromSource === toTarget) return;

    if (fromSource === 'pool') {
      setItems(prev => prev.filter(i => i.id !== item.id));
    } else {
      setPlacements(prev => ({
        ...prev,
        [fromSource as TierLevel]: prev[fromSource as TierLevel].filter(i => i.id !== item.id)
      }));
    }

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
      acc[tier] = (tierItems as TierItem[]).map(i => i.content);
      return acc;
    }, {} as Record<string, string[]>);

    const allRankedItems = Object.values(placements).flat();

    const response: Omit<SurveyResponse, 'id' | 'timestamp'> = {
        surveyId,
        gamePlayed: 'TOP_TIER',
        answers: { gamified_rankings: currentRankings },
        metadata: {
          duration: (Date.now() - startTime) / 1000,
          playerType: 'REAL'
        }
      };
      
      StorageService.saveResponse(response).then(() => {
        onComplete(placements, items.concat(allRankedItems));
      }).catch(err => {
        console.error("Save failed", err);
        onComplete(placements, items.concat(allRankedItems)); 
      });
  };

  if (hasError) {
    return (
      <div className="h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
        <AlertCircle size={64} className="text-red-500 mb-6" />
        <h1 className="text-3xl font-bold mb-4 uppercase tracking-tighter italic text-red-500">Error: Game Data Not Ready</h1>
        <p className="text-slate-400 text-center max-w-md mb-8">No gamified content available for Top Tier Rank. Please ensure gamification is enabled in Admin.</p>
        <Link 
          to="/" 
          className="bg-white text-slate-950 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-lg shadow-white/10"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

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
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, tier.label)}
                onClick={() => handleContainerInteraction(tier.label)}
                className={`
                   relative flex rounded-lg border-2 transition-all min-h-[90px] group
                   ${tier.bg} ${tier.border} ${tier.hover}
                   ${selectedItem && selectedItem.source !== tier.label ? 'ring-2 ring-purple-500/40 cursor-pointer' : ''}
                `}
              >
                <div className={`w-10 md:w-16 flex items-center justify-center text-3xl font-black shrink-0 ${tier.color} bg-black/20 rounded-l-sm`}>
                  {tier.label}
                </div>
                
                {selectedItem && selectedItem.source !== tier.label && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur font-bold uppercase tracking-widest border border-white/20">
                      Place Here
                    </span>
                  </div>
                )}

                <div className="flex-1 p-1.5 flex flex-wrap content-start gap-1.5 relative z-20">
                  {placements[tier.label].map(item => (
                    <div 
                      key={item.id}
                      onClick={(e) => handleItemInteraction(e, item, tier.label)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item, tier.label)}
                      className={`
                        text-[10px] md:text-xs font-bold bg-slate-800 shadow-sm px-2 py-1.5 rounded flex items-center gap-1 transition-transform active:scale-95 cursor-pointer
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
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'pool')}
            onClick={() => handleContainerInteraction('pool')}
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
                   {items.length === 0 ? 'Finish' : 'Rank All'} 
                   {items.length === 0 && <ArrowRight size={14} />}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};
