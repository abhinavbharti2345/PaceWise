import { Navigate } from 'react-router-dom';

/**
 * Settings has been consolidated into the unified Profile page (/profile).
 * This component acts as a redirect fallback.
 */
export function Settings() {
  return <Navigate to="/profile" replace />;
}

