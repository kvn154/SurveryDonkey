// CommunityComparison.tsx
import React, { useState, useEffect } from 'react';
import { TierItem, TierLevel } from '../../types';
import { StorageService } from '../../services/storageService';
import { BarChart3, Users, CheckCircle, XCircle, TrendingUp, Trophy, ArrowLeft, Share2 } from 'lucide-react';

interface CommunityRanking {
  tier: TierLevel;
  items: TierItem[];
  percentage: number; // Percentage of community that placed item here
}

interface ComparisonProps {
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

// Mock community data - in real app, fetch from API
const MOCK_COMMUNITY_RANKINGS: CommunityRanking[] = [
  { tier: 'S', items: [{ id: 'q1_0', content: 'Item A'}], percentage: 85 },
  { tier: 'A', items: [{ id: 'q1_1', content: 'Item B'}], percentage: 72 },
  { tier: 'B', items: [{ id: 'q1_2', content: 'Item C'}], percentage: 45 },
  { tier: 'C', items: [{ id: 'q1_3', content: 'Item D'}], percentage: 30 },
  { tier: 'D', items: [{ id: 'q1_4', content: 'Item E'}], percentage: 15 },
];

export const CommunityComparison: React.FC<ComparisonProps> = ({
  userRankings,
  allItems,
  onBack,
  onShare,
}) => {
  const [communityData, setCommunityData] = useState<CommunityRanking[]>(MOCK_COMMUNITY_RANKINGS);
  const [agreementScore, setAgreementScore] = useState<number>(0);
  const [surprisingItems, setSurprisingItems] = useState<{ item: TierItem, userTier: TierLevel, communityTier: TierLevel }[]>([]);
  const [perfectMatches, setPerfectMatches] = useState<number>(0);

  useEffect(() => {
    calculateComparison();
  }, [userRankings, communityData]);

  const calculateComparison = () => {
    let matches = 0;
    let totalCompared = 0;
    const surprises: { item: TierItem, userTier: TierLevel, communityTier: TierLevel }[] = [];

    // Compare each item
    allItems.forEach(item => {
      const userTier = findItemTier(item.id, userRankings);
      const communityTier = findItemTier(item.id, communityData);
      
      if (userTier && communityTier) {
        totalCompared++;
        
        if (userTier === communityTier) {
          matches++;
        } else {
          // Check if placement is significantly different (more than 1 tier apart)
          const tierOrder = ['S', 'A', 'B', 'C', 'D'];
          const userIndex = tierOrder.indexOf(userTier);
          const communityIndex = tierOrder.indexOf(communityTier);
          
          if (Math.abs(userIndex - communityIndex) >= 2) {
            surprises.push({ item, userTier, communityTier });
          }
        }
      }
    });

    const score = totalCompared > 0 ? Math.round((matches / totalCompared) * 100) : 0;
    setAgreementScore(score);
    setSurprisingItems(surprises);
    setPerfectMatches(matches);
  };

  const findItemTier = (itemId: string, rankings: any): TierLevel | null => {
    for (const tier of TIERS) {
      const tierItems = rankings[tier.label] || [];
      if (tierItems.some((item: TierItem) => item.id === itemId)) {
        return tier.label as TierLevel;
      }
    }
    return null;
  };

  const getTierColor = (tier: TierLevel) => {
    const tierConfig = TIERS.find(t => t.label === tier);
    return tierConfig?.color || 'text-slate-300';
  };

  const getTierBg = (tier: TierLevel) => {
    const tierConfig = TIERS.find(t => t.label === tier);
    return tierConfig?.bg || 'bg-slate-800/20';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-4 md:p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors p-2"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Ranking</span>
          </button>
          
          <button
            onClick={onShare}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Share2 size={16} />
            <span className="text-sm">Share Results</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            How Your Rankings Compare
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              With the Community
            </span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            See how your tier list choices align with thousands of other users
          </p>
        </div>

        {/* Main Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Left Column: Your Rankings */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="font-bold">You</span>
                </div>
                <h2 className="text-xl font-bold">Your Tier List</h2>
              </div>
              
              {TIERS.map(tier => (
                <div key={tier.label} className="mb-4 last:mb-0">
                  <div className={`flex items-center justify-between mb-2 p-3 rounded-lg ${getTierBg(tier.label as TierLevel)}`}>
                    <span className={`font-bold text-lg ${getTierColor(tier.label as TierLevel)}`}>
                      {tier.label} Tier
                    </span>
                    <span className="text-slate-400 text-sm">
                      {userRankings[tier.label as TierLevel]?.length || 0} items
                    </span>
                  </div>
                  <div className="space-y-2">
                    {userRankings[tier.label as TierLevel]?.map(item => (
                      <div key={item.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <span className="text-slate-200">{item.content}</span>
                      </div>
                    ))}
                    {(!userRankings[tier.label as TierLevel] || userRankings[tier.label as TierLevel].length === 0) && (
                      <div className="text-slate-500 italic text-sm p-3">No items placed here</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Column: Community Rankings */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <h2 className="text-xl font-bold">Community Consensus</h2>
              </div>
              
              {communityData.map((communityTier) => (
                <div key={communityTier.tier} className="mb-4 last:mb-0">
                  <div className={`flex items-center justify-between mb-2 p-3 rounded-lg ${getTierBg(communityTier.tier)}`}>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-lg ${getTierColor(communityTier.tier)}`}>
                        {communityTier.tier} Tier
                      </span>
                      <div className="flex items-center gap-1 text-sm">
                        <BarChart3 size={14} />
                        <span>{communityTier.percentage}% agree</span>
                      </div>
                    </div>
                    <span className="text-slate-400 text-sm">
                      {communityTier.items.length} items
                    </span>
                  </div>
                  <div className="space-y-2">
                    {communityTier.items.map(item => (
                      <div key={item.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-200">{item.content}</span>
                          <div className="w-16 bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${communityTier.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Stats & Insights */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700 p-6 h-full">
              <h2 className="text-xl font-bold mb-6">Your Results</h2>
              
              {/* Agreement Score */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-300">Agreement Score</h3>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-400" />
                    <span className="text-sm text-slate-400">vs Community</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="text-5xl font-bold text-center mb-2">{agreementScore}%</div>
                  <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${agreementScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-4">
                  You agree with the community on {perfectMatches} out of {allItems.length} items
                </p>
              </div>

              {/* Surprising Picks */}
              {surprisingItems.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <XCircle size={16} className="text-red-400" />
                    Surprising Picks
                  </h3>
                  <div className="space-y-3">
                    {surprisingItems.map((surprise, index) => (
                      <div key={index} className="bg-slate-800/50 p-4 rounded-lg border border-red-500/20">
                        <div className="font-medium mb-2">{surprise.item.content}</div>
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">You placed:</span>
                            <span className={`font-bold ${getTierColor(surprise.userTier)}`}>
                              {surprise.userTier}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Community:</span>
                            <span className={`font-bold ${getTierColor(surprise.communityTier)}`}>
                              {surprise.communityTier}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Perfect Matches */}
              <div>
                <h3 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  Perfect Matches
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {allItems.map((item, index) => {
                    const userTier = findItemTier(item.id, userRankings);
                    const communityTier = findItemTier(item.id, communityData);
                    const isMatch = userTier === communityTier && userTier !== null;
                    
                    return (
                      <div
                        key={item.id}
                        className={`aspect-square rounded-lg flex items-center justify-center ${
                          isMatch 
                            ? 'bg-green-500/20 border border-green-500/30' 
                            : 'bg-slate-800/50 border border-slate-700'
                        }`}
                        title={isMatch ? `Perfect match: ${item.content}` : item.content}
                      >
                        {isMatch ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <span className="text-xs text-slate-500">{index + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-slate-400 mt-3">
                  {perfectMatches} perfect matches with community consensus
                </p>
              </div>

              {/* Ranking Distribution */}
              <div className="mt-8 pt-6 border-t border-slate-700">
                <h3 className="font-semibold text-slate-300 mb-4">Your Tier Distribution</h3>
                <div className="space-y-3">
                  {TIERS.map(tier => {
                    const count = userRankings[tier.label as TierLevel]?.length || 0;
                    const percentage = allItems.length > 0 ? (count / allItems.length) * 100 : 0;
                    
                    return (
                      <div key={tier.label} className="flex items-center gap-3">
                        <span className={`font-bold w-6 ${getTierColor(tier.label as TierLevel)}`}>
                          {tier.label}
                        </span>
                        <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              tier.label === 'S' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                              tier.label === 'A' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                              tier.label === 'B' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                              tier.label === 'C' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                              'bg-gradient-to-r from-slate-500 to-slate-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-400 w-10 text-right">
                          {count} ({Math.round(percentage)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="inline-flex flex-col md:flex-row items-center gap-6 bg-slate-800/30 backdrop-blur rounded-2xl border border-slate-700 p-8">
            <Trophy size={48} className="text-yellow-400" />
            <div className="text-left">
              <h3 className="text-xl font-bold mb-2">Want to see more comparisons?</h3>
              <p className="text-slate-400 mb-4">
                Join our community to contribute to the rankings and unlock detailed analytics
              </p>
            </div>
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-3 rounded-lg transition-all hover:scale-105">
              Join Community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};