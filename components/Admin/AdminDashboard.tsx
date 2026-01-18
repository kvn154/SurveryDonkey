import React from 'react';
import { Survey, SurveyResponse } from '../../types';
import { AnalyticsView } from './AnalyticsView';
import { FileText, Plus, BarChart2, Trash2, Edit2, Play, Wand2, ChevronDown } from 'lucide-react';

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
       <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="flex justify-between items-center h-16">
                 <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center font-bold text-white shadow-sm">
                       D
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-900">SurveyDonkey</span>
                 </div>
                
                <nav 
                   className="nav-toggle" 
                   data-active={activeTab === 'surveys' ? 'manage' : 'analytics'}
                >
                   <div className="nav-toggle__indicator" />
                   
                   <button 
                     onClick={() => navigate({ to: '/' })}
                     className="nav-toggle__label"
                     data-active={activeTab === 'surveys'}
                   >
                      <FileText size={16} /> Manage
                   </button>
                   <button 
                     onClick={() => navigate({ to: '/analytics' })}
                     className="nav-toggle__label"
                     data-active={activeTab === 'analytics'}
                   >
                      <BarChart2 size={16} /> Analytics
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
                      className="btn-base bg-brand-600 text-white flex items-center gap-2 hover:bg-brand-700 shadow-sm"
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
                                  <span className="bg-brand-100 text-brand-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold">
                                    <Wand2 size={12}/> Gamified
                                  </span>
                                ) : (
                                  <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full font-bold">
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
                                     className="btn-sm bg-brand-600 text-white flex items-center gap-1 hover:bg-brand-700"
                                   >
                                     <Play size={14} fill="currentColor" /> Play
                                   </button>
                               )}
                               <button 
                                 onClick={() => onEditSurvey(survey.id)}
                                 className="btn-sm bg-white border border-slate-200 text-slate-600 flex items-center gap-1 hover:bg-slate-50 hover:text-brand-600"
                               >
                                  <Edit2 size={14} /> Edit
                               </button>
                            </div>
                            <button 
                              onClick={() => onDeleteSurvey(survey.id)} 
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
                     <button onClick={onCreateSurvey} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-md">
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
                      className="form-select w-full md:w-64"
                    >
                       <option value="" disabled>Select a survey...</option>
                       {surveys.map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                       ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                       <ChevronDown size={18} />
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
