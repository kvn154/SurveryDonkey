import React, { useState } from 'react';
import { Survey, Question, QuestionType, GamifiedQuestionData } from '../../types';
import { Plus, Trash2, Save, X, Wand2, Loader2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { gamifySurvey } from '../../services/geminiService';

interface Props {
  initialSurvey?: Survey | null;
  onSave: (survey: Survey) => void;
  onCancel: () => void;
}

const DEFAULT_QUESTION: Question = {
  id: '',
  text: '',
  type: QuestionType.OPEN_ENDED,
  options: []
};

export const SurveyEditor: React.FC<Props> = ({ initialSurvey, onSave, onCancel }) => {
  const [survey, setSurvey] = useState<Survey>(
    initialSurvey || {
      id: crypto.randomUUID(),
      title: '',
      questions: [{ ...DEFAULT_QUESTION, id: crypto.randomUUID() }],
      createdAt: Date.now()
    }
  );

  // Gamification Modal State
  const [showGamifyModal, setShowGamifyModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'questions' | 'games'>('questions');
  const [expandedGameIndex, setExpandedGameIndex] = useState<number | null>(0);

  const handleUpdateSurvey = (field: keyof Survey, value: any) => {
    setSurvey(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...survey.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
  };

  // --- Option Management for Original Questions ---

  const handleAddOption = (qIndex: number) => {
    const updatedQuestions = [...survey.questions];
    const currentOptions = updatedQuestions[qIndex].options || [];
    updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], options: [...currentOptions, ''] };
    setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updatedQuestions = [...survey.questions];
    const currentOptions = [...(updatedQuestions[qIndex].options || [])];
    currentOptions[optIndex] = value;
    updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], options: currentOptions };
    setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const updatedQuestions = [...survey.questions];
    const currentOptions = updatedQuestions[qIndex].options || [];
    updatedQuestions[qIndex] = { 
        ...updatedQuestions[qIndex], 
        options: currentOptions.filter((_, i) => i !== optIndex) 
    };
    setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
  };

  // -----------------------------------------------

  const handleAddQuestion = () => {
    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, { ...DEFAULT_QUESTION, id: crypto.randomUUID() }]
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleGamify = async () => {
    if (!companyName || !productDesc) return;
    setIsProcessing(true);
    try {
      const data = await gamifySurvey(companyName, productDesc, survey.questions);
      setSurvey(prev => ({ ...prev, gamifiedData: data }));
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
      const updated = [...survey.gamifiedData];
      updated[index] = newData;
      setSurvey(prev => ({ ...prev, gamifiedData: updated }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-10">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">
             {initialSurvey ? 'Edit Survey' : 'New Survey'}
           </h2>
        </div>
        <div className="flex gap-2">
           <button onClick={onCancel} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg">
             Cancel
           </button>
           <button 
             onClick={() => onSave(survey)}
             disabled={!survey.title || survey.questions.some(q => !q.text)}
             className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-brand-700 disabled:opacity-50"
           >
             <Save size={18} /> Save Survey
           </button>
        </div>
      </div>

      <div className="p-6">
         <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-1">Survey Title</label>
            <input 
              type="text"
              value={survey.title}
              onChange={e => handleUpdateSurvey('title', e.target.value)}
              className="w-full text-lg border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              placeholder="e.g. Q1 Product Feedback"
            />
         </div>

         {/* Tabs */}
         <div className="flex border-b border-slate-200 mb-6">
            <button 
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-3 font-bold border-b-2 transition-colors ${activeTab === 'questions' ? 'border-brand-500 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
               Original Questions
            </button>
            <button 
              onClick={() => setActiveTab('games')}
              className={`px-6 py-3 font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'games' ? 'border-purple-500 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
               <Wand2 size={16} /> Game Version
            </button>
         </div>

         {/* Questions Editor */}
         {activeTab === 'questions' && (
           <div className="space-y-6">
              {survey.questions.map((q, idx) => (
                 <div key={q.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                    <div className="flex gap-4 mb-4">
                       <div className="mt-3 text-slate-400 cursor-move"><GripVertical size={20}/></div>
                       <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                             <label className="text-xs font-bold text-slate-500 uppercase">Question {idx + 1}</label>
                             <button onClick={() => handleRemoveQuestion(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                          </div>
                          <input 
                             type="text"
                             value={q.text}
                             onChange={e => handleUpdateQuestion(idx, 'text', e.target.value)}
                             className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-brand-500 outline-none mb-3 font-medium bg-white"
                             placeholder="Enter question text..."
                          />
                          
                          <div className="flex flex-col md:flex-row gap-4">
                             <div className="w-full md:w-1/3">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                                <select 
                                  value={q.type}
                                  onChange={e => handleUpdateQuestion(idx, 'type', e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                                >
                                   <option value={QuestionType.OPEN_ENDED}>Open Ended</option>
                                   <option value={QuestionType.SINGLE_CHOICE}>Single Choice</option>
                                   <option value={QuestionType.RANKING}>Ranking</option>
                                   <option value={QuestionType.LIKERT}>Likert Scale</option>
                                </select>
                             </div>
                             
                             {(q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.RANKING) && (
                               <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200">
                                  <label className="block text-xs font-bold text-slate-500 mb-2">Options</label>
                                  <div className="space-y-2">
                                     {(q.options || []).map((opt, optIdx) => (
                                        <div key={optIdx} className="flex gap-2">
                                           <input 
                                              type="text"
                                              value={opt}
                                              onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                                              className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                                              placeholder={`Option ${optIdx + 1}`}
                                           />
                                           <button 
                                              onClick={() => handleRemoveOption(idx, optIdx)}
                                              className="text-slate-400 hover:text-red-500 p-1"
                                           >
                                              <X size={16} />
                                           </button>
                                        </div>
                                     ))}
                                  </div>
                                  <button 
                                    onClick={() => handleAddOption(idx)}
                                    className="mt-3 text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                                  >
                                    <Plus size={14} /> Add Option
                                  </button>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
              
              <button onClick={handleAddQuestion} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-brand-500 hover:text-brand-600 transition-colors flex items-center justify-center gap-2 bg-white">
                 <Plus size={20} /> Add Question
              </button>
           </div>
         )}

         {/* Games Editor */}
         {activeTab === 'games' && (
           <div>
              {!survey.gamifiedData ? (
                 <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                    <Wand2 size={48} className="mx-auto text-purple-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Not Gamified Yet</h3>
                    <p className="text-slate-500 mb-6">Generate game content using Gemini AI based on your questions.</p>
                    <button 
                      onClick={() => setShowGamifyModal(true)}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 inline-flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                    >
                       <Wand2 size={16} /> Generate Game Content
                    </button>
                 </div>
              ) : (
                 <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4 bg-purple-50 p-4 rounded-lg border border-purple-100">
                       <p className="text-sm text-purple-800 font-medium">
                          These games are ready to play! You can tweak the generated content below.
                       </p>
                       <button 
                          onClick={() => setShowGamifyModal(true)}
                          className="bg-white text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-purple-50 flex items-center gap-1 transition-colors"
                       >
                          <Wand2 size={14} /> Regenerate
                       </button>
                    </div>

                    {survey.gamifiedData.map((gData, idx) => (
                       <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                          <div 
                            onClick={() => setExpandedGameIndex(expandedGameIndex === idx ? null : idx)}
                            className="bg-slate-50 p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                             <div className="flex-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Original Question</span>
                                <p className="font-medium text-slate-700">{gData.original_question}</p>
                             </div>
                             <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    {gData.games.top_tier_rank.applicable && (
                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Rank</span>
                                    )}
                                    {gData.games.imposter_spyfall.applicable && (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Imposter</span>
                                    )}
                                </div>
                                {expandedGameIndex === idx ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                             </div>
                          </div>

                          {expandedGameIndex === idx && (
                             <div className="p-4 bg-white border-t border-slate-200 space-y-8">
                                {/* Top Tier Editor */}
                                <div>
                                   <div className="flex items-center gap-2 mb-3">
                                      <div className={`w-3 h-3 rounded-full ${gData.games.top_tier_rank.applicable ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                      <h4 className="font-bold text-slate-800">Top Tier Rank Data</h4>
                                      <label className="ml-auto flex items-center gap-2 text-xs font-medium cursor-pointer">
                                          <input 
                                            type="checkbox"
                                            checked={gData.games.top_tier_rank.applicable}
                                            onChange={(e) => {
                                                const updated = { ...gData };
                                                updated.games.top_tier_rank.applicable = e.target.checked;
                                                handleUpdateGamifiedData(idx, updated);
                                            }}
                                            className="rounded text-brand-600 focus:ring-brand-500"
                                          />
                                          Enabled
                                      </label>
                                   </div>
                                   {gData.games.top_tier_rank.applicable && (
                                      <div className="pl-5 space-y-4 border-l-2 border-slate-100 ml-1.5">
                                         <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Rankable Concepts (One per line)</label>
                                            <textarea 
                                              value={gData.games.top_tier_rank.concepts.join('\n')}
                                              onChange={(e) => {
                                                 const newConcepts = e.target.value.split('\n');
                                                 const updated = { ...gData };
                                                 updated.games.top_tier_rank.concepts = newConcepts;
                                                 handleUpdateGamifiedData(idx, updated);
                                              }}
                                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-32 font-mono bg-white focus:bg-white transition-colors"
                                            />
                                         </div>
                                         <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Derived Prompts (Title of the ranking queue)</label>
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
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                                                />
                                                ))}
                                            </div>
                                         </div>
                                      </div>
                                   )}
                                </div>

                                {/* Imposter Editor */}
                                <div>
                                   <div className="flex items-center gap-2 mb-3">
                                      <div className={`w-3 h-3 rounded-full ${gData.games.imposter_spyfall.applicable ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                      <h4 className="font-bold text-slate-800">Imposter Data</h4>
                                      <label className="ml-auto flex items-center gap-2 text-xs font-medium cursor-pointer">
                                          <input 
                                            type="checkbox"
                                            checked={gData.games.imposter_spyfall.applicable}
                                            onChange={(e) => {
                                                const updated = { ...gData };
                                                updated.games.imposter_spyfall.applicable = e.target.checked;
                                                handleUpdateGamifiedData(idx, updated);
                                            }}
                                            className="rounded text-brand-600 focus:ring-brand-500"
                                          />
                                          Enabled
                                      </label>
                                   </div>
                                   {gData.games.imposter_spyfall.applicable && (
                                      <div className="pl-5 space-y-4 border-l-2 border-slate-100 ml-1.5">
                                         <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Secret Word</label>
                                            <input 
                                              type="text"
                                              value={gData.games.imposter_spyfall.secret_word}
                                              onChange={(e) => {
                                                 const updated = { ...gData };
                                                 updated.games.imposter_spyfall.secret_word = e.target.value;
                                                 handleUpdateGamifiedData(idx, updated);
                                              }}
                                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-mono"
                                            />
                                         </div>
                                         <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2">Game Questions</label>
                                            <div className="space-y-4">
                                                {gData.games.imposter_spyfall.derived_questions.map((iq, iqIdx) => (
                                                <div key={iqIdx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="mb-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Question Text</label>
                                                        <input 
                                                            value={iq.question}
                                                            onChange={(e) => {
                                                                const updated = { ...gData };
                                                                updated.games.imposter_spyfall.derived_questions[iqIdx].question = e.target.value;
                                                                handleUpdateGamifiedData(idx, updated);
                                                            }}
                                                            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm bg-white"
                                                            placeholder="Question text"
                                                        />
                                                    </div>
                                                    
                                                    <div className="flex gap-3">
                                                        <div className="w-1/3">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Input Type</label>
                                                            <select
                                                                value={iq.type}
                                                                onChange={(e) => {
                                                                    const updated = { ...gData };
                                                                    updated.games.imposter_spyfall.derived_questions[iqIdx].type = e.target.value as any;
                                                                    handleUpdateGamifiedData(idx, updated);
                                                                }}
                                                                className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white"
                                                            >
                                                                <option value="text">Text Input</option>
                                                                <option value="multiple_choice">Multiple Choice</option>
                                                                <option value="scale">Scale</option>
                                                            </select>
                                                        </div>
                                                        
                                                        {iq.type !== 'text' && (
                                                            <div className="flex-1">
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Choices</label>
                                                                <div className="space-y-1">
                                                                    {(iq.choices_scales || []).map((choice, cIdx) => (
                                                                        <div key={cIdx} className="flex gap-1">
                                                                            <input 
                                                                                value={choice}
                                                                                onChange={(e) => {
                                                                                    const updated = { ...gData };
                                                                                    const newChoices = [...(updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales || [])];
                                                                                    newChoices[cIdx] = e.target.value;
                                                                                    updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales = newChoices;
                                                                                    handleUpdateGamifiedData(idx, updated);
                                                                                }}
                                                                                className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                                                                            />
                                                                            <button 
                                                                                onClick={() => {
                                                                                    const updated = { ...gData };
                                                                                    const current = updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales || [];
                                                                                    updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales = current.filter((_, i) => i !== cIdx);
                                                                                    handleUpdateGamifiedData(idx, updated);
                                                                                }}
                                                                                className="text-slate-400 hover:text-red-500"
                                                                            >
                                                                                <X size={12}/>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    <button 
                                                                        onClick={() => {
                                                                            const updated = { ...gData };
                                                                            const current = updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales || [];
                                                                            updated.games.imposter_spyfall.derived_questions[iqIdx].choices_scales = [...current, ''];
                                                                            handleUpdateGamifiedData(idx, updated);
                                                                        }}
                                                                        className="text-[10px] text-brand-600 font-bold flex items-center gap-1 mt-1"
                                                                    >
                                                                        <Plus size={10}/> Add Choice
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
              )}
           </div>
         )}
      </div>

       {/* Internal Gamification Modal */}
       {showGamifyModal && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-200">
               <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                 <Wand2 className="text-purple-600"/> AI Gamification
               </h2>
               <p className="text-slate-500 mb-6">
                 Gemini will analyze your questions and convert them into game assets.
               </p>

               <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Company Name</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white"
                      placeholder="e.g. Acme Corp"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Product Description</label>
                    <textarea 
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 h-24 bg-white"
                      placeholder="e.g. A cloud-based project management tool for creative teams..."
                      value={productDesc}
                      onChange={e => setProductDesc(e.target.value)}
                    />
                  </div>
               </div>

               <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowGamifyModal(false)}
                    className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleGamify}
                    disabled={isProcessing || !companyName || !productDesc}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Wand2 size={16} />}
                    {isProcessing ? 'Generating...' : 'Gamify'}
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};