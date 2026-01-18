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
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
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
      {/* Sticky Header - btn-lg scale */}
      <div className="bg-white/95 border border-slate-200 p-5 rounded-3xl flex justify-between items-center sticky top-2 z-50 mb-10 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
           <div className="bg-brand-50 p-3 rounded-2xl border border-brand-100">
              <LayoutGrid className="text-brand-600" size={24} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {initialData ? 'Edit Survey' : 'New Survey'}
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Campaign Designer</p>
           </div>
        </div>
        <div className="flex gap-3">
           <button onClick={onCancel} className="btn-lg text-slate-500 hover:bg-slate-100 transition-colors border-none bg-transparent shadow-none">
             Cancel
           </button>
           <button 
             onClick={handleSave}
             disabled={isSaving || !survey.title || survey.questions?.some(q => !q.text)}
             className="btn-lg bg-slate-900 text-white flex items-center gap-2 hover:bg-black shadow-xl shadow-slate-200"
           >
             {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Survey
           </button>
        </div>
      </div>

      <div className="space-y-8">
         {/* Title Section - High Contrast */}
         <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm focus-within:border-brand-500 transition-colors">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Survey Identification</label>
            <input 
              type="text"
              value={survey.title}
              onChange={e => handleUpdateSurvey('title', e.target.value)}
              className="w-full text-3xl font-black border-none focus:ring-0 p-0 text-slate-900 placeholder:text-slate-200"
              placeholder="e.g. Q1 User Experience Audit"
            />
         </div>

         {/* Navigation Tabs - btn-base scale */}
         <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
            <button 
              onClick={() => setActiveTab('questions')}
              className={`btn-base px-8 flex items-center gap-2 border-none shadow-none ${activeTab === 'questions' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 bg-transparent hover:bg-white/50'}`}
            >
               <ListOrdered size={18} /> Questions
            </button>
            <button 
              onClick={() => setActiveTab('games')}
              className={`btn-base px-8 flex items-center gap-2 border-none shadow-none ${activeTab === 'games' ? 'bg-white text-brand-600 shadow-sm border border-brand-100' : 'text-slate-500 hover:text-slate-700 bg-transparent hover:bg-white/50'}`}
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
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`
                      bg-white p-8 rounded-[2.5rem] border-2 transition-all relative group
                      ${draggedIndex === idx ? 'opacity-20 scale-95 border-brand-500 border-dashed bg-brand-50/10' : 'border-slate-100 hover:border-slate-200 shadow-sm'}
                    `}
                 >
                    <div className="flex gap-8">
                       {/* Drag Handle */}
                       <div className="mt-1 text-slate-300 cursor-grab active:cursor-grabbing group-hover:text-brand-400 transition-colors shrink-0">
                          <GripVertical size={28}/>
                       </div>

                       <div className="flex-1">
                          <div className="flex justify-between items-center mb-6">
                             <div className="flex items-center gap-4">
                                <span className="bg-slate-900 text-white w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-lg">
                                   {idx + 1}
                                </span>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Question Block</label>
                             </div>
                             <button 
                                onClick={() => handleRemoveQuestion(idx)} 
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border-none bg-transparent shadow-none"
                             >
                                <Trash2 size={20}/>
                             </button>
                          </div>
                          
                          <input 
                             type="text"
                             value={q.text}
                             onChange={e => handleUpdateQuestion(idx, 'text', e.target.value)}
                             className="w-full border-2 border-slate-50 rounded-2xl px-6 py-5 focus:border-brand-500 focus:bg-white outline-none mb-8 text-xl font-bold bg-slate-50/50 transition-all placeholder:text-slate-300 shadow-inner"
                             placeholder="What insights are you looking for?"
                          />
                          
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                             <div className="lg:col-span-4">
                                <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Collection Method</label>
                                <div className="relative">
                                   <select 
                                     value={q.type}
                                     onChange={e => handleUpdateQuestion(idx, 'type', e.target.value)}
                                     className="form-select w-full"
                                   >
                                      <option value="OPEN_ENDED">Open Ended Text</option>
                                      <option value="SINGLE_CHOICE">Multiple Choice</option>
                                      <option value="RANKING">Ranking / Sorting</option>
                                      <option value="LIKERT">Likert Scale (1-5)</option>
                                   </select>
                                   <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                      <ChevronDown size={18} />
                                   </div>
                                </div>
                             </div>

                             <div className="lg:col-span-4">
                                <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Game Association</label>
                                <div className="relative">
                                   <select 
                                     value={q.assignedGame || 'BOTH'}
                                     onChange={e => handleUpdateQuestion(idx, 'assignedGame', e.target.value)}
                                     className="form-select w-full"
                                   >
                                      <option value="BOTH">Universal (Both Games)</option>
                                      <option value="TOP_TIER">Top Tier Rank Exclusive</option>
                                      <option value="IMPOSTER">The Imposter Exclusive</option>
                                   </select>
                                   <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                      <ChevronDown size={18} />
                                   </div>
                                </div>
                             </div>
                             
                             {(q.type === 'SINGLE_CHOICE' || q.type === 'RANKING') && (
                               <div className="lg:col-span-12 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 animate-in fade-in zoom-in duration-300">
                                  <div className="flex justify-between items-center mb-6">
                                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Options Management</label>
                                     <button 
                                       onClick={() => handleAddOption(idx)}
                                       className="btn-sm bg-brand-50 text-brand-600 hover:bg-brand-100 flex items-center gap-1 uppercase tracking-wider border-none shadow-none"
                                     >
                                       <Plus size={16} /> Add Option
                                     </button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {(q.options || []).map((opt, optIdx) => (
                                        <div key={optIdx} className="flex gap-3 group/opt animate-in slide-in-from-left-2 duration-200">
                                           <div className="relative flex-1">
                                              <input 
                                                 type="text"
                                                 value={opt}
                                                 onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                                                 className="w-full border-2 border-white rounded-xl px-5 py-3 text-sm font-bold bg-white shadow-sm focus:border-brand-500 outline-none transition-all shadow-slate-200/50"
                                                 placeholder={`Option ${optIdx + 1}`}
                                              />
                                           </div>
                                           <button 
                                              onClick={() => handleRemoveOption(idx, optIdx)}
                                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/opt:opacity-100 border-none bg-transparent shadow-none"
                                           >
                                              <X size={20} />
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
                className="w-full py-12 border-4 border-dashed border-slate-100 rounded-[3rem] text-slate-400 font-black hover:border-brand-200 hover:text-brand-500 hover:bg-brand-50/10 transition-all flex flex-col items-center justify-center gap-4 bg-white/50 group border-none shadow-none"
              >
                 <div className="bg-slate-50 p-5 rounded-[1.5rem] group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors shadow-inner">
                    <Plus size={40} />
                 </div>
                 <span className="uppercase tracking-[0.4em] text-[10px]">Add Question Block</span>
              </button>
           </div>
         )}

         {/* Games Editor - Improved Contrast */}
          {activeTab === 'games' && (
            <div className="animate-in fade-in duration-500">
               {!survey.gamifiedData ? (
                  <div className="text-center py-24 bg-white rounded-[4rem] border-2 border-slate-100 shadow-sm flex flex-col items-center">
                     <div className="bg-brand-50 p-10 rounded-full text-brand-200 mb-10 animate-pulse border border-brand-100">
                        <Wand2 size={80} />
                     </div>
                     <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Game Generator Ready</h3>
                     <p className="text-slate-500 mb-12 max-w-lg mx-auto font-bold leading-relaxed text-lg text-pretty text-center">
                        AI will transform your questions into game content for Top Tier Rank and Imposter.
                     </p>
                     <button 
                       onClick={() => setShowGamifyModal(true)}
                       className="btn-hero px-16 bg-brand-600 text-white hover:bg-brand-700 shadow-2xl shadow-brand-200 flex items-center gap-4 border-none"
                     >
                        <Wand2 size={28} /> Generate Games
                     </button>
                  </div>
               ) : (
                  <div className="space-y-10">
                     <div className="flex justify-between items-center bg-brand-50 p-8 rounded-[2.5rem] border-2 border-brand-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                           <BarChart size={120} className="text-brand-900" />
                        </div>
                        <div className="flex items-center gap-6 relative z-10">
                           <div className="bg-white p-4 rounded-2xl text-brand-600 shadow-sm border border-brand-100">
                              <BarChart size={32} />
                           </div>
                           <div>
                              <p className="text-brand-900 font-black text-xl tracking-tight">Game Content Ready</p>
                              <p className="text-brand-600 font-bold">Content synced with your questions.</p>
                           </div>
                        </div>
                        <button 
                           onClick={() => setShowGamifyModal(true)}
                           className="btn-base bg-white border border-brand-200 text-brand-600 hover:bg-brand-50 transition-all flex items-center gap-2 relative z-10 shadow-sm"
                        >
                           <RefreshCw size={18} /> Regenerate
                        </button>
                     </div>

                     <div className="space-y-6">
                        {(survey.gamifiedData as GamifiedQuestionData[]).map((gData, idx) => (
                           <div key={idx} className="border-2 border-slate-100 rounded-[3rem] overflow-hidden shadow-sm bg-white hover:border-slate-200 transition-colors">
                              <div 
                                onClick={() => setExpandedGameIndex(expandedGameIndex === idx ? null : idx)}
                                className="bg-slate-50/50 p-8 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                              >
                                 <div className="flex-1">
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Original Question</span>
                                   <p className="font-black text-slate-800 text-xl line-clamp-1">{gData.original_question}</p>
                                 </div>
                                 <div className="flex items-center gap-6">
                                    <div className="flex gap-3">
                                        {gData.games.top_tier_rank.applicable && (
                                            <span className="text-[10px] bg-rank-100 text-rank-600 px-4 py-1.5 rounded-xl font-black uppercase tracking-widest shadow-sm">Rank</span>
                                        )}
                                        {gData.games.imposter_spyfall.applicable && (
                                            <span className="text-[10px] bg-imposter-100 text-imposter-600 px-4 py-1.5 rounded-xl font-black uppercase tracking-widest shadow-sm">Imposter</span>
                                        )}
                                    </div>
                                   <div className={`text-slate-400 transition-transform duration-500 ${expandedGameIndex === idx ? 'rotate-180' : ''}`}>
                                      <ChevronDown size={32} />
                                   </div>
                                </div>
                             </div>

                             {expandedGameIndex === idx && (
                                <div className="p-10 bg-white border-t border-slate-100 space-y-12 animate-in slide-in-from-top-8 duration-700">
                                   {/* Top Tier Editor */}
                                   <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                      <div className="flex items-center gap-4 mb-8">
                                         <div className={`w-5 h-5 rounded-full shadow-inner ring-4 ring-white ${gData.games.top_tier_rank.applicable ? 'bg-rank-500 shadow-rank-100' : 'bg-slate-300'}`}></div>
                                         <h4 className="font-black text-slate-900 text-xl tracking-tight">Top Tier Settings</h4>
                                         <label className="ml-auto flex items-center gap-4 text-xs font-black text-slate-500 cursor-pointer bg-white px-6 py-3 rounded-2xl border-2 border-slate-100 hover:border-brand-500 transition-all shadow-sm">
                                             <input 
                                               type="checkbox"
                                               checked={gData.games.top_tier_rank.applicable}
                                               onChange={(e) => {
                                                   const updated = { ...gData };
                                                   updated.games.top_tier_rank.applicable = e.target.checked;
                                                   handleUpdateGamifiedData(idx, updated);
                                               }}
                                               className="rounded text-rank-600 focus:ring-rank-500 w-5 h-5 transition-all"
                                             />
                                             ENABLED
                                         </label>
                                      </div>
                                      {gData.games.top_tier_rank.applicable && (
                                         <div className="space-y-8">
                                            <div>
                                               <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em]">Items to Rank</label>
                                               <textarea 
                                                 value={gData.games.top_tier_rank.concepts.join('\n')}
                                                 onChange={(e) => {
                                                    const newConcepts = e.target.value.split('\n');
                                                    const updated = { ...gData };
                                                    updated.games.top_tier_rank.concepts = newConcepts;
                                                    handleUpdateGamifiedData(idx, updated);
                                                 }}
                                                 className="w-full border-2 border-slate-100 rounded-[1.5rem] px-6 py-5 text-sm h-48 font-mono bg-white focus:border-brand-500 outline-none transition-all shadow-inner"
                                                 placeholder="Add entities to rank..."
                                               />
                                            </div>
                                            <div>
                                               <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em]">Game Questions</label>
                                               <div className="space-y-3">
                                                   {gData.games.top_tier_rank.derived_questions.map((dq, dqIdx) => (
                                                   <input 
                                                       key={dqIdx}
                                                       value={dq}
                                                       onChange={(e) => {
                                                           const updated = { ...gData };
                                                           updated.games.top_tier_rank.derived_questions[dqIdx] = e.target.value;
                                                           handleUpdateGamifiedData(idx, updated);
                                                       }}
                                                       className="w-full border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold bg-white focus:border-brand-500 outline-none transition-all"
                                                   />
                                                   ))}
                                               </div>
                                            </div>
                                         </div>
                                      )}
                                   </div>

                                   {/* Imposter Editor */}
                                   <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                      <div className="flex items-center gap-4 mb-8">
                                         <div className={`w-5 h-5 rounded-full shadow-inner ring-4 ring-white ${gData.games.imposter_spyfall.applicable ? 'bg-imposter-500 shadow-imposter-100' : 'bg-slate-300'}`}></div>
                                         <h4 className="font-black text-slate-900 text-xl tracking-tight">Imposter Settings</h4>
                                         <label className="ml-auto flex items-center gap-4 text-xs font-black text-slate-500 cursor-pointer bg-white px-6 py-3 rounded-2xl border-2 border-slate-100 hover:border-brand-500 transition-all shadow-sm">
                                             <input 
                                               type="checkbox"
                                               checked={gData.games.imposter_spyfall.applicable}
                                               onChange={(e) => {
                                                   const updated = { ...gData };
                                                   updated.games.imposter_spyfall.applicable = e.target.checked;
                                                   handleUpdateGamifiedData(idx, updated);
                                               }}
                                               className="rounded text-imposter-600 focus:ring-imposter-500 w-5 h-5 transition-all"
                                             />
                                             ENABLED
                                         </label>
                                      </div>
                                      {gData.games.imposter_spyfall.applicable && (
                                         <div className="space-y-10">
                                            <div className="max-w-md">
                                               <label className="block text-[10px] font-black text-imposter-600 mb-3 uppercase tracking-[0.2em]">Secret Word</label>
                                               <input 
                                                 type="text"
                                                 value={gData.games.imposter_spyfall.secret_word}
                                                 onChange={(e) => {
                                                    const updated = { ...gData };
                                                    updated.games.imposter_spyfall.secret_word = e.target.value;
                                                    handleUpdateGamifiedData(idx, updated);
                                                 }}
                                                 className="w-full border-2 border-slate-100 rounded-2xl px-6 py-4 text-xl bg-white font-black text-slate-900 tracking-[0.1em] shadow-inner focus:border-brand-500 outline-none"
                                               />
                                            </div>
                                            <div>
                                               <label className="block text-[10px] font-black text-slate-500 mb-6 uppercase tracking-[0.2em]">Imposter Questions</label>
                                               <div className="grid grid-cols-1 gap-8">
                                                   {gData.games.imposter_spyfall.derived_questions.map((iq, iqIdx) => (
                                                   <div key={iqIdx} className="p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-md relative">
                                                       <div className="mb-8">
                                                           <label className="text-[9px] font-black text-imposter-600 uppercase tracking-[0.3em] block mb-3">QUESTION</label>
                                                           <input 
                                                               value={iq.question}
                                                               onChange={(e) => {
                                                                   const updated = { ...gData };
                                                                   updated.games.imposter_spyfall.derived_questions[iqIdx].question = e.target.value;
                                                                   handleUpdateGamifiedData(idx, updated);
                                                               }}
                                                               className="w-full border-none p-0 text-2xl font-black text-slate-900 bg-transparent focus:ring-0 placeholder:text-slate-200"
                                                               placeholder="Question phrasing..."
                                                           />
                                                       </div>
                                                       
                                                       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                                                           <div className="lg:col-span-4">
                                                               <label className="text-[10px] font-black text-slate-500 uppercase mb-3 block tracking-[0.2em]">Response Type</label>
                                                               <div className="relative">
                                                                  <select
                                                                      value={iq.type}
                                                                      onChange={(e) => {
                                                                          const updated = { ...gData };
                                                                          updated.games.imposter_spyfall.derived_questions[iqIdx].type = e.target.value as any;
                                                                          handleUpdateGamifiedData(idx, updated);
                                                                      }}
                                                                      className="form-select w-full py-4 text-xs"
                                                                  >
                                                                      <option value="text">Free Text</option>
                                                                      <option value="multiple_choice">Multiple Choice</option>
                                                                      <option value="scale">Scale</option>
                                                                  </select>
                                                                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                                               </div>
                                                           </div>
                                                           
                                                           {iq.type !== 'text' && (
                                                               <div className="lg:col-span-8">
                                                                   <label className="text-[10px] font-black text-slate-500 uppercase mb-3 block tracking-[0.2em]">Options</label>
                                                                   <div className="flex flex-wrap gap-3">
                                                                       {(iq.choices_scales || []).map((choice, cIdx) => (
                                                                           <div key={cIdx} className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-2 shadow-sm focus-within:border-brand-500 transition-all">
                                                                               <input 
                                                                                   value={choice}
                                                                                   onChange={(e) => {
                                                                                       const updated = { ...gData };
                                                                                       const newChoices = [...(updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales || [])];
                                                                                       newChoices[cIdx] = e.target.value;
                                                                                       updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales = newChoices;
                                                                                       handleUpdateGamifiedData(idx, updated);
                                                                                   }}
                                                                                   className="border-none p-0 text-sm font-bold bg-transparent focus:ring-0 min-w-[100px] text-slate-700"
                                                                               />
                                                                               <button 
                                                                                   onClick={() => {
                                                                                       const updated = { ...gData };
                                                                                       const current = updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales || [];
                                                                                       updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales = current.filter((_, i) => i !== cIdx);
                                                                                       handleUpdateGamifiedData(idx, updated);
                                                                                   }}
                                                                                   className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border-none shadow-none bg-transparent"
                                                                               >
                                                                                   <X size={18} />
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
                                                                           className="btn-sm bg-white hover:bg-brand-50 text-brand-600 border-2 border-dashed border-brand-100 px-6 py-3 rounded-2xl flex items-center gap-2 transition-all uppercase tracking-widest font-black shadow-none"
                                                                       >
                                                                           <Plus size={18}/> Add Option
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

      {showGamifyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-brand-100 p-2 rounded-lg">
                <Wand2 size={20} className="text-brand-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Generate Games</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Company/Brand</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:border-brand-500 outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Survey Context</label>
                <textarea 
                  value={productDesc}
                  onChange={e => setProductDesc(e.target.value)}
                  placeholder="What is this survey about?"
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:border-brand-500 outline-none text-slate-900 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowGamifyModal(false)}
                className="flex-1 px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                onClick={handleGamify}
                disabled={isProcessing || !companyName || !productDesc}
                className="flex-1 bg-brand-600 text-white px-4 py-2.5 font-medium hover:bg-brand-700 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                {isProcessing ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
