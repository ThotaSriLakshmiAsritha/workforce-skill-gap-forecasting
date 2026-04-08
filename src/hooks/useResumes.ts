import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { ResumeProcessingEvent, ResumeUpload } from '../types/database';

interface UseResumesOptions {
  jobRequirementId?: string;
}

export const useResumes = ({ jobRequirementId }: UseResumesOptions = {}) => {
  return useQuery({
    queryKey: ['resumes', jobRequirementId ?? 'all'],
    refetchInterval: 3000,
    queryFn: async () => {
      let resumeQuery = supabase
        .from('resume_uploads')
        .select(
          'id, file_name, storage_path, job_requirement_id, candidate_name, candidate_email, extracted_skills, experience_years, education, previous_roles, match_score, matched_skills, missing_skills, ai_summary, status, processing_stage, processing_progress, stage_details, extract_method, extracted_text, ocr_text, extraction_confidence, needs_ocr, is_password_protected, is_image_only, validation_warnings, screening_error, screening_started_at, screening_completed_at, created_at, updated_at'
        )
        .order('created_at', { ascending: false });

      if (jobRequirementId) {
        resumeQuery = resumeQuery.eq('job_requirement_id', jobRequirementId);
      }

      const { data: resumes, error: resumeError } = await resumeQuery;
      if (resumeError) throw resumeError;

      const resumeIds = (resumes || []).map((resume) => resume.id);
      let events: ResumeProcessingEvent[] = [];

      if (resumeIds.length > 0) {
        const { data: eventData, error: eventError } = await supabase
          .from('resume_processing_events')
          .select('id, resume_upload_id, stage, state, message, meta, created_at')
          .in('resume_upload_id', resumeIds)
          .order('created_at', { ascending: true });

        if (eventError) throw eventError;
        events = (eventData || []) as ResumeProcessingEvent[];
      }

      return {
        resumes: (resumes || []) as ResumeUpload[],
        events,
      };
    },
  });
};
