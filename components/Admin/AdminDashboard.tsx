import React, { useState } from 'react';
import { Survey, SurveyResponse } from '../../types';
import { AnalyticsView } from './AnalyticsView';
import { FileText, Plus, BarChart2, Trash2, Home, Wand2, Loader2, Play, Pencil, X } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { SurveyEditor } from './SurveyEditor';

interface Props {
  surveys: Survey[];
  responses: SurveyResponse[];
  onCreateSurvey: () => void; // Kept for interface compatibility but we handle internally mostly
  onDeleteSurvey: (id: string) => void;
  onSelectSurvey: (id: string) => void; 
  onSurveyUpdated: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ 
  surveys, 
  responses, 
  onDeleteSurvey,
  onSelectSurvey,
  onSurveyUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'surveys' | 'analytics'>('surveys');
  const [selectedAnalyticsId, setSelectedAnalyticsId] = useState<string>(surveys[0]?.id || '');
  
  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);

  const handleCreateNew = () => {
    setEditingSurvey(null);
    setIsEditing(true);
  };

  const handleEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setIsEditing(true);
  };

  const handleSave = (survey: Survey) => {
    StorageService.saveSurvey(survey);
    setIsEditing(false);
    setEditingSurvey(null);
    onSurveyUpdated();
  };

  if (isEditing) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
         <div className="max-w-4xl mx-auto">
           <SurveyEditor 
             initialSurvey={editingSurvey} 
             onSave={handleSave} 
             onCancel={() => setIsEditing(false)} 
           />
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
       {/* Sidebar / Navigation */}
       <div className="bg-brand-900 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-2 font-bold text-xl">
             <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">G</div>
             SurveyGamify
          </div>
          <div className="flex gap-4">
             <button 
               onClick={() => setActiveTab('surveys')}
               className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${activeTab === 'surveys' ? 'bg-brand-700 text-white' : 'text-brand-200 hover:text-white'}`}
             >
                <FileText size={18} /> Manage
             </button>
             <button 
               onClick={() => setActiveTab('analytics')}
               className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${activeTab === 'analytics' ? 'bg-brand-700 text-white' : 'text-brand-200 hover:text-white'}`}
             >
                <BarChart2 size={18} /> Analytics
             </button>
          </div>
       </div>

       <div className="max-w-6xl mx-auto p-8">
          {activeTab === 'surveys' && (
            <div>
               <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-bold text-slate-800">Your Surveys</h1>
                  <button onClick={handleCreateNew} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700">
                     <Plus size={18} /> New Survey
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {surveys.map(survey => (
                    <div key={survey.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                       <div className="p-6">
                          <h3 className="font-bold text-xl text-brand-900 mb-2 truncate">{survey.title}</h3>
                          <p className="text-slate-500 text-sm mb-4">{survey.questions.length} Questions</p>
                          
                          <div className="flex gap-2 mb-4">
                             {survey.gamifiedData ? (
                               <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                 <Wand2 size={12}/> Gamified
                               </span>
                             ) : (
                               <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full">
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
                                  className="bg-brand-600 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-brand-700 flex items-center gap-1"
                                >
                                  <Play size={14} fill="currentColor" /> Play
                                </button>
                             )}
                             <button 
                                onClick={() => handleEdit(survey)}
                                className="text-slate-600 font-semibold hover:text-brand-600 text-sm flex items-center gap-1 px-2 py-1"
                             >
                                <Pencil size={14} /> Edit
                             </button>
                          </div>
                          <button onClick={() => onDeleteSurvey(survey.id)} className="text-red-400 hover:text-red-600">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
               <div className="mb-8">
                  <h1 className="text-3xl font-bold text-slate-800 mb-4">Analytics Dashboard</h1>
                  <select 
                    value={selectedAnalyticsId}
                    onChange={(e) => setSelectedAnalyticsId(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-4 py-2 w-full md:w-64"
                  >
                     {surveys.map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                     ))}
                  </select>
               </div>
               
               {selectedAnalyticsId && (
                  <AnalyticsView 
                    survey={surveys.find(s => s.id === selectedAnalyticsId)!} 
                    responses={responses.filter(r => r.surveyId === selectedAnalyticsId)}
                  />
               )}
            </div>
          )}
       </div>
    </div>
  );
};