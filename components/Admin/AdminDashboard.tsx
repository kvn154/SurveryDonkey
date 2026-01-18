import React from 'react';
import { Survey, SurveyResponse } from '../../types';
import { AnalyticsView } from './AnalyticsView';
import { FileText, Plus, BarChart2, Trash2, Edit2, Play, Wand2, ChevronRight } from 'lucide-react';

import { useNavigate } from '@tanstack/react-router';

interface Props {
  activeTab: 'surveys' | 'analytics';
  selectedSurveyId?: string;
  surveys: Survey[];
  responses: SurveyResponse[];
  onCreateSurvey: () => void;
  onEditSurvey: (id: string) => void;
  onDeleteSurvey: (id: string) => void;
  onSelectSurvey: (id: string) => void; // For playing
}

export const AdminDashboard: React.FC<Props> = ({ 
  activeTab,
  selectedSurveyId,
  surveys, 
  responses, 
  onCreateSurvey, 
  onEditSurvey,
  onDeleteSurvey,
  onSelectSurvey
}) => {
  const navigate = useNavigate();
  const currentAnalyticsId = selectedSurveyId || surveys[0]?.id || '';
  const selectedSurvey = surveys.find(s => s.id === currentAnalyticsId);

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col">
       {/* Top Navigation */}
       <header className="bg-brand-900 text-white shadow-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center font-bold text-brand-900 shadow-inner">
                      D
                   </div>
                   <span className="font-bold text-xl tracking-tight">SurveyDonkey</span>
                </div>
                <nav className="flex gap-4">
                   <button 
                     onClick={() => navigate({ to: '/' })}
                     className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${activeTab === 'surveys' ? 'bg-brand-700 text-white' : 'text-brand-200 hover:text-white'}`}
                   >
                      <FileText size={18} /> Manage
                   </button>
                   <button 
                     onClick={() => navigate({ to: '/analytics' })}
                     className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${activeTab === 'analytics' ? 'bg-brand-700 text-white' : 'text-brand-200 hover:text-white'}`}
                   >
                      <BarChart2 size={18} /> Analytics
                   </button>
                </nav>
             </div>
          </div>
       </header>

       <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'surveys' && (
            <div>
                <div className="flex justify-between items-center mb-8">
                   <h1 className="text-3xl font-bold text-slate-800">Your Surveys</h1>
                   <button 
                     onClick={onCreateSurvey} 
                     className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 font-bold cursor-pointer active:scale-95"
                   >
                      <Plus size={18} />
                      <span>New Survey</span>
                   </button>
                </div>

                {surveys.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {surveys.map(survey => (
                      <div key={survey.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
                         <div className="p-6 flex-1">
                            <h3 className="font-bold text-xl text-brand-900 mb-2 truncate">{survey.title}</h3>
                            <p className="text-slate-500 text-sm mb-4">{survey.questions.length} Questions</p>
                            
                            <div className="flex gap-2 mb-4">
                               {survey.gamifiedData ? (
                                 <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold">
                                   <Wand2 size={12}/> Gamified
                                 </span>
                               ) : (
                                 <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-bold">
                                   Standard
                                 </span>
                               )}
                            </div>
                         </div>
                         
                         <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                            <div className="flex gap-2">
                               {survey.gamifiedData && (
                                  <button 
                                    onClick={() => onSelectSurvey(survey.id)}
                                    className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-brand-700 flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                                  >
                                    <Play size={14} fill="currentColor" /> Play
                                  </button>
                               )}
                               <button 
                                 onClick={() => onEditSurvey(survey.id)}
                                 className="text-slate-600 font-bold hover:text-brand-600 text-sm flex items-center gap-1 px-2 py-1 transition-colors cursor-pointer"
                               >
                                  <Edit2 size={14} /> Edit
                               </button>
                            </div>
                            <button 
                              onClick={() => onDeleteSurvey(survey.id)} 
                              className="text-red-400 hover:text-red-600 transition-colors p-1.5 cursor-pointer"
                              title="Delete Survey"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border-4 border-dashed border-slate-200 p-12 text-center">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <FileText size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">No Surveys Yet</h2>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">Create your first gamified survey to start collecting engaging data.</p>
                    <button onClick={onCreateSurvey} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100">
                      Create First Survey
                    </button>
                  </div>
                )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
               <div className="mb-8">
                  <h1 className="text-3xl font-bold text-slate-800 mb-4">Analytics Dashboard</h1>
                  <div className="relative w-full md:w-auto inline-block">
                    <select 
                      value={currentAnalyticsId}
                      onChange={(e) => navigate({ to: '/analytics/$surveyId', params: { surveyId: e.target.value } })}
                      className="bg-white border border-slate-300 rounded-lg px-4 py-2 w-full md:w-64 appearance-none font-medium text-slate-700 shadow-sm cursor-pointer"
                    >
                       <option value="" disabled>Select a survey...</option>
                       {surveys.map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                       ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                       <ChevronRight size={16} className="rotate-90" />
                    </div>
                  </div>
               </div>
               
               {selectedSurvey ? (
                  <AnalyticsView 
                    survey={selectedSurvey} 
                    responses={responses.filter(r => r.surveyId === selectedSurvey.id)}
                  />
               ) : (
                 <div className="bg-white rounded-3xl border-4 border-dashed border-slate-200 p-12 text-center">
                    <p className="text-slate-500 font-medium">Select a survey to view its performance data.</p>
                 </div>
               )}
            </div>
          )}
       </main>
    </div>
  );
};
