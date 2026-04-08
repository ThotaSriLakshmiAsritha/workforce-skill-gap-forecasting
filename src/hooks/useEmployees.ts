import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, department, job_title, role')
        .eq('role', 'employee');
      if (error) throw error;
      return data || [];
    }
  });
};
