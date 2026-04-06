import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Plus, Pencil } from 'lucide-react';

// Mock data to simulate API response if empty
const MOCK_RADAR_DATA = [
  { subject: 'React', level: 80, fullMark: 100 },
  { subject: 'Node.js', level: 60, fullMark: 100 },
  { subject: 'Problem Solving', level: 90, fullMark: 100 },
  { subject: 'Communication', level: 85, fullMark: 100 },
  { subject: 'UI/UX', level: 40, fullMark: 100 },
  { subject: 'Cloud', level: 50, fullMark: 100 },
];

export default function MyProfile() {
  const { user } = useAuth();
  
  const { data: skills, isLoading } = useQuery({
    queryKey: ['employee-skills', user?.id],
    queryFn: async () => {
      // Intentionally simulating if user is empty or not in DB yet
      if (!user?.id) return [];
      const { data } = await supabase.from('employee_skills').select('*, skills(name, category)').eq('employee_id', user.id);
      return data || [];
    },
    enabled: !!user?.id
  });

  const getLevelValue = (level: string) => {
    switch(level) {
      case 'Expert': return 100;
      case 'Advanced': return 75;
      case 'Intermediate': return 50;
      case 'Beginner': return 25;
      default: return 0;
    }
  };

  const radarData = skills && skills.length > 0 
    ? skills.map((s: any) => ({
        subject: s.skills?.name || 'Unknown',
        level: getLevelValue(s.proficiency_level),
        fullMark: 100
      }))
    : MOCK_RADAR_DATA;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Skill Profile</h2>
          <p className="text-muted-foreground mt-1">Manage your skills, proficiency levels, and view your competency radar.</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4"/> Add Skill
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar Chart Panel */}
        <div className="bg-card border shadow-sm rounded-lg p-6 flex flex-col">
          <h3 className="font-semibold text-lg mb-4">Competency Map</h3>
          <div className="flex-1 min-h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} stroke="transparent" />
                <Radar name="My Skills" dataKey="level" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill List Panel */}
        <div className="bg-card border shadow-sm rounded-lg overflow-hidden flex flex-col">
           <div className="p-6 border-b flex justify-between items-center bg-secondary/20">
             <h3 className="font-semibold text-lg">Verified Skills Matrix</h3>
           </div>
           <div className="flex-1 overflow-y-auto p-0">
             <table className="w-full text-sm text-left">
              <thead className="bg-secondary/40 text-secondary-foreground font-medium">
                <tr>
                  <th className="px-6 py-3">Skill</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Proficiency</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Fallback to mock loop if empty */}
                {(skills && skills.length > 0 ? skills : [
                  { id: 1, skills: { name: 'React', category: 'Technical' }, proficiency_level: 'Expert', is_verified: true },
                  { id: 2, skills: { name: 'Node.js', category: 'Technical'}, proficiency_level: 'Intermediate', is_verified: false },
                  { id: 3, skills: { name: 'Team Leadership', category: 'Soft Skills'}, proficiency_level: 'Advanced', is_verified: true }
                ]).map((s: any) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-secondary/10 group cursor-pointer">
                    <td className="px-6 py-4 font-medium flex items-center justify-between">
                      {s.skills?.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{s.skills?.category}</td>
                    <td className="px-6 py-4">
                      <span className="bg-secondary px-2 py-1 rounded text-xs">{s.proficiency_level}</span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                       {s.is_verified ? (
                         <span className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-500/10 px-2 py-1 rounded">
                           <ShieldCheck className="w-3.5 h-3.5" /> Verified
                         </span>
                       ) : (
                         <span className="text-muted-foreground text-xs px-2 py-1 border rounded">Unverified</span>
                       )}
                       <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded"><Pencil className="w-4 h-4 text-muted-foreground"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
}
