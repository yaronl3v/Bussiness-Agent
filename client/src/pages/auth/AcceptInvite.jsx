import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService, organizationsService } from '../../services/index.js';
import { useOrganization } from '../../hooks/useOrganization.js';
import { useToast } from '../../hooks/useToast.jsx';
import Card from '../../components/ui/Card.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import Button from '../../components/ui/Button.jsx';

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { selectOrganization, refreshOrganizations } = useOrganization();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (!token) {
      error('Invalid invite link');
      navigate('/login');
      return;
    }

    // Store invite token for after authentication
    sessionStorage.setItem('inviteToken', token);

    // If not authenticated, redirect to login
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // If authenticated, process the invite
    processInvite();
  }, [token]);

  const processInvite = async () => {
    if (processed) return;
    
    setLoading(true);
    try {
      const invite = await organizationsService.acceptInvite(token);
      await refreshOrganizations();
      selectOrganization(invite.org_id);
      sessionStorage.removeItem('inviteToken');
      setProcessed(true);
      success('Successfully joined organization!');
      navigate('/agents');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to accept invite. The link may be invalid or expired.');
      navigate('/agents');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <Card className="p-8 text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Processing Invitation</h2>
          <p className="text-gray-500">Please wait while we add you to the organization...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Card className="p-8 text-center max-w-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {processed ? 'Invitation Accepted!' : 'Accept Invitation'}
        </h2>
        {!processed && (
          <>
            <p className="text-gray-500 mb-6">
              You need to be logged in to accept this invitation.
            </p>
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
