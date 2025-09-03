import { useState, useEffect } from 'react';
import { vendorsService } from '../services/index.js';
import Button from './ui/Button.jsx';
import Modal from './ui/Modal.jsx';
import Input from './ui/Input.jsx';
import { useToast } from '../hooks/useToast.js';

export default function VendorRouting({ 
  isOpen, 
  onClose, 
  lead, 
  agentId,
  onRouted 
}) {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadVendors();
    }
  }, [isOpen, agentId]);

  const loadVendors = async () => {
    try {
      const data = await vendorsService.getVendors(agentId);
      setVendors(data);
    } catch (err) {
      error('Failed to load vendors');
    }
  };

  const handleRoute = async () => {
    if (!selectedVendor) {
      error('Please select a vendor');
      return;
    }

    try {
      setLoading(true);
      await vendorsService.routeToVendor(agentId, lead.id, selectedVendor, notes);
      success('Lead successfully routed to vendor');
      onRouted?.();
      onClose();
    } catch (err) {
      error('Failed to route lead to vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Route Lead to Vendor"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Lead Information</h4>
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p><strong>Name:</strong> {lead?.name || 'N/A'}</p>
            <p><strong>Email:</strong> {lead?.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {lead?.phone || 'N/A'}</p>
          </div>
        </div>

        <div>
          <label className="form-label">Select Vendor</label>
          <select
            className="form-select"
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
          >
            <option value="">Choose a vendor...</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name} - {vendor.specialization}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Notes (Optional)</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes for the vendor..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRoute}
            loading={loading}
            disabled={loading || !selectedVendor}
          >
            Route to Vendor
          </Button>
        </div>
      </div>
    </Modal>
  );
}
