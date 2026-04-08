import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useLearningPaths = (employeeId?: string) => {
  return useQuery({
    queryKey: ['learning-paths', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from('learning_paths')
        .select('id, course_name, platform, status, priority, deadline')
        .eq('employee_id', employeeId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!employeeId
  });
};
