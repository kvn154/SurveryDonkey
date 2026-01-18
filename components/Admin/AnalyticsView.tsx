import React, { useMemo } from 'react';
import { Survey, SurveyResponse } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props {
  survey: Survey;
  responses: SurveyResponse[];
}

const COLORS = ['#0d9488', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

interface QuestionStat {
  id: string;
  text: string;
  type: 'RANKING' | 'CHOICE';
  data: { name: string; value?: number; score?: number }[];
}

export const AnalyticsView: React.FC<Props> = ({ survey, responses }) => {
  
  const stats = useMemo(() => {
    // 1. Participant Count by Game
    const gameTypeCount = [
      { name: 'Top Tier', value: responses.filter(r => r.gamePlayed === 'TOP_TIER').length },
      { name: 'Imposter', value: responses.filter(r => r.gamePlayed === 'IMPOSTER').length },
    ];

    // 2. Process Question Results
    const questionStats: QuestionStat[] = [];
    
    survey.questions.forEach(q => {
      if (q.type === 'RANKING') {
        // Calculate scores for ranking (S=5 points, D=1 point)
        const scores: Record<string, number> = {};
        q.options?.forEach(opt => scores[opt] = 0);
        
        const relevantResponses = responses.filter(r => r.answers[q.id]);
        
        relevantResponses.forEach(r => {
           const ans = r.answers[q.id]; // { S: [], A: []...}
           if(!ans || typeof ans !== 'object' || Array.isArray(ans)) return;
           
           Object.entries(ans).forEach(([tier, items]) => {
              const points = tier === 'S' ? 5 : tier === 'A' ? 4 : tier === 'B' ? 3 : tier === 'C' ? 2 : 1;
              if (items && Array.isArray(items)) {
                items.forEach(item => {
                   if(item && typeof item === 'string' && scores[item] !== undefined) scores[item] += points;
                });
              }
           });
        });

        const data = Object.entries(scores)
          .map(([name, score]) => ({ name, score }))
          .sort((a,b) => (b.score || 0) - (a.score || 0));
          
        questionStats.push({ id: q.id, text: q.text, type: 'RANKING', data });
      } 
      else if (q.type === 'SINGLE_CHOICE') {
        const counts: Record<string, number> = {};
        q.options?.forEach(opt => counts[opt] = 0);
        
        responses.filter(r => r.answers[q.id]).forEach(r => {
           const val = r.answers[q.id] as string;
           if(counts[val] !== undefined) counts[val]++;
        });
        
        const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
        questionStats.push({ id: q.id, text: q.text, type: 'CHOICE', data });
      }
    });

    return { gameTypeCount, questionStats };
  }, [survey, responses]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <h4 className="text-sm font-bold text-slate-500 uppercase">Total Responses</h4>
            <p className="text-4xl font-bold text-brand-900 mt-2">{responses.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 md:col-span-2">
           <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Engagement by Game</h4>
           <div className="h-40 w-full flex gap-8 items-center">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.gameTypeCount} layout="vertical">
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" width={80} />
                   <Tooltip />
                   <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="space-y-6">
        {stats.questionStats.map((qs) => (
          <div key={qs.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{qs.text}</h3>
            <div className="h-64 w-full">
               {qs.type === 'RANKING' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={qs.data}>
                      <XAxis dataKey="name" fontSize={12} tickLine={false} />
                      <YAxis />
                      <Tooltip />
                       <Bar dataKey="score" fill="#8884d8">
                        {qs.data.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               ) : (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={qs.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name || 'Unknown'} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {qs.data.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
               )}
            </div>
            {qs.type === 'RANKING' && (
               <p className="text-xs text-center text-slate-400 mt-2">Aggregated weighted score (S-tier = 5pts)</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
