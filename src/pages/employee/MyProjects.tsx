import { Briefcase, Calendar } from 'lucide-react';

export default function MyProjects() {
  const currentProject = {
    name: 'Core Platform Revamp',
    role: 'Lead Frontend Developer',
    timeline: 'Jan 2026 - Aug 2026',
    teamSize: 5,
    skills_used: ['React', 'TypeScript', 'Node.js']
  };

  const pastProjects = [
    {
      name: 'Mobile App V2',
      role: 'Frontend Developer',
      timeline: 'Mar 2025 - Nov 2025',
      skills_used: ['React Native', 'UI/UX Design']
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Projects</h2>
          <p className="text-muted-foreground mt-1">View your current assignment and project history.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-4">Current Assignment</h3>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
               <Briefcase className="w-32 h-32" />
             </div>
             
             <h4 className="text-2xl font-bold text-primary mb-1">{currentProject.name}</h4>
             <p className="font-medium mb-4">{currentProject.role}</p>
             
             <div className="flex gap-6 text-sm text-muted-foreground mb-6">
               <div className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {currentProject.timeline}</div>
               <div className="flex items-center gap-1"><Briefcase className="w-4 h-4"/> Team of {currentProject.teamSize}</div>
             </div>

             <div>
               <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Skills Applied</p>
               <div className="flex flex-wrap gap-2">
                 {currentProject.skills_used.map(s => (
                   <span key={s} className="bg-background border px-3 py-1 text-sm rounded-full">{s}</span>
                 ))}
               </div>
             </div>
          </div>
        </div>

        <div>
           <h3 className="text-xl font-bold mb-4 mt-8">Past Projects</h3>
           <div className="grid gap-4">
             {pastProjects.map((p, i) => (
                <div key={i} className="bg-card border rounded-lg p-5">
                   <div className="flex justify-between items-start mb-2">
                     <h4 className="font-bold text-lg">{p.name}</h4>
                     <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-4 h-4"/> {p.timeline}</span>
                   </div>
                   <p className="text-sm font-medium mb-4">{p.role}</p>
                   <div className="flex flex-wrap gap-1">
                     {p.skills_used.map(s => (
                       <span key={s} className="bg-secondary text-secondary-foreground px-2 py-0.5 text-xs rounded-full">{s}</span>
                     ))}
                   </div>
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
