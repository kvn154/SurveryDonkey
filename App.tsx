import React, { useState, useEffect } from 'react';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { TopTierRank } from './components/Games/TopTierRank';
import { ImposterGame } from './components/Games/ImposterGame';
import { CommunityComparison } from './components/Games/CommunityComparison';
import { StorageService } from './services/storageService';
import { Survey, SurveyResponse, TierLevel, TierItem } from './types';
import { ArrowLeft, Gamepad2 } from 'lucide-react';

// Seed fake data if empty
StorageService.seedFakeData();

type ViewState = 'ADMIN' | 'GAME_SELECTION' | 'PLAY_TOP_TIER' | 'PLAY_IMPOSTER' | 'TOP_TIER_RESULTS';

function App() {
  const [view, setView] = useState<ViewState>('ADMIN');
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
  
  // Results state for comparison view
  const [lastRankings, setLastRankings] = useState<Record<TierLevel, TierItem[]> | null>(null);
  const [lastAllItems, setLastAllItems] = useState<TierItem[]>([]);

  const refreshData = () => {
    setSurveys(StorageService.getSurveys());
    setResponses(StorageService.getResponses());
  };

  useEffect(() => {
    refreshData();
  }, [view]);

  const handleLaunchGame = (surveyId: string) => {
    setActiveSurveyId(surveyId);
    setView('GAME_SELECTION');
  };

  const getActiveSurvey = () => surveys.find(s => s.id === activeSurveyId);

  // -- Render Logic --

  if (view === 'ADMIN') {
    return (
      <AdminDashboard 
        surveys={surveys}
        responses={responses}
        onCreateSurvey={() => alert("Create feature mocked. Edit 'storageService.ts' to add more seed data.")}
        onDeleteSurvey={(id) => { StorageService.deleteSurvey(id); refreshData(); }}
        onSelectSurvey={handleLaunchGame}
        onSurveyUpdated={refreshData}
      />
    );
  }

  if (view === 'GAME_SELECTION') {
    const survey = getActiveSurvey();
    if (!survey) return <div>Error: Survey not found</div>;

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
           <button 
             onClick={() => setView('ADMIN')}
             className="text-white/50 hover:text-white mb-8 flex items-center gap-2"
           >
             <ArrowLeft size={20} /> Back to Admin
           </button>
           
           <h1 className="text-4xl md:text-5xl font-black text-white text-center mb-4">
             Choose Your Experience
           </h1>
           <p className="text-slate-400 text-center mb-12 text-lg">
             Participate in the survey "{survey.title}" through one of these games.
           </p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1 */}
              <button 
                onClick={() => setView('PLAY_TOP_TIER')}
                disabled={!survey.gamifiedData && !survey.questions.some(q => q.type === 'RANKING')}
                className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-left hover:scale-[1.02] transition-transform group shadow-2xl border border-white/10 disabled:opacity-50 disabled:grayscale"
              >
                 <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-white group-hover:bg-white group-hover:text-purple-600 transition-colors">
                    <Gamepad2 size={24} />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">Top Tier Rank</h3>
                 <p className="text-indigo-100">Drag and drop items into tiers. Show us what you really value in this rapid-fire ranking game.</p>
              </button>

              {/* Card 2 */}
              <button 
                onClick={() => setView('PLAY_IMPOSTER')}
                disabled={!survey.gamifiedData}
                className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-8 text-left hover:scale-[1.02] transition-transform group shadow-2xl border border-white/10 disabled:opacity-50 disabled:grayscale"
              >
                 <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-white group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                    <Gamepad2 size={24} />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">The Imposter</h3>
                 <p className="text-emerald-100">Blend in with AI bots. Answer survey questions rephrased as game dialogue without revealing your identity.</p>
              </button>
           </div>
        </div>
      </div>
    );
  }

  const survey = getActiveSurvey();
  
  if (view === 'PLAY_TOP_TIER' && survey) {
    return (
      <TopTierRank 
        surveyId={survey.id}
        questions={survey.questions}
        gamifiedData={survey.gamifiedData}
        onComplete={(rankings, items) => {
          setLastRankings(rankings);
          setLastAllItems(items);
          setView('TOP_TIER_RESULTS');
        }}
        onQuit={() => setView('GAME_SELECTION')}
      />
    );
  }

  if (view === 'TOP_TIER_RESULTS' && lastRankings) {
    return (
      <CommunityComparison
        userRankings={lastRankings}
        allItems={lastAllItems}
        onBack={() => setView('ADMIN')}
        onShare={() => alert("Sharing functionality coming soon!")}
      />
    );
  }

  if (view === 'PLAY_IMPOSTER' && survey) {
    return (
      <ImposterGame 
        surveyId={survey.id}
        questions={survey.questions}
        gamifiedData={survey.gamifiedData}
        onComplete={() => setView('ADMIN')}
      />
    );
  }

  return <div>Loading...</div>;
}

export default App;