import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export type UploadStep = 'idle' | 'uploading' | 'creating' | 'complete' | 'error';

interface QuickUploadState {
  step: UploadStep;
  progress: number;
  projectId: string | null;
  projectTitle: string;
  error: string | null;
}

export function useQuickUpload() {
  const { session } = useAuth();
  const { organization } = useCurrentOrganization();
  const navigate = useNavigate();
  
  const [state, setState] = useState<QuickUploadState>({
    step: 'idle',
    progress: 0,
    projectId: null,
    projectTitle: '',
    error: null,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(() => {
    return localStorage.getItem('auto-generate-preference') !== 'false';
  });

  const reset = useCallback(() => {
    setState({
      step: 'idle',
      progress: 0,
      projectId: null,
      projectTitle: '',
      error: null,
    });
  }, []);

  const openModal = useCallback(() => {
    reset();
    setIsModalOpen(true);
  }, [reset]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    reset();
  }, [reset]);

  const handleAutoGenerateChange = useCallback((value: boolean) => {
    setAutoGenerate(value);
    localStorage.setItem('auto-generate-preference', value.toString());
  }, []);

  const uploadAndCreate = useCallback(async (file: File, title?: string) => {
    if (!session?.user?.id || !organization?.id) {
      toast.error('Please sign in to upload files');
      return;
    }

    const projectTitle = title || file.name.replace(/\.[^/.]+$/, '');
    
    setState(prev => ({
      ...prev,
      step: 'uploading',
      progress: 0,
      projectTitle,
      error: null,
    }));

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      // Upload file to Supabase storage
      setState(prev => ({ ...prev, progress: 25 }));
      
      const { error: uploadError } = await supabase.storage
        .from('rfp-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setState(prev => ({ ...prev, step: 'creating', progress: 50 }));

      // Create project in database
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: projectTitle,
          rfp_file_path: filePath,
          user_id: session.user.id,
          organization_id: organization.id,
          status: 'draft',
        })
        .select()
        .single();

      if (projectError) throw projectError;

      setState(prev => ({
        ...prev,
        step: 'complete',
        progress: 100,
        projectId: project.project_id,
      }));

      toast.success('RFP uploaded successfully!');

      // If auto-generate is enabled, navigate to project page
      // The automation will start automatically there
      if (autoGenerate) {
        setTimeout(() => {
          navigate(`/project/${project.project_id}`);
          closeModal();
        }, 500);
      }

      return project.project_id;
    } catch (error: any) {
      console.error('Upload error:', error);
      setState(prev => ({
        ...prev,
        step: 'error',
        error: error.message || 'Failed to upload file',
      }));
      toast.error(error.message || 'Failed to upload file');
      return null;
    }
  }, [session, organization, autoGenerate, navigate, closeModal]);

  const viewProject = useCallback(() => {
    if (state.projectId) {
      navigate(`/project/${state.projectId}`);
      closeModal();
    }
  }, [state.projectId, navigate, closeModal]);

  return {
    ...state,
    isModalOpen,
    autoGenerate,
    setAutoGenerate: handleAutoGenerateChange,
    openModal,
    closeModal,
    uploadAndCreate,
    viewProject,
    reset,
  };
}
