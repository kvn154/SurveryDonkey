import React from 'react';
import { Survey, SurveyResponse } from '../../types';
import { AnalyticsView } from './AnalyticsView';
import { FileText, Plus, BarChart2, Trash2, Edit2 } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50">
       {/* Sidebar / Navigation */}
       <div className="bg-brand-900 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2 font-bold text-xl">
             <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">G</div>
             SurveyGamify
          </div>
            <div className="flex gap-4">
               <button 
                 onClick={() => navigate({ to: '/' })}
                 className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors cursor-pointer ${activeTab === 'surveys' ? 'bg-brand-700 text-white' : 'text-brand-200 hover:text-white'}`}
               >
                  <FileText size={18} /> Manage
               </button>
               <button 
                 onClick={() => navigate({ to: '/analytics' })}
                 className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors cursor-pointer ${activeTab === 'analytics' ? 'bg-brand-700 text-white' : 'text-brand-200 hover:text-white'}`}
               >
                  <BarChart2 size={18} /> Analytics
               </button>
            </div>


       </div>

       <div className="max-w-6xl mx-auto p-8">
          {activeTab === 'surveys' && (
            <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                   <div>
                      <h1 className="text-3xl font-black text-slate-800 tracking-tight">Your Surveys</h1>
                      <p className="text-slate-500 font-medium">Manage and monitor your collection</p>
                   </div>
                   <button 
                     onClick={onCreateSurvey} 
                     className="bg-brand-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 font-bold cursor-pointer active:scale-95"
                   >
                      <Plus size={20} />
                      <span>New Survey</span>
                   </button>
                </div>


                {surveys.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                    {surveys.map(survey => (
                      <div key={survey.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
                         <div className="p-6 flex-1">
                            <div className="bg-brand-50 text-brand-700 w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-500 group-hover:text-white transition-colors duration-300">
                               <FileText size={20} />
                            </div>
                            <h3 className="font-bold text-xl text-brand-900 mb-2 line-clamp-2">{survey.title}</h3>
                            <p className="text-slate-500 text-sm mb-4 flex items-center gap-1.5">
                               <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                               {survey.questions.length} Questions
                            </p>
                            <div className="flex gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded w-fit">
                               <span>ID: {survey.id.slice(0,8)}</span>
                            </div>
                         </div>
                        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex justify-between items-center gap-4">
                           <div className="flex items-center gap-3">
                              <button 
                               onClick={() => onSelectSurvey(survey.id)}
                               className="bg-brand-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-brand-700 transition-all cursor-pointer shadow-sm shadow-brand-100 active:scale-95"
                              >
                                Launch
                              </button>
                              <button 
                               onClick={() => onEditSurvey(survey.id)}
                               className="flex items-center gap-1.5 text-slate-600 font-bold text-xs hover:text-brand-600 transition-colors py-1.5 cursor-pointer"
                              >
                                <Edit2 size={14} />
                                <span>Edit</span>
                              </button>
                           </div>
                           <button 
                             onClick={() => onDeleteSurvey(survey.id)} 
                             className="text-slate-300 hover:text-red-500 transition-colors p-1.5 cursor-pointer"
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
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                     <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analytics Dashboard</h1>
                     <p className="text-slate-500 font-medium">Insights from your gamified collectors</p>
                  </div>
                  <div className="relative w-full md:w-auto group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
                      <FileText size={18} />
                    </div>
                    <select 
                      value={currentAnalyticsId}
                      onChange={(e) => navigate({ to: '/analytics/$surveyId', params: { surveyId: e.target.value } })}
                      className="bg-white border-2 border-slate-100 rounded-xl pl-10 pr-10 py-3 w-full md:w-72 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 outline-none transition-all appearance-none font-bold text-slate-700 shadow-sm cursor-pointer"
                    >
                       <option value="" disabled>Select a survey...</option>
                       {surveys.map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                       ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
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
       </div>
    </div>
  );
};
