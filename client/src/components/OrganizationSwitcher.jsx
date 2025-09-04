import { useState } from 'react';
import { ChevronDownIcon, BuildingOfficeIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useOrganization } from '../hooks/useOrganization.js';
import Button from './ui/Button.jsx';
import InviteModal from './InviteModal.jsx';

export default function OrganizationSwitcher() {
  const { orgId, organizations, selectOrganization } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const currentOrg = organizations.find(org => org.id === orgId);

  // Don't show if no organizations or only one
  if (organizations.length <= 1) {
    return (
      <>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <BuildingOfficeIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentOrg?.name || 'Organization'}</span>
        </div>
        <InviteModal 
          isOpen={showInviteModal} 
          onClose={() => setShowInviteModal(false)} 
          orgId={orgId} 
        />
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2"
        >
          <BuildingOfficeIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentOrg?.name || 'Select Organization'}</span>
          <ChevronDownIcon className="h-4 w-4" />
        </Button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl bg-white shadow-lg border border-gray-200">
              <div className="py-1">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    className={`flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100 ${
                      org.id === orgId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                    onClick={() => {
                      selectOrganization(org.id);
                      setIsOpen(false);
                    }}
                  >
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    {org.name}
                    {org.id === orgId && (
                      <span className="ml-auto text-xs">Current</span>
                    )}
                  </button>
                ))}
                
                {/* Divider */}
                <div className="border-t border-gray-200 my-1" />
                
                {/* Actions */}
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setShowInviteModal(true);
                    setIsOpen(false);
                  }}
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Invite Users
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      <InviteModal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
        orgId={orgId} 
      />
    </>
  );
}
