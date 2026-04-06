import { useState } from 'react';
import { Target, Cpu, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function SkillGapToGoal() {
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any[] | null>(null);

  const generateRoadmap = async () => {
    if (!role) return;
    setLoading(true);
    
    try {
      // Simulate API Call to Supabase Edge Function 'generate-learning-path'
      // const { data } = await supabase.functions.invoke('generate-learning-path', { body: { targetRole: role }});
      await new Promise(r => setTimeout(r, 1500));
      
      setRoadmap([
        { step: 1, title: 'Master Advanced State Management', description: 'Learn Redux Toolkit and Zustand deep dives.', estimate: '2 weeks' },
        { step: 2, title: 'Backend API Integration', description: 'Understand RESTful principles and GraphQL fundamentals.', estimate: '3 weeks' },
        { step: 3, title: 'Cloud Deployment (AWS)', description: 'Get AWS Cloud Practitioner certified. Learn EC2, S3, RDS.', estimate: '4 weeks' }
      ]);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Skill Gap To Goal</h2>
          <p className="text-muted-foreground mt-1">Select your target role and let AI generate a personalized upskilling timeline.</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-primary"/> Career Target</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Select Future Role</label>
            <select 
              className="w-full border p-2.5 rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="">-- Select a role --</option>
              <option value="Senior Full Stack Engineer">Senior Full Stack Engineer</option>
              <option value="Machine Learning Engineer">Machine Learning Engineer</option>
              <option value="Engineering Manager">Engineering Manager</option>
            </select>
          </div>
          <button 
            onClick={generateRoadmap} 
            disabled={!role || loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-md font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Cpu className="w-4 h-4" />}
            Generate Roadmap
          </button>
        </div>
      </div>

      {roadmap && (
        <div className="mt-8 space-y-6">
           <h3 className="text-xl font-bold">Your AI Upskilling Roadmap</h3>
           <div className="relative border-l-2 border-primary/30 ml-3 md:ml-0 md:border-none space-y-8 md:space-y-0">
             {roadmap.map((step, index) => (
                <div key={index} className="md:flex items-start mb-8 relative">
                   <div className="hidden md:flex flex-col items-center w-24 shrink-0 pt-1">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold relative z-10 shadow ring-4 ring-background">
                         {step.step}
                      </div>
                      {index !== roadmap.length - 1 && <div className="h-full w-0.5 bg-primary/30 absolute top-8 bottom-[-2rem] z-0"></div>}
                   </div>
                   
                   <div className="absolute w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs -left-[13px] top-0 md:hidden">
                     {step.step}
                   </div>

                   <div className="bg-card border rounded-lg p-5 shadow-sm ml-6 md:ml-0 flex-1 hover:border-primary/50 transition-colors">
                     <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-lg text-primary">{step.title}</h4>
                       <span className="text-xs font-semibold bg-secondary text-secondary-foreground px-2 py-1 rounded-md">{step.estimate}</span>
                     </div>
                     <p className="text-muted-foreground text-sm">{step.description}</p>
                     
                     <div className="mt-4 pt-4 border-t flex justify-end">
                       <button className="text-sm font-medium flex items-center gap-1 text-primary hover:text-primary/80">
                         View Courses <ArrowRight className="w-4 h-4"/>
                       </button>
                     </div>
                   </div>
                </div>
             ))}
             
             <div className="md:flex items-center -mt-4 relative ml-6 md:ml-0">
                <div className="hidden md:flex justify-center w-24 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center z-10 shadow ring-4 ring-background">
                    <CheckCircle2 className="w-5 h-5"/>
                  </div>
                </div>
                <div className="absolute w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center -left-[13px] top-0 md:hidden">
                   <CheckCircle2 className="w-3 h-3"/>
                </div>
                <h4 className="font-bold text-lg ml-0 md:ml-0 text-green-600">Goal Achieved</h4>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
