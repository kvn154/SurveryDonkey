import { 
  createRootRoute, 
  createRoute, 
  createRouter, 
  Outlet,
  useNavigate,
  useLoaderData
} from '@tanstack/react-router';
import { StorageService } from './services/storageService';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { SurveyEditor } from './components/Admin/SurveyEditor';
import { TopTierRank } from './components/Games/TopTierRank';
import { ImposterGame } from './components/Games/ImposterGame';
import { CommunityComparison } from './components/Games/CommunityComparison';
import { ArrowLeft, Gamepad2 } from 'lucide-react';

// --- ROOT ROUTE ---
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-slate-50">
      <Outlet />
    </div>
  ),
});

// --- INDEX ROUTE (Admin Dashboard - Manage) ---
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  loader: async () => {
    const [surveys, responses] = await Promise.all([
      StorageService.getSurveys(),
      StorageService.getResponses()
    ]);
    return { surveys, responses };
  },
  component: () => {
    const { surveys, responses } = useLoaderData({ from: indexRoute.id });
    const navigate = useNavigate();

    return (
      <AdminDashboard 
        activeTab="surveys"
        surveys={surveys}
        responses={responses}
        onCreateSurvey={() => navigate({ to: '/survey/create' })}
        onEditSurvey={(id) => navigate({ to: '/survey/$surveyId/edit', params: { surveyId: id } })}
        onDeleteSurvey={async (id: string) => { 
          await StorageService.deleteSurvey(id);
          router.invalidate();
        }}
        onSelectSurvey={(id: string) => navigate({ to: '/survey/$surveyId', params: { surveyId: id } })}
      />
    );
  }
});

// --- ANALYTICS ROUTE ---
const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  loader: async () => {
    const [surveys, responses] = await Promise.all([
      StorageService.getSurveys(),
      StorageService.getResponses()
    ]);
    return { surveys, responses };
  },
  component: () => {
    const { surveys, responses } = useLoaderData({ from: analyticsRoute.id });
    const navigate = useNavigate();

    return (
      <AdminDashboard 
        activeTab="analytics"
        surveys={surveys}
        responses={responses}
        onCreateSurvey={() => navigate({ to: '/survey/create' })}
        onEditSurvey={(id) => navigate({ to: '/survey/$surveyId/edit', params: { surveyId: id } })}
        onDeleteSurvey={async (id: string) => { 
          await StorageService.deleteSurvey(id);
          router.invalidate();
        }}
        onSelectSurvey={(id: string) => navigate({ to: '/survey/$surveyId', params: { surveyId: id } })}
      />
    );
  }
});

// --- SPECIFIC ANALYTICS ROUTE ---
const surveyAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics/$surveyId',
  loader: async ({ params }) => {
    const [surveys, responses] = await Promise.all([
      StorageService.getSurveys(),
      StorageService.getResponses()
    ]);
    return { surveys, responses, selectedSurveyId: params.surveyId };
  },
  component: () => {
    const { surveys, responses, selectedSurveyId } = useLoaderData({ from: surveyAnalyticsRoute.id });
    const navigate = useNavigate();

    return (
      <AdminDashboard 
        activeTab="analytics"
        selectedSurveyId={selectedSurveyId}
        surveys={surveys}
        responses={responses}
        onCreateSurvey={() => navigate({ to: '/survey/create' })}
        onEditSurvey={(id) => navigate({ to: '/survey/$surveyId/edit', params: { surveyId: id } })}
        onDeleteSurvey={async (id: string) => { 
          await StorageService.deleteSurvey(id);
          router.invalidate();
        }}
        onSelectSurvey={(id: string) => navigate({ to: '/survey/$surveyId', params: { surveyId: id } })}
      />
    );
  }
});

// --- SURVEY CREATE ROUTE ---
const surveyCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/survey/create',
  component: () => {
    const navigate = useNavigate();
    return (
      <SurveyEditor 
        onSave={() => {
          router.invalidate();
          navigate({ to: '/' });
        }}
        onCancel={() => navigate({ to: '/' })}
      />
    );
  }
});

