import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { organizationsService } from '../services/index.js';
import { useToast } from '../hooks/useToast.jsx';
import Modal from './ui/Modal.jsx';
import Input from './ui/Input.jsx';
import Button from './ui/Button.jsx';
import CopyableText from './ui/CopyableText.jsx';

export default function InviteModal({ isOpen, onClose, orgId }) {
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    if (!orgId) {
      error('No organization selected');
      return;
    }

    setLoading(true);
    try {
      const invite = await organizationsService.createInvite(orgId, data.email);
      const link = `${window.location.origin}/accept-invite/${invite.token}`;
      setInviteLink(link);
      success('Invite created successfully');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create invite');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInviteLink('');
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite User to Organization"
      size="md"
    >
      <div className="space-y-6">
        {!inviteLink ? (
          // Step 1: Enter email
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="user@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address'
                }
              })}
            />

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Create Invite
              </Button>
            </div>
          </form>
        ) : (
          // Step 2: Show invite link
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Invite Created Successfully!</h4>
              <p className="text-sm text-green-700">
                Share this link with the person you want to invite. They'll need to register or log in to accept the invitation.
              </p>
            </div>

            <CopyableText
              label="Invitation Link"
              value={inviteLink}
              className="w-full"
            />

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> You are responsible for sending this link to the invited user. 
                The system does not send emails automatically.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
