import { useState, useEffect } from 'react';
import { authService } from '../services/index.js';

export function useOrganization() {
  const [orgId, setOrgId] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsOrgSelection, setNeedsOrgSelection] = useState(false);

  useEffect(() => {
    const bootstrapSession = async () => {
      if (!authService.isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const session = await authService.bootstrapSession();
        setOrganizations(session.organizations);
        setOrgId(session.selectedOrgId);
        setNeedsOrgSelection(session.needsOrgSelection);
      } catch (error) {
        console.error('Failed to bootstrap session:', error);
        // If bootstrap fails, user might need to log in again
        setNeedsOrgSelection(true);
      } finally {
        setLoading(false);
      }
    };

    bootstrapSession();
  }, []);

  const refreshOrganizations = async () => {
    try {
      const session = await authService.bootstrapSession();
      setOrganizations(session.organizations);
      return session;
    } catch (error) {
      console.error('Failed to refresh organizations:', error);
      throw error;
    }
  };

  const selectOrganization = (selectedOrgId) => {
    authService.setCurrentOrgId(selectedOrgId);
    setOrgId(selectedOrgId);
    setNeedsOrgSelection(false);
  };

  return { 
    orgId, 
    organizations, 
    loading, 
    needsOrgSelection,
    selectOrganization,
    refreshOrganizations
  };
}
