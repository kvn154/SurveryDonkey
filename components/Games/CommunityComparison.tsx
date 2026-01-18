// CommunityComparison.tsx
import React, { useState, useEffect } from 'react';
import { TierItem, TierLevel } from '../../types';
import { StorageService } from '../../services/storageService';
import { Users, XCircle, TrendingUp, Trophy, ArrowLeft, Share2, Loader2 } from 'lucide-react';

interface CommunityRanking {
  tier: TierLevel;
  items: TierItem[];
  percentage: number; // Percentage of community that placed item here
}

interface ComparisonProps {
  surveyId: string;
  userRankings: Record<TierLevel, TierItem[]>;
  allItems: TierItem[];
  onBack?: () => void;
  onShare?: () => void;
}

const TIERS: { label: TierLevel; color: string; bg: string; border: string }[] = [
  { label: 'S', color: 'text-yellow-300', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30' },
  { label: 'A', color: 'text-red-300', bg: 'bg-red-900/20', border: 'border-red-500/30' },
  { label: 'B', color: 'text-orange-300', bg: 'bg-orange-900/20', border: 'border-orange-500/30' },
  { label: 'C', color: 'text-blue-300', bg: 'bg-blue-900/20', border: 'border-blue-500/30' },
  { label: 'D', color: 'text-slate-300', bg: 'bg-slate-800/30', border: 'border-slate-600/30' },
];

export const CommunityComparison: React.FC<ComparisonProps> = ({
  surveyId,
  userRankings,
  allItems,
  onBack,
  onShare,
}) => {
  const [communityData, setCommunityData] = useState<CommunityRanking[]>([]);
  const [agreementScore, setAgreementScore] = useState<number>(0);
  const [surprisingItems, setSurprisingItems] = useState<{ item: TierItem, userTier: TierLevel, communityTier: TierLevel }[]>([]);
  const [perfectMatches, setPerfectMatches] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsensus = async () => {
      try {
        const data = await StorageService.getConsensus(surveyId);
        setCommunityData(data);
      } catch (err) {
        console.error('Failed to fetch consensus:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConsensus();
  }, [surveyId]);

  useEffect(() => {
    if (communityData.length > 0) {
      calculateComparison();
    }
  }, [userRankings, communityData]);


  const calculateComparison = () => {
    let weightedPoints = 0;
    let perfectMatchCount = 0;
    let totalCompared = 0;
    const surprises: { item: TierItem, userTier: TierLevel, communityTier: TierLevel }[] = [];
    const tierOrder: TierLevel[] = ['S', 'A', 'B', 'C', 'D'];

    // Compare each item
    allItems.forEach(item => {
      const userTier = findItemTier(item, userRankings);
      const communityTier = findItemTier(item, communityData);
      
      if (userTier && communityTier) {
        totalCompared++;
        
        const userIndex = tierOrder.indexOf(userTier);
        const communityIndex = tierOrder.indexOf(communityTier);
        const distance = Math.abs(userIndex - communityIndex);

        if (distance === 0) {
          weightedPoints += 1;
          perfectMatchCount++;
        } else if (distance === 1) {
          weightedPoints += 0.5; // Partial credit for being 1 tier away
        } else if (distance >= 2) {
          surprises.push({ item, userTier, communityTier });
        }
      }
    });

    const score = totalCompared > 0 ? Math.round((weightedPoints / totalCompared) * 100) : 0;
    setAgreementScore(score);
    setSurprisingItems(surprises);
    setPerfectMatches(perfectMatchCount);
  };

  const findItemTier = (targetItem: TierItem, rankings: any): TierLevel | null => {
    // Handle array structure (CommunityData)
    if (Array.isArray(rankings)) {
      const tierMatch = rankings.find(r => 
        r.items.some((item: TierItem) => item.content === targetItem.content)
      );
      return tierMatch ? tierMatch.tier : null;
    }

    // Handle object structure (UserRankings)
    for (const tier of TIERS) {
      const tierItems = rankings[tier.label] || [];
      if (tierItems.some((item: TierItem) => item.content === targetItem.content)) {
        return tier.label as TierLevel;
      }
    }
    return null;
  };

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    const text = `I just ranked items in this survey! My agreement score with the community is ${agreementScore}% with ${perfectMatches} perfect matches. Check it out!`;
    const url = window.location.href;
    const shareText = `${text}\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Top Tier Rankings',
          text: shareText,
          url,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(shareText);
          alert('Results copied to clipboard!');
        } catch (err) {
          console.error('Failed to copy', err);
          fallbackCopyTextToClipboard(shareText);
        }
      } else {
        fallbackCopyTextToClipboard(shareText);
      }
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      alert('Results copied to clipboard!');
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const getTierColor = (tier: TierLevel) => {
    const tierConfig = TIERS.find(t => t.label === tier);
    return tierConfig?.color || 'text-slate-300';
  };

  const getTierBg = (tier: TierLevel) => {
    const tierConfig = TIERS.find(t => t.label === tier);
    return tierConfig?.bg || 'bg-slate-800/20';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  if (communityData.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl">
           <Trophy size={64} className="text-yellow-500/50 mx-auto mb-6" />
           <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter italic">First to Rank!</h2>
           <p className="text-slate-400 max-w-md font-medium">
             You're the first person to complete this survey. Check back later to see how your rankings compare with others!
           </p>
           <button 
             onClick={onBack}
             className="btn-lg mt-8 bg-slate-800 hover:bg-slate-700 text-white"
           >
             Back to Ranking
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 selection:bg-purple-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
           <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="btn-sm flex items-center justify-center text-slate-500 hover:text-white bg-slate-900 border border-slate-800 shadow-inner"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                 <h1 className="text-2xl font-bold tracking-tight">Community Consensus</h1>
              </div>
           </div>
           
           <button
             onClick={handleShare}
             className="btn-base flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-800/20 active:scale-95 transition-all font-semibold"
           >
             <Share2 size={18} />
             <span>Share Rankings</span>
           </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Comparison Panels */}
          <div className="lg:col-span-8 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Your Rankings */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6 shadow-xl">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded bg-brand-500 flex items-center justify-center text-brand-900 font-bold text-xs shadow-lg">
                        YOU
                      </div>
                      <h2 className="text-lg font-bold uppercase tracking-tight italic">Your Perspective</h2>
                   </div>
                   
                   <div className="space-y-4">
                      {TIERS.map(tier => (
                         <div key={tier.label}>
                            <div className={`flex items-center justify-between mb-2 p-2 rounded-md ${getTierBg(tier.label as TierLevel)} border border-white/5`}>
                               <span className={`font-bold text-sm ${getTierColor(tier.label as TierLevel)}`}>
                                 {tier.label} TIER
                               </span>
                               <span className="text-slate-500 text-[10px] font-bold">
                                 {userRankings[tier.label as TierLevel]?.length || 0} ITEMS
                               </span>
                            </div>
                            <div className="flex flex-col gap-1.5 pl-2">
                               {userRankings[tier.label as TierLevel]?.map(item => (
                                  <div key={item.id} className="bg-slate-800/40 p-2 rounded border border-slate-700/50">
                                     <span className="text-slate-300 text-xs font-medium">{item.content}</span>
                                  </div>
                               ))}
                               {(!userRankings[tier.label as TierLevel] || userRankings[tier.label as TierLevel].length === 0) && (
                                  <div className="text-slate-600 italic text-[10px] p-2">Empty tier</div>
                               )}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Community Rankings */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6 shadow-xl">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shadow-lg">
                        <Users size={16} />
                      </div>
                      <h2 className="text-lg font-bold uppercase tracking-tight italic">The Consensus</h2>
                   </div>
                   
                   <div className="space-y-4">
                      {communityData.map((communityTier) => (
                         <div key={communityTier.tier}>
                            <div className={`flex items-center justify-between mb-2 p-2 rounded-md ${getTierBg(communityTier.tier)} border border-white/5`}>
                               <div className="flex items-center gap-2">
                                  <span className={`font-bold text-sm ${getTierColor(communityTier.tier)}`}>
                                    {communityTier.tier} TIER
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-bold bg-black/30 px-1.5 py-0.5 rounded">
                                     {communityTier.percentage}% AGREE
                                  </span>
                               </div>
                            </div>
                            <div className="flex flex-col gap-1.5 pl-2">
                               {communityTier.items.map(item => (
                                  <div key={item.id} className="bg-slate-800/40 p-2 rounded border border-slate-700/50 flex items-center justify-between">
                                     <span className="text-slate-300 text-xs font-medium">{item.content}</span>
                                     <div className="w-12 bg-slate-700/50 rounded-full h-1">
                                        <div 
                                          className="bg-brand-500 h-full rounded-full"
                                          style={{ width: `${communityTier.percentage}%` }}
                                        />
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
             
             {/* Surprising Picks */}
             {surprisingItems.length > 0 && (
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-red-500/10 p-6">
                   <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <XCircle size={16} className="text-red-500" />
                     Statistical Outliers
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {surprisingItems.map((surprise, index) => (
                         <div key={index} className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
                            <div className="font-bold text-slate-200 text-sm leading-snug">{surprise.item.content}</div>
                            <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-800 pt-3">
                               <div className="flex items-center gap-1.5">
                                 <span className="text-slate-500 uppercase tracking-wider">YOU:</span>
                                 <span className={`px-2 py-0.5 rounded ${getTierBg(surprise.userTier)} ${getTierColor(surprise.userTier)}`}>
                                   {surprise.userTier}
                                 </span>
                               </div>
                               <div className="flex items-center gap-1.5">
                                 <span className="text-slate-500 uppercase tracking-wider">COMMUNITY:</span>
                                 <span className={`px-2 py-0.5 rounded ${getTierBg(surprise.communityTier)} ${getTierColor(surprise.communityTier)}`}>
                                   {surprise.communityTier}
                                 </span>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             )}
          </div>

          {/* Metrics Column */}
          <div className="lg:col-span-4 space-y-6">
             {/* Agreement Score */}
             <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 shadow-2xl text-center">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Agreement Rating</h3>
                <div className="relative inline-flex items-center justify-center mb-6">
                   <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                         cx="64"
                         cy="64"
                         r="58"
                         stroke="currentColor"
                         strokeWidth="8"
                         fill="transparent"
                         className="text-slate-800"
                      />
                      <circle
                         cx="64"
                         cy="64"
                         r="58"
                         stroke="currentColor"
                         strokeWidth="8"
                         fill="transparent"
                         strokeDasharray={Math.PI * 2 * 58}
                         strokeDashoffset={Math.PI * 2 * 58 * (1 - agreementScore / 100)}
                         className="text-brand-500 transition-all duration-1000 ease-out"
                         strokeLinecap="round"
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold tracking-tighter">{agreementScore}%</span>
                   </div>
                </div>
                <div className="flex flex-col gap-1">
                   <p className="text-xs text-slate-400 font-medium">
                     {perfectMatches} Perfect Alignment{perfectMatches !== 1 ? 's' : ''}
                   </p>
                   <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                     Across {allItems.length} data points
                   </p>
                </div>
             </div>

             {/* Distribution Chart */}
             <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Tier Distribution</h3>
                <div className="space-y-4">
                   {TIERS.map(tier => {
                      const count = userRankings[tier.label as TierLevel]?.length || 0;
                      const percentage = allItems.length > 0 ? (count / allItems.length) * 100 : 0;
                      
                      return (
                         <div key={tier.label} className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                               <span className={getTierColor(tier.label as TierLevel)}>{tier.label} TIER</span>
                               <span className="text-slate-500">{count} ITEM{count !== 1 ? 'S' : ''}</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full rounded-full transition-all duration-1000 ${
                                   tier.label === 'S' ? 'bg-yellow-500' :
                                   tier.label === 'A' ? 'bg-red-500' :
                                   tier.label === 'B' ? 'bg-orange-500' :
                                   tier.label === 'C' ? 'bg-blue-500' :
                                   'bg-slate-500'
                                 }`}
                                 style={{ width: `${percentage}%` }}
                               />
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
             
             {/* CTA */}
             <div className="bg-brand-900/40 rounded-xl border border-brand-500/20 p-6 text-center">
                <TrendingUp size={32} className="text-brand-400 mx-auto mb-3" />
                <h4 className="font-bold text-sm mb-2">Drive the Consensus</h4>
                <p className="text-xs text-brand-200/70 mb-5 leading-relaxed font-medium">Your data contributes to the global consensus for this survey.</p>
                <button 
                   onClick={onBack}
                   className="btn-base w-full bg-brand-500 text-brand-900 font-black uppercase tracking-widest hover:bg-brand-400"
                >
                   Finish Survey
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
