import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status, start_date, end_date, team_size');
      if (error) throw error;
      return data || [];
    }
  });
};
