import React, { useState } from 'react';
import { Question, Survey, GamifiedQuestionData } from '../../types';
import { StorageService } from '../../services/storageService';
import { Plus, Trash2, Save, X, Wand2, Loader2, GripVertical, ChevronDown, RefreshCw, LayoutGrid, ListOrdered, BarChart } from 'lucide-react';

interface Props {
  initialData?: Survey;
  onSave: () => void;
  onCancel: () => void;
}

const DEFAULT_QUESTION: Omit<Question, 'id' | 'surveyId'> = {
  text: '',
  type: 'OPEN_ENDED',
  options: [],
  assignedGame: 'BOTH'
};

const generateTempId = () => `temp_${Math.random().toString(36).substring(2, 11)}`;

export const SurveyEditor: React.FC<Props> = ({ initialData, onSave, onCancel }) => {
  const [survey, setSurvey] = useState<Partial<Survey>>(
    initialData || {
      title: '',
      questions: [{ ...DEFAULT_QUESTION, id: generateTempId() } as any],
      gamifiedData: undefined
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'games'>('questions');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Gamification Modal State
  const [showGamifyModal, setShowGamifyModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedGameIndex, setExpandedGameIndex] = useState<number | null>(0);

  const handleUpdateSurvey = (field: keyof Survey, value: any) => {
    setSurvey(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...(survey.questions || [])];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleAddQuestion = () => {
    setSurvey(prev => ({
      ...prev,
      questions: [...(prev.questions || []), { ...DEFAULT_QUESTION, id: generateTempId() } as any]
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    setSurvey(prev => ({
      ...prev,
      questions: (prev.questions || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddOption = (qIndex: number) => {
    const updatedQuestions = [...(survey.questions || [])];
    const currentOptions = updatedQuestions[qIndex].options || [];
    updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], options: [...currentOptions, ''] };
    setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updatedQuestions = [...(survey.questions || [])];
    const currentOptions = [...(updatedQuestions[qIndex].options || [])];
    currentOptions[optIndex] = value;
    updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], options: currentOptions };
    setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const updatedQuestions = [...(survey.questions || [])];
    const currentOptions = updatedQuestions[qIndex].options || [];
    updatedQuestions[qIndex] = { 
        ...updatedQuestions[qIndex], 
        options: currentOptions.filter((_, i) => i !== optIndex) 
    };
    setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
  };

  // --- DRAG AND DROP LOGIC ---
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedQuestions = [...(survey.questions || [])];
    const draggedItem = updatedQuestions[draggedIndex];
    updatedQuestions.splice(draggedIndex, 1);
    updatedQuestions.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleGamify = async () => {
    if (!companyName || !productDesc) return;
    setIsProcessing(true);
    try {
      const data = await StorageService.gamifySurvey(companyName, productDesc, survey.questions as any);
      setSurvey(prev => ({ ...prev, gamifiedData: data as any }));
      setShowGamifyModal(false);
      setActiveTab('games');
    } catch (e) {
      alert("Gamification failed: " + e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateGamifiedData = (index: number, newData: GamifiedQuestionData) => {
      if(!survey.gamifiedData) return;
      const updated = [...(survey.gamifiedData as GamifiedQuestionData[])];
      updated[index] = newData;
      setSurvey(prev => ({ ...prev, gamifiedData: updated }));
  };

  const handleSave = async () => {
    if (!survey.title?.trim()) {
      alert("Please enter a survey title");
      return;
    }
    setIsSaving(true);
    try {
      const surveyData = {
        title: survey.title,
        gamifiedData: survey.gamifiedData,
        questions: (survey.questions || []).map(q => ({
          ...q,
          id: q.id?.startsWith('temp_') ? undefined : q.id,
          options: q.options || []
        }))
      };

      if (initialData?.id) {
        await StorageService.updateSurvey(initialData.id, surveyData as any);
      } else {
        await StorageService.createSurvey(surveyData as any);
      }
      onSave();
    } catch (err) {
      console.error(err);
      alert("Failed to save survey");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6">
      {/* Sticky Header - Enhanced Contrast */}
      <div className="bg-white/95 border border-slate-200 p-5 rounded-2xl flex justify-between items-center sticky top-2 z-50 mb-10 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
           <div className="bg-brand-50 p-2.5 rounded-xl border border-brand-100">
              <LayoutGrid className="text-brand-600" size={24} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {initialData ? 'Edit Survey' : 'New Survey'}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Campaign Designer</p>
           </div>
        </div>
        <div className="flex gap-3">
           <button onClick={onCancel} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">
             Cancel
           </button>
           <button 
             onClick={handleSave}
             disabled={isSaving || !survey.title || survey.questions?.some(q => !q.text)}
             className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black disabled:opacity-50 shadow-lg shadow-slate-200 transition-all active:scale-95"
           >
             {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Survey
           </button>
        </div>
      </div>

      <div className="space-y-8">
         {/* Title Section - High Contrast */}
         <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm focus-within:border-brand-500 transition-colors">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Survey Identification</label>
            <input 
              type="text"
              value={survey.title}
              onChange={e => handleUpdateSurvey('title', e.target.value)}
              className="w-full text-3xl font-black border-none focus:ring-0 p-0 text-slate-900 placeholder:text-slate-200"
              placeholder="e.g. Q1 User Experience Audit"
            />
         </div>

         {/* Navigation Tabs */}
         <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
            <button 
              onClick={() => setActiveTab('questions')}
              className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'questions' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
               <ListOrdered size={18} /> Questions
            </button>
            <button 
              onClick={() => setActiveTab('games')}
              className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'games' ? 'bg-white text-purple-600 shadow-sm border border-purple-100' : 'text-slate-500 hover:text-slate-700'}`}
            >
               <Wand2 size={18} /> Gamification
            </button>
         </div>

         {/* Questions Editor */}
         {activeTab === 'questions' && (
           <div className="space-y-6">
              {(survey.questions || []).map((q, idx) => (
                 <div 
                    key={q.id || idx} 
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`
                      bg-white p-6 rounded-3xl border-2 transition-all relative group
                      ${draggedIndex === idx ? 'opacity-50 scale-[0.98] border-brand-500 border-dashed bg-brand-50/10' : 'border-slate-100 hover:border-slate-200 shadow-sm'}
                    `}
                 >
                    <div className="flex gap-6">
                       {/* Drag Handle */}
                       <div className="mt-1 text-slate-300 cursor-grab active:cursor-grabbing group-hover:text-brand-400 transition-colors shrink-0">
                          <GripVertical size={24}/>
                       </div>

                       <div className="flex-1">
                          <div className="flex justify-between items-center mb-4">
                             <div className="flex items-center gap-3">
                                <span className="bg-slate-900 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-lg">
                                   {idx + 1}
                                </span>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Segment</label>
                             </div>
                             <button 
                                onClick={() => handleRemoveQuestion(idx)} 
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                             >
                                <Trash2 size={18}/>
                             </button>
                          </div>
                          
                          <input 
                             type="text"
                             value={q.text}
                             onChange={e => handleUpdateQuestion(idx, 'text', e.target.value)}
                             className="w-full border-2 border-slate-50 rounded-2xl px-5 py-4 focus:border-brand-500 focus:bg-white outline-none mb-6 text-lg font-bold bg-slate-50/50 transition-all placeholder:text-slate-300"
                             placeholder="What insights are you looking for?"
                          />
                          
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                             <div className="lg:col-span-4">
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Collection Method</label>
                                <div className="relative">
                                   <select 
                                     value={q.type}
                                     onChange={e => handleUpdateQuestion(idx, 'type', e.target.value)}
                                     className="w-full appearance-none border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white hover:border-slate-200 transition-colors focus:border-brand-500 outline-none cursor-pointer"
                                   >
                                      <option value="OPEN_ENDED">Open Ended Text</option>
                                      <option value="SINGLE_CHOICE">Multiple Choice</option>
                                      <option value="RANKING">Ranking / Sorting</option>
                                      <option value="LIKERT">Likert Scale (1-5)</option>
                                   </select>
                                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                      <ChevronDown size={16} />
                                   </div>
                                </div>
                             </div>

                             <div className="lg:col-span-4">
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Game Association</label>
                                <div className="relative">
                                   <select 
                                     value={q.assignedGame || 'BOTH'}
                                     onChange={e => handleUpdateQuestion(idx, 'assignedGame', e.target.value)}
                                     className="w-full appearance-none border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white hover:border-slate-200 transition-colors focus:border-brand-500 outline-none cursor-pointer"
                                   >
                                      <option value="BOTH">Universal (Both Games)</option>
                                      <option value="TOP_TIER">Top Tier Rank Exclusive</option>
                                      <option value="IMPOSTER">The Imposter Exclusive</option>
                                   </select>
                                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                      <ChevronDown size={16} />
                                   </div>
                                </div>
                             </div>
                             
                             {(q.type === 'SINGLE_CHOICE' || q.type === 'RANKING') && (
                               <div className="lg:col-span-12 bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                                  <div className="flex justify-between items-center mb-6">
                                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Options Management</label>
                                     <button 
                                       onClick={() => handleAddOption(idx)}
                                       className="btn-sm bg-brand-50 text-brand-600 hover:bg-brand-100 flex items-center gap-1 uppercase tracking-wider"
                                     >
                                       <Plus size={16} /> Add Option
                                     </button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                     {(q.options || []).map((opt, optIdx) => (
                                        <div key={optIdx} className="flex gap-2 group/opt animate-in slide-in-from-left-2 duration-200">
                                           <div className="relative flex-1">
                                              <input 
                                                 type="text"
                                                 value={opt}
                                                 onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                                                 className="w-full border-2 border-white rounded-xl px-4 py-2 text-sm font-bold bg-white shadow-sm focus:border-brand-500 outline-none transition-all"
                                                 placeholder={`Option ${optIdx + 1}`}
                                              />
                                           </div>
                                           <button 
                                              onClick={() => handleRemoveOption(idx, optIdx)}
                                              className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/opt:opacity-100"
                                           >
                                              <X size={18} />
                                           </button>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
              
              <button 
                onClick={handleAddQuestion} 
                className="w-full py-8 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-400 font-black hover:border-brand-200 hover:text-brand-500 hover:bg-brand-50/10 transition-all flex flex-col items-center justify-center gap-3 bg-white/50 group"
              >
                 <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                    <Plus size={32} />
                 </div>
                 <span className="uppercase tracking-[0.3em] text-xs">Add Content Block</span>
              </button>
           </div>
         )}

         {/* Games Editor - Improved Contrast */}
         {activeTab === 'games' && (
           <div className="animate-in fade-in duration-500">
              {!survey.gamifiedData ? (
                 <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-slate-100 shadow-sm flex flex-col items-center">
                    <div className="bg-purple-50 p-8 rounded-full text-purple-200 mb-8 animate-pulse">
                       <Wand2 size={64} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-3">AI Engine Standby</h3>
                    <p className="text-slate-500 mb-10 max-w-md mx-auto font-bold leading-relaxed">
                       Transform your standard questions into high-engagement game concepts using Gemini AI.
                    </p>
                    <button 
                      onClick={() => setShowGamifyModal(true)}
                      className="btn-hero px-12 bg-purple-600 text-white hover:bg-purple-700 shadow-xl shadow-purple-100 flex items-center gap-3"
                    >
                       <Wand2 size={24} /> Initialize Gamification
                    </button>
                 </div>
              ) : (
                 <div className="space-y-8">
                    <div className="flex justify-between items-center bg-indigo-900 p-6 rounded-3xl shadow-xl shadow-indigo-100 border border-indigo-800">
                       <div className="flex items-center gap-4">
                          <div className="bg-indigo-800 p-3 rounded-2xl text-indigo-200">
                             <BarChart size={24} />
                          </div>
                          <div>
                             <p className="text-white font-black text-lg">Gamification Complete</p>
                          </div>
                       </div>
                       <button 
                          onClick={() => setShowGamifyModal(true)}
                          className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-sm font-black transition-all backdrop-blur-md flex items-center gap-2"
                       >
                          <RefreshCw size={16} /> Regenerate
                       </button>
                    </div>

                    <div className="space-y-4">
                       {(survey.gamifiedData as GamifiedQuestionData[]).map((gData, idx) => (
                          <div key={idx} className="border-2 border-slate-100 rounded-[2rem] overflow-hidden shadow-sm bg-white hover:border-slate-200 transition-colors">
                             <div 
                               onClick={() => setExpandedGameIndex(expandedGameIndex === idx ? null : idx)}
                               className="bg-slate-50/50 p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                             >
                                <div className="flex-1">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Source Question</span>
                                   <p className="font-bold text-slate-800 text-lg line-clamp-1">{gData.original_question}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                   <div className="flex gap-2">
                                       {gData.games.top_tier_rank.applicable && (
                                           <span className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-black uppercase tracking-wider shadow-sm">Rank</span>
                                       )}
                                       {gData.games.imposter_spyfall.applicable && (
                                           <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-black uppercase tracking-wider shadow-sm">Imposter</span>
                                       )}
                                   </div>
                                   <div className={`text-slate-400 transition-transform duration-300 ${expandedGameIndex === idx ? 'rotate-180' : ''}`}>
                                      <ChevronDown size={24} />
                                   </div>
                                </div>
                             </div>

                             {expandedGameIndex === idx && (
                                <div className="p-8 bg-white border-t border-slate-100 space-y-10 animate-in slide-in-from-top-4 duration-500">
                                   {/* Top Tier Editor */}
                                   <div className="bg-slate-50/30 p-6 rounded-3xl border border-slate-100">
                                      <div className="flex items-center gap-3 mb-6">
                                         <div className={`w-4 h-4 rounded-full shadow-inner ${gData.games.top_tier_rank.applicable ? 'bg-green-500 shadow-green-200' : 'bg-slate-300'}`}></div>
                                         <h4 className="font-black text-slate-900 text-lg">Top Tier Configuration</h4>
                                         <label className="ml-auto flex items-center gap-3 text-xs font-black text-slate-500 cursor-pointer bg-white px-4 py-2 rounded-xl border border-slate-200 hover:border-brand-500 transition-all">
                                             <input 
                                               type="checkbox"
                                               checked={gData.games.top_tier_rank.applicable}
                                               onChange={(e) => {
                                                   const updated = { ...gData };
                                                   updated.games.top_tier_rank.applicable = e.target.checked;
                                                   handleUpdateGamifiedData(idx, updated);
                                               }}
                                               className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 transition-all"
                                             />
                                             ENABLE COMPONENT
                                         </label>
                                      </div>
                                      {gData.games.top_tier_rank.applicable && (
                                         <div className="space-y-6">
                                            <div>
                                               <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Rankable Concept Pool</label>
                                               <textarea 
                                                 value={gData.games.top_tier_rank.concepts.join('\n')}
                                                 onChange={(e) => {
                                                    const newConcepts = e.target.value.split('\n');
                                                    const updated = { ...gData };
                                                    updated.games.top_tier_rank.concepts = newConcepts;
                                                    handleUpdateGamifiedData(idx, updated);
                                                 }}
                                                 className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm h-40 font-mono bg-white focus:border-brand-500 outline-none transition-all shadow-inner"
                                                 placeholder="Add items to rank..."
                                               />
                                            </div>
                                            <div>
                                               <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Strategic Game Prompt</label>
                                               <div className="space-y-2">
                                                   {gData.games.top_tier_rank.derived_questions.map((dq, dqIdx) => (
                                                   <input 
                                                       key={dqIdx}
                                                       value={dq}
                                                       onChange={(e) => {
                                                           const updated = { ...gData };
                                                           updated.games.top_tier_rank.derived_questions[dqIdx] = e.target.value;
                                                           handleUpdateGamifiedData(idx, updated);
                                                       }}
                                                       className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold bg-white focus:border-brand-500 outline-none transition-all"
                                                   />
                                                   ))}
                                               </div>
                                            </div>
                                         </div>
                                      )}
                                   </div>

                                   {/* Imposter Editor */}
                                   <div className="bg-slate-50/30 p-6 rounded-3xl border border-slate-100">
                                      <div className="flex items-center gap-3 mb-6">
                                         <div className={`w-4 h-4 rounded-full shadow-inner ${gData.games.imposter_spyfall.applicable ? 'bg-green-500 shadow-green-200' : 'bg-slate-300'}`}></div>
                                         <h4 className="font-black text-slate-900 text-lg">Social Deduction Data</h4>
                                         <label className="ml-auto flex items-center gap-3 text-xs font-black text-slate-500 cursor-pointer bg-white px-4 py-2 rounded-xl border border-slate-200 hover:border-brand-500 transition-all">
                                             <input 
                                               type="checkbox"
                                               checked={gData.games.imposter_spyfall.applicable}
                                               onChange={(e) => {
                                                   const updated = { ...gData };
                                                   updated.games.imposter_spyfall.applicable = e.target.checked;
                                                   handleUpdateGamifiedData(idx, updated);
                                               }}
                                               className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 transition-all"
                                             />
                                             ENABLE COMPONENT
                                         </label>
                                      </div>
                                      {gData.games.imposter_spyfall.applicable && (
                                         <div className="space-y-8">
                                            <div className="max-w-md">
                                               <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest text-brand-600">Confidential Keyphrase</label>
                                               <input 
                                                 type="text"
                                                 value={gData.games.imposter_spyfall.secret_word}
                                                 onChange={(e) => {
                                                    const updated = { ...gData };
                                                    updated.games.imposter_spyfall.secret_word = e.target.value;
                                                    handleUpdateGamifiedData(idx, updated);
                                                 }}
                                                 className="w-full border-2 border-slate-100 rounded-xl px-5 py-3 text-lg bg-white font-black text-slate-900 tracking-wider shadow-inner focus:border-brand-500 outline-none"
                                               />
                                            </div>
                                            <div>
                                               <label className="block text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">Intelligence Transmissions (Game Questions)</label>
                                               <div className="grid grid-cols-1 gap-6">
                                                   {gData.games.imposter_spyfall.derived_questions.map((iq, iqIdx) => (
                                                   <div key={iqIdx} className="p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm relative">
                                                       <div className="mb-6">
                                                           <label className="text-[9px] font-black text-brand-500 uppercase tracking-widest block mb-2">DIALOGUE STRING</label>
                                                           <input 
                                                               value={iq.question}
                                                               onChange={(e) => {
                                                                   const updated = { ...gData };
                                                                   updated.games.imposter_spyfall.derived_questions[iqIdx].question = e.target.value;
                                                                   handleUpdateGamifiedData(idx, updated);
                                                               }}
                                                               className="w-full border-none p-0 text-xl font-black text-slate-900 bg-transparent focus:ring-0"
                                                               placeholder="Question phrasing..."
                                                           />
                                                       </div>
                                                       
                                                       <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                                                           <div className="md:col-span-4">
                                                               <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Input Protocol</label>
                                                               <div className="relative">
                                                                  <select
                                                                      value={iq.type}
                                                                      onChange={(e) => {
                                                                          const updated = { ...gData };
                                                                          updated.games.imposter_spyfall.derived_questions[iqIdx].type = e.target.value as any;
                                                                          handleUpdateGamifiedData(idx, updated);
                                                                      }}
                                                                      className="w-full appearance-none border-2 border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black text-slate-600 bg-white hover:border-slate-200 outline-none transition-all cursor-pointer"
                                                                  >
                                                                      <option value="text">Free Text Input</option>
                                                                      <option value="multiple_choice">Choice Selection</option>
                                                                      <option value="scale">Linear Scale</option>
                                                                  </select>
                                                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                                               </div>
                                                           </div>
                                                           
                                                           {iq.type !== 'text' && (
                                                               <div className="md:col-span-8">
                                                                   <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Available Response Keys</label>
                                                                   <div className="flex flex-wrap gap-2">
                                                                       {(iq.choices_scales || []).map((choice, cIdx) => (
                                                                           <div key={cIdx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm focus-within:border-brand-500 transition-all">
                                                                               <input 
                                                                                   value={choice}
                                                                                   onChange={(e) => {
                                                                                       const updated = { ...gData };
                                                                                       const newChoices = [...(updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales || [])];
                                                                                       newChoices[cIdx] = e.target.value;
                                                                                       updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales = newChoices;
                                                                                       handleUpdateGamifiedData(idx, updated);
                                                                                   }}
                                                                                   className="border-none p-0 text-xs font-bold bg-transparent focus:ring-0 min-w-[60px]"
                                                                               />
                                                                               <button 
                                                                                   onClick={() => {
                                                                                       const updated = { ...gData };
                                                                                       const current = updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales || [];
                                                                                       updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales = current.filter((_, i) => i !== cIdx);
                                                                                       handleUpdateGamifiedData(idx, updated);
                                                                                   }}
                                                                                   className="text-slate-300 hover:text-red-500 transition-colors"
                                                                               >
                                                                                   <X size={14} />
                                                                               </button>
                                                                           </div>
                                                                       ))}
                                                                       <button 
                                                                           onClick={() => {
                                                                               const updated = { ...gData };
                                                                               const choices = [...(updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales || []), ''];
                                                                               updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales = choices;
                                                                               handleUpdateGamifiedData(idx, updated);
                                                                           }}
                                                                           className="btn-sm bg-white hover:bg-brand-50 text-brand-600 border-2 border-dashed border-brand-100 flex items-center gap-2 transition-all uppercase tracking-widest font-black"
                                                                       >
                                                                           <Plus size={14}/> Add Data Node
                                                                       </button>
                                                                   </div>
                                                               </div>
                                                           )}
                                                       </div>
                                                   </div>
                                                   ))}
                                               </div>
                                            </div>
                                         </div>
                                      )}
                                   </div>
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
              )}
           </div>
         )}
      </div>

      {/* AI Gamification Modal - Enhanced UI */}
      {showGamifyModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-10 max-w-xl w-full shadow-[0_0_100px_rgba(0,0,0,0.2)] animate-in zoom-in slide-in-from-bottom-8 duration-500 border border-slate-100 my-auto">
            <div className="bg-purple-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 text-white shadow-2xl shadow-purple-200">
              <Wand2 size={32} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">AI Gamification</h2>
            <p className="text-slate-500 mb-10 font-bold leading-relaxed">
               Provide context to help Gemini translate your requirements into immersive gameplay mechanics.
            </p>

            <div className="space-y-8 mb-12">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 focus-within:border-brand-500 transition-colors">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Organization Identity</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Atlas Tech"
                  className="w-full border-none p-0 text-2xl font-black bg-transparent focus:ring-0 text-slate-900 placeholder:text-slate-200"
                />
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 focus-within:border-brand-500 transition-colors">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Operational Purpose</label>
                <textarea 
                  value={productDesc}
                  onChange={e => setProductDesc(e.target.value)}
                  placeholder="Explain the mission objectives..."
                  rows={3}
                  className="w-full border-none p-0 text-lg font-bold bg-transparent focus:ring-0 text-slate-900 placeholder:text-slate-200 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-6">
              <button 
                onClick={() => setShowGamifyModal(false)}
                className="btn-lg flex-1 text-slate-400 font-black hover:bg-slate-50 rounded-3xl transition-all uppercase tracking-widest text-xs border-2 border-transparent"
                disabled={isProcessing}
              >
                Abort
              </button>
              <button 
                onClick={handleGamify}
                disabled={isProcessing || !companyName || !productDesc}
                className="btn-hero flex-2 bg-slate-900 text-white hover:bg-black shadow-2xl shadow-slate-300 text-base"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <RefreshCw size={24} />}
                {isProcessing ? 'Synthesizing...' : 'Calibrate AI'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
