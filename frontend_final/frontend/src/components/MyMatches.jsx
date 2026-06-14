import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

function RatingStars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-3xl transition-colors ${
            star <= value ? 'text-amber-300' : 'text-gray-700'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function MyMatches({ currentUserId, onOpenChat }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState({
    open: false,
    user: null,
    value: 0,
    submitting: false,
  });

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/connections/accepted/${currentUserId}`);
      setMatches(res.data);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [currentUserId]);

  const openRatingModal = (otherUser) => {
    setRatingModal({ open: true, user: otherUser, value: 0, submitting: false });
  };

  const closeRatingModal = () => {
    setRatingModal({ open: false, user: null, value: 0, submitting: false });
  };

  const submitRating = async () => {
    if (!ratingModal.value || !ratingModal.user) return;

    setRatingModal((current) => ({ ...current, submitting: true }));

    try {
      await axios.post(`${API_BASE}/profiles/${ratingModal.user._id}/rate`, {
        rating: ratingModal.value,
      });
      await fetchMatches();
      closeRatingModal();
      alert('Rating submitted successfully.');
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Failed to submit rating.');
      setRatingModal((current) => ({ ...current, submitting: false }));
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-forest-400 font-mono animate-pulse">Loading secure connections...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-200 border-b border-charcoal-700 pb-2 mb-6">Established Connections</h2>

      {matches.length === 0 ? (
        <div className="text-center py-16 bg-charcoal-800 border border-charcoal-700 rounded-lg text-gray-500 font-mono">
          No matches yet. Keep swiping!
        </div>
      ) : (
        matches.map((match) => {
          const otherUser = match.senderId._id === currentUserId ? match.receiverId : match.senderId;

          return (
            <div key={match._id} className="bg-charcoal-800 border border-charcoal-600 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-forest-800 transition-colors shadow-md">
              <div>
                <h3 className="text-lg font-bold text-gray-200">{otherUser.username}</h3>
                {otherUser.githubHandle && (
                  <div className="text-xs font-mono text-gray-400 mt-1">
                    GitHub: <span className="text-forest-400">{otherUser.githubHandle}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                  <span>
                    {otherUser.ratingAverage?.toFixed(1) || 0} / 5
                  </span>
                  <span className="text-gray-500">·</span>
                  <span>{otherUser.ratingCount || 0} rating{(otherUser.ratingCount || 0) === 1 ? '' : 's'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                <button
                  onClick={() => onOpenChat(match._id)}
                  className="py-2 rounded font-bold transition-all border border-charcoal-600 text-gray-300 hover:border-forest-800 hover:text-forest-400"
                >
                  Open Terminal (Chat)
                </button>

                <button
                  onClick={() => openRatingModal(otherUser)}
                  className="py-2 rounded font-bold bg-forest-900 hover:bg-forest-800 text-white shadow-md"
                >
                  Rate the User
                </button>
              </div>
            </div>
          );
        })
      )}

      {ratingModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-100 mb-3">Rate {ratingModal.user.username}</h3>
            <p className="text-sm text-gray-400 mb-4">
              Give a score from 1 to 5 stars. Your rating helps other developers choose stronger matches.
            </p>
            <RatingStars value={ratingModal.value} onChange={(value) => setRatingModal((current) => ({ ...current, value }))} />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRatingModal}
                className="px-4 py-2 rounded-lg border border-charcoal-600 text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRating}
                disabled={ratingModal.submitting || ratingModal.value === 0}
                className="px-4 py-2 rounded-lg bg-forest-900 hover:bg-forest-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ratingModal.submitting ? 'Saving...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}