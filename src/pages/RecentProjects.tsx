
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useProjects } from "@/hooks/use-projects";
import { ProjectsError } from "@/components/projects/ProjectsError";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { toast } from "sonner";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { ProjectsLoadingState } from "@/components/projects/ProjectsLoadingState";
import { ProjectsAuthError } from "@/components/projects/ProjectsAuthError";
import { ProjectsToolbar } from "@/components/projects/ProjectsToolbar";
import { ProjectsEmptyState } from "@/components/projects/ProjectsEmptyState";

export default function RecentProjects() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  
  console.log("RecentProjects - Auth state:", { 
    hasSession: !!session, 
    loading, 
    userId: session?.user?.id 
  });
  
  const { 
    projects, 
    isLoading, 
    error, 
    deleteProject, 
    exportProjects,
    canCreateProject,
    pagination,
    projectCount,
    projectLimit,
    refetch
  } = useProjects(session?.user || null);
  
  const { hasFeature } = useSubscriptionFeatures();
  const hasExportFeature = hasFeature("data_export");
  
  console.log("RecentProjects - Projects data:", { 
    projects: projects?.length, 
    isLoading, 
    error: error?.message,
    projectCount,
    projectLimit
  });
  
  // Set page to 1 on initial load
  useEffect(() => {
    pagination.setCurrentPage(1);
  }, []);
  
  const handleExport = async () => {
    if (hasExportFeature) {
      await exportProjects();
    } else {
      navigate("/subscription?feature=data_export");
    }
  };
  
  const handleManualRefresh = () => {
    console.log("Manual refresh triggered");
    toast.info("Refreshing projects...");
    refetch();
  };
  
  // Show loading state while authentication is being verified
  if (loading) {
    return (
      <div className="container py-10 space-y-8">
        <ProjectsLoadingState message="Loading your projects..." />
      </div>
    );
  }
  
  // Show error if user is not authenticated
  if (!session?.user) {
    return <ProjectsAuthError />;
  }

  return (
    <div className="container py-10 space-y-8">
      <ProjectsToolbar 
        canCreateProject={canCreateProject}
        displayProjectLimit={projectLimit}
        projectCount={projectCount}
        isSubscriptionLoading={false}
        onRefresh={handleManualRefresh}
      />

      {isLoading ? (
        <ProjectsLoadingState />
      ) : error ? (
        <ProjectsError onRetry={refetch} />
      ) : projects && projects.length > 0 ? (
        <ProjectsTable 
          projects={projects} 
          onDelete={deleteProject}
          onExport={handleExport}
          pagination={pagination}
        />
      ) : (
        <ProjectsEmptyState projectLimit={projectLimit} />
      )}
    </div>
  );
}
