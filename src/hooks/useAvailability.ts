import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useAvailability = () => {
  return useQuery({
    queryKey: ['availability'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_availability')
        .select('employee_id, status, available_from');
      if (error) throw error;
      return data || [];
    }
  });
};