// --- SURVEY EDIT ROUTE ---
const surveyEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/survey/$surveyId/edit',
  loader: async ({ params }) => {
    const survey = await StorageService.getSurveyById(params.surveyId);
    if (!survey) throw new Error('Survey not found');
    return { survey };
  },
  component: () => {
    const { survey } = useLoaderData({ from: surveyEditRoute.id });
    const navigate = useNavigate();
    return (
      <SurveyEditor 
        initialData={survey}
        onSave={() => {
          router.invalidate();
          navigate({ to: '/' });
        }}
        onCancel={() => navigate({ to: '/' })}
      />
    );
  }
});

// --- SURVEY SELECTION ROUTE ---
const surveySelectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/survey/$surveyId',
  loader: async ({ params }) => {
    const survey = await StorageService.getSurveyById(params.surveyId);
    if (!survey) throw new Error('Survey not found');
    return { survey };
  },
  component: () => {
    const { survey } = useLoaderData({ from: surveySelectionRoute.id });
    const navigate = useNavigate();

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
           <button 
             onClick={() => navigate({ to: '/' })}
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
                 onClick={() => navigate({ to: '/play/$surveyId/top-tier', params: { surveyId: survey.id } })}
                 className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-left hover:scale-[1.02] transition-transform group shadow-2xl border border-white/10"
               >
                  <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-white group-hover:bg-white group-hover:text-purple-600 transition-colors">
                     <Gamepad2 size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Top Tier Rank</h3>
                  <p className="text-indigo-100">Drag and drop items into tiers. Show us what you really value in this rapid-fire ranking game.</p>
               </button>

               {/* Card 2 */}
               <button 
                 onClick={() => navigate({ to: '/play/$surveyId/imposter', params: { surveyId: survey.id } })}
                 className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-8 text-left hover:scale-[1.02] transition-transform group shadow-2xl border border-white/10"
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
});

// --- TOP TIER GAME ROUTE ---
const topTierRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/play/$surveyId/top-tier',
  loader: async ({ params }) => {
    const survey = await StorageService.getSurveyById(params.surveyId);
    if (!survey) throw new Error('Survey not found');
    return { survey };
  },
  component: () => {
    const { survey } = useLoaderData({ from: topTierRoute.id });
    const navigate = useNavigate();

    return (
      <TopTierRank 
        surveyId={survey.id}
        gamifiedData={survey.gamifiedData as any}
        onComplete={(rankings, allItems) => {
          localStorage.setItem('last_ranking', JSON.stringify({ rankings, allItems }));
          navigate({ to: '/play/$surveyId/top-tier/results', params: { surveyId: survey.id } });
        }}
        onQuit={() => navigate({ to: '/survey/$surveyId', params: { surveyId: survey.id } })}
      />
    );
  }
});

// --- TOP TIER RESULTS ROUTE ---
const topTierResultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/play/$surveyId/top-tier/results',
  loader: async ({ params }) => {
    const survey = await StorageService.getSurveyById(params.surveyId);
    if (!survey) throw new Error('Survey not found');
    return { survey };
  },
  component: () => {
    const { survey } = useLoaderData({ from: topTierResultsRoute.id });
    const navigate = useNavigate();
    
    const rawData = localStorage.getItem('last_ranking');
    if (!rawData) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">No results found</h2>
                    <button onClick={() => navigate({ to: '/' })} className="bg-purple-600 px-6 py-2 rounded">Back Home</button>
                </div>
            </div>
        );
    }
    const { rankings, allItems } = JSON.parse(rawData);

    return (
      <CommunityComparison
        surveyId={survey.id}
        userRankings={rankings}
        allItems={allItems}
        onBack={() => navigate({ to: '/' })}
      />
    );
  }
});

// --- IMPOSTER GAME ROUTE ---
const imposterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/play/$surveyId/imposter',
  loader: async ({ params }) => {
    const survey = await StorageService.getSurveyById(params.surveyId);
    if (!survey) throw new Error('Survey not found');
    return { survey };
  },
  component: () => {
    const { survey } = useLoaderData({ from: imposterRoute.id });
    const navigate = useNavigate();

    return (
      <ImposterGame 
        surveyId={survey.id}
        gamifiedData={survey.gamifiedData as any}
        onComplete={() => {
          router.invalidate();
          navigate({ to: '/' });
        }}
      />
    );
  }
});

// --- ROUTER SETUP ---
const routeTree = rootRoute.addChildren([
  indexRoute,
  analyticsRoute,
  surveyAnalyticsRoute,
  surveyCreateRoute,
  surveyEditRoute,
  surveySelectionRoute,
  topTierRoute,
  topTierResultsRoute,
  imposterRoute
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
