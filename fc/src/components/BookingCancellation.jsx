import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import api from '../api/client';

const BookingCancellation = ({ bookingId, bookingStatus, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('other');
  const [customReason, setCustomReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const canCancelReasons = [
    { value: 'changed_mind', label: 'Changed my mind' },
    { value: 'found_alternative', label: 'Found alternative service' },
    { value: 'too_expensive', label: 'Too expensive' },
    { value: 'scheduling_conflict', label: 'Scheduling conflict' },
    { value: 'worker_unresponsive', label: 'Worker unresponsive' },
    { value: 'other', label: 'Other reason' }
  ];

  const canCancelStatuses = ['pending', 'accepted', 'on_the_way'];
  const canCancel = canCancelStatuses.includes(bookingStatus);

  const getCancellationReason = () => {
    if (reason === 'other') {
      return customReason.trim() || 'Customer requested cancellation';
    }
    return canCancelReasons.find(r => r.value === reason)?.label || 'Customer requested cancellation';
  };

  const handleCancel = async () => {
    if (!confirmed) {
      setError('Please confirm the cancellation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.patch(`/bookings/${bookingId}/cancel`, {
        cancellationReason: getCancellationReason()
      });

      if (response.data.success) {
        onSuccess?.();
      } else {
        setError(response.data.message || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      setError(err.response?.data?.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!canCancel) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 text-sm">Cannot Cancel</h4>
          <p className="text-xs text-yellow-800 dark:text-yellow-400 mt-1">
            Bookings that are already {bookingStatus === 'working' ? 'in progress' : bookingStatus} cannot be cancelled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-6 border border-red-100 dark:border-red-900">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cancel Booking</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            You can cancel this booking up until work begins
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
        >
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Cancellation Reason Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Why are you cancelling?
        </label>
        <div className="space-y-2">
          {canCancelReasons.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition">
              <input
                type="radio"
                name="reason"
                value={opt.value}
                checked={reason === opt.value}
                onChange={(e) => setReason(e.target.value)}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Reason Input */}
      {reason === 'other' && (
        <div className="mb-6">
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Please tell us why you're cancelling..."
            className="w-full px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 outline-none resize-none text-sm"
            rows="3"
          />
        </div>
      )}

      {/* Confirmation Checkbox */}
      <label className="flex items-start gap-3 mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="w-4 h-4 text-red-600 rounded mt-0.5"
        />
        <span className="text-sm text-red-800 dark:text-red-300">
          I confirm that I want to cancel this booking. I understand that this action cannot be undone.
        </span>
      </label>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-semibold"
        >
          Keep Booking
        </button>
        <button
          onClick={handleCancel}
          disabled={loading || !confirmed}
          className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white transition text-sm font-semibold"
        >
          {loading ? 'Cancelling...' : 'Cancel Booking'}
        </button>
      </div>
    </div>
  );
};

export default BookingCancellation;
