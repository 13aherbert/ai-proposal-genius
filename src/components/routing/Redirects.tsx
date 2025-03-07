
import { Navigate, useLocation, useParams } from "react-router-dom";

/**
 * Redirects from /recent-projects to /projects
 */
export function RecentProjectsRedirect() {
  return <Navigate to="/projects" replace />;
}

/**
 * Redirects from /project/:projectId to /projects/:projectId
 */
export function ProjectDetailsRedirect() {
  const { projectId } = useParams();
  return <Navigate to={`/projects/${projectId}`} replace />;
}
