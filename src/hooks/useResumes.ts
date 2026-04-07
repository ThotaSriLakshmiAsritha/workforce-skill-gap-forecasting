import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useResumes = () => {
  return useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resume_uploads')
        .select('id, candidate_name, match_score, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });
};
