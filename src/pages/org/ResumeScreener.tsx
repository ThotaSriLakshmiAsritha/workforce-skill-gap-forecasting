import { useState, useCallback } from 'react';
import { UploadCloud, FileText, CheckCircle2, XCircle, Filter, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Candidate {
  id: string;
  candidate_name: string;
  email: string;
  experience_years: number;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  status: string;
}

export default function ResumeScreener() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Simulation for drag and drop
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    setUploading(true);
    try {
      // For each file, we upload to supabase storage, then call edge function
      // Mocking the result if Supabase is not fully wired up securely yet
      for (const file of files) {
        // const { data, error } = await supabase.storage.from('resumes').upload(`${Date.now()}_${file.name}`, file);
        // await supabase.functions.invoke('screen-resume', { body: { path: data.path, jobId: 'mock-id' } });
        
        // Simulating artificial delay and parsing
        await new Promise(r => setTimeout(r, 1000));
        
        const mockCandidate: Candidate = {
          id: Math.random().toString(),
          candidate_name: file.name.split('.')[0],
          email: `${file.name.split('.')[0].toLowerCase()}@example.com`,
          experience_years: Math.floor(Math.random() * 10) + 1,
          match_score: Math.floor(Math.random() * 40) + 60, // 60-100
          matched_skills: ['React', 'TypeScript', 'Tailwind CSS'],
          missing_skills: ['PostgreSQL', 'Docker'],
          status: 'Processed'
        };
        setCandidates(prev => [mockCandidate, ...prev]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500 border-green-500';
    if (score >= 60) return 'text-amber-500 border-amber-500';
    return 'text-red-500 border-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resume Screener</h2>
          <p className="text-muted-foreground mt-1">Upload resumes to automatically extract skills and match against job requirements.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload & Filter Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Upload Zone */}
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-secondary/50'}
              ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-10 h-10 text-primary mb-4 animate-spin" />
                <p className="font-medium">Analyzing documents...</p>
                <p className="text-sm text-muted-foreground">Extracting via AI Agent</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="font-medium mb-1">Drag and drop resumes here</p>
                <p className="text-sm text-muted-foreground mb-4">PDF, DOCX, TXT. Bulk upload supported.</p>
                <label className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 cursor-pointer text-sm font-medium">
                  Browse Files
                  <input type="file" multiple className="hidden" onChange={onFileSelect} accept=".pdf,.doc,.docx,.txt" />
                </label>
              </>
            )}
          </div>

          {/* Filters */}
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4"><Filter className="w-4 h-4"/> Filter Candidates</h3>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">Target Job Role</label>
                <select className="w-full border bg-background rounded p-2">
                  <option>Senior Full Stack Engineer</option>
                  <option>Product Design Lead</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Min Match Score</label>
                <input type="range" min="0" max="100" defaultValue="70" className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span><span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card p-4 rounded-lg flex items-center justify-between border">
             <div className="text-sm font-medium text-muted-foreground">
               Showing {candidates.length} candidates
             </div>
             {candidates.length > 0 && (
               <div className="text-sm font-medium">
                 Shortlist Rate: <span className="text-green-600">
                   {Math.round((candidates.filter(c => c.match_score > 75).length / candidates.length) * 100) || 0}%
                 </span>
               </div>
             )}
          </div>

          {candidates.length === 0 ? (
            <div className="bg-card border rounded-lg p-12 text-center flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileText className="w-12 h-12 mb-4 opacity-30" />
              <p>No candidates processed yet.</p>
              <p className="text-sm">Upload resumes to see AI extracted profiles.</p>
            </div>
          ) : (
            candidates.map(candidate => (
              <div key={candidate.id} className="bg-card border rounded-lg p-5 flex gap-6 items-center shadow-sm">
                 <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-xl shrink-0 ${getScoreColor(candidate.match_score)}`}>
                   {candidate.match_score}
                 </div>
                 <div className="flex-1">
                   <div className="flex justify-between items-start mb-2">
                     <div>
                       <h3 className="font-bold text-lg leading-tight">{candidate.candidate_name}</h3>
                       <p className="text-sm text-muted-foreground">{candidate.experience_years} years experience</p>
                     </div>
                     <div className="flex gap-2">
                       <button className="flex items-center gap-1 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-500/20">
                         <CheckCircle2 className="w-4 h-4" /> Invite
                       </button>
                       <button className="flex items-center gap-1 bg-red-500/10 text-red-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-500/20">
                         <XCircle className="w-4 h-4" /> Reject
                       </button>
                     </div>
                   </div>
                   
                   <div className="space-y-2 mt-4">
                     <div>
                       <p className="text-xs text-muted-foreground mb-1">Matched Required Skills</p>
                       <div className="flex flex-wrap gap-1">
                         {candidate.matched_skills.map(skill => (
                           <span key={skill} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded border">{skill}</span>
                         ))}
                       </div>
                     </div>
                     {candidate.missing_skills.length > 0 && (
                       <div>
                         <p className="text-xs text-muted-foreground mb-1">Missing Key Skills</p>
                         <div className="flex flex-wrap gap-1">
                           {candidate.missing_skills.map(skill => (
                             <span key={skill} className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20">{skill}</span>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
