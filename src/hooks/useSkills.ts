import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useSkills = () => {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('id, name, category, market_demand_score');
      if (error) throw error;
      return data || [];
    }
  });
};
