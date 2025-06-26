
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

/**
 * Redirects from /beta-invite to /beta with invite code
 */
export function BetaInviteRedirect() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const inviteCode = searchParams.get('invite');
  
  if (inviteCode) {
    console.log(`BetaInviteRedirect: Storing and redirecting with invite code ${inviteCode}`);
    sessionStorage.setItem('beta_invite_code', inviteCode);
    return <Navigate to={`/beta?invite=${inviteCode}`} replace />;
  } else {
    return <Navigate to="/" replace />;
  }
}

/**
 * Main redirects component that handles various legacy routes
 */
export function Redirects() {
  const location = useLocation();
  
  // Handle /recent-projects redirect
  if (location.pathname === '/recent-projects') {
    return <RecentProjectsRedirect />;
  }
  
  // Handle /project/:id redirect to /projects/:id
  if (location.pathname.startsWith('/project/')) {
    return <ProjectDetailsRedirect />;
  }
  
  // Default redirect to 404
  return <Navigate to="/404" replace />;
}
