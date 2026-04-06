import { useState } from 'react';
import { Send, Bot, User, Users, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MatchedEmployee {
  id: string;
  name: string;
  match_score: number;
  matched_skills: string[];
  gap_skills: string[];
}

export default function ProjectAllocator() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am the AI Allocation Agent. Please describe the project, required skills, timeline, and team size you need.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchedEmployee[]>([]);
  const [shortage, setShortage] = useState<boolean>(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      // In a real scenario, this invokes the edge function edge function: supabase.functions.invoke('allocate-project', { body: { brief: userMsg } })
      // For now, if edge functions aren't deployed, we simulate the UI behavior.
      const { data, error } = await supabase.functions.invoke('allocate-project', {
        body: { brief: userMsg }
      });

      if (error) {
        throw error;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.message || 'I have analyzed the current workforce and found these optimal allocations.' }]);
      if (data.matched_employees) setMatches(data.matched_employees);
      if (data.workforce_shortage) setShortage(true);
      
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '[Error: Unable to reach AI agent. Ensure edge functions are deployed.] But here is a simulated response to demonstrate the UI: I found 2 suitable candidates.' 
      }]);
      // Mock Data to display UI
      setMatches([
        { id: '1', name: 'Alice Smith', match_score: 95, matched_skills: ['React', 'Node.js'], gap_skills: [] },
        { id: '2', name: 'Bob Jones', match_score: 80, matched_skills: ['React'], gap_skills: ['Node.js'] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Chat Agent Left Panel */}
      <div className="w-1/2 flex flex-col bg-card border rounded-lg shadow-sm overflow-hidden text-sm relative">
        <div className="h-14 border-b bg-secondary/30 flex items-center px-4 font-semibold text-primary gap-2">
          <Bot className="w-5 h-5"/> Allocation Agent
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0"><Bot className="w-4 h-4"/></div>}
              <div className={`p-3 rounded-lg max-w-[80%] ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-secondary text-secondary-foreground rounded-tl-none'}`}>
                {m.content}
              </div>
              {m.role === 'user' && <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"><User className="w-4 h-4"/></div>}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0"><Bot className="w-4 h-4"/></div>
              <div className="p-3 rounded-lg bg-secondary text-secondary-foreground rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing workforce...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t bg-background flex items-center gap-2">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type project brief here..."
            className="flex-1 border bg-secondary/10 rounded-md px-3 py-2 outline-none focus:ring-2 ring-primary/50"
            disabled={loading}
          />
          <button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 px-4 rounded-md flex items-center gap-2 transition-colors">
            <Send className="w-4 h-4"/>
          </button>
        </form>
      </div>

      {/* Matches Right Panel */}
      <div className="w-1/2 flex flex-col">
         <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
           <Sparkles className="text-amber-500 w-5 h-5" /> Recommended Team
         </h3>
         <div className="flex-1 overflow-y-auto space-y-4">
           {matches.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-card/50">
                <Users className="w-12 h-12 mb-2 opacity-50" />
                <p>Describe your project to see team recommendations.</p>
             </div>
           ) : (
             <>
               {shortage && (
                 <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-md text-sm">
                   Warning: Workforce shortage detected. Not all required skills can be fully satisfied without significant upskilling.
                 </div>
               )}
               {matches.map(match => (
                 <div key={match.id} className="bg-card border shadow-sm rounded-lg p-5">
                   <div className="flex justify-between items-start mb-3">
                     <h4 className="font-bold text-lg">{match.name}</h4>
                     <div className="flex items-center gap-2">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${match.match_score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-amber-100 text-amber-700'}`}>
                         {match.match_score}% Match
                       </span>
                     </div>
                   </div>
                   <div className="mb-2">
                     <span className="text-xs text-muted-foreground block mb-1">Matched Skills</span>
                     <div className="flex flex-wrap gap-1">
                       {match.matched_skills.map(s => (
                         <span key={s} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">{s}</span>
                       ))}
                     </div>
                   </div>
                   {match.gap_skills.length > 0 && (
                     <div className="mt-2">
                       <span className="text-xs text-muted-foreground block mb-1">Gap/Upskill Required</span>
                       <div className="flex flex-wrap gap-1">
                         {match.gap_skills.map(s => (
                           <span key={s} className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-md">{s}</span>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               ))}
             </>
           )}
         </div>
      </div>
    </div>
  );
}
