import { useState, useEffect } from 'react';
import AvatarBadge from './AvatarBadge';
import StatusDot from './StatusDot';
import { MessageSquare, Star } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config/api';

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
    <div className="bg-charcoal-800/80 backdrop-blur-sm border border-charcoal-700 rounded-xl p-6 card-hover shadow-lg">
      <h2 className="text-2xl font-bold text-forest-400">Your Matches</h2>
      <p className="text-gray-400 text-sm mt-1">Connect and collaborate with {matches.length} developers</p>
    </div>

      {matches.length === 0 ? (
        <div className="text-center py-16 bg-charcoal-800/80 backdrop-blur-sm border border-charcoal-700 rounded-xl text-gray-400 font-mono">
          <div className="text-4xl mb-4">🔍</div>
          <p>No matches yet. Keep discovering developers!</p>
        </div>
      ) : (
        matches.map((match,idx) => {
          const otherUser = match.senderId._id === currentUserId ? match.receiverId : match.senderId;

          return (
            <div key={match._id} className="bg-charcoal-800/80 backdrop-blur-sm border border-charcoal-700 rounded-xl p-6 hover:border-forest-400 transition-all shadow-lg card-hover group" style={{ animationDelay: `${idx * 0.05}s`, animation: 'fadeInUp 0.5s ease-out' }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="relative flex-shrink-0">
                  <AvatarBadge name={otherUser.username} size="lg" />
                  <StatusDot online={true} size="md" className="absolute -bottom-1 -right-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-100">{otherUser.username}</h3>
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
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => openRatingModal(otherUser)}
                  className="flex-1 bg-charcoal-900 hover:bg-charcoal-700 border border-charcoal-600 hover:border-amber-400 px-3 py-2 rounded-lg text-sm text-gray-300 transition-all"
                >
                  <Star size={16} className="inline mr-1" /> Rate
                </button>
                <button
                  onClick={() => onOpenChat(match._id)}
                  className="flex-1 bg-gradient-to-r from-forest-800 to-forest-900 hover:from-forest-700 hover:to-forest-800 px-3 py-2 rounded-lg text-sm text-white font-semibold transition-all hover:shadow-lg hover:shadow-forest-400/20"
                >
                  <MessageSquare size={16} className="inline mr-1" /> Chat
                </button>
              </div>
            </div>
          );
        })
      )}

      {ratingModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-charcoal-800/95 backdrop-blur-md border border-charcoal-700 rounded-2xl p-8 shadow-2xl w-96 card-hover">
            <h3 className="text-2xl font-bold text-forest-400 mb-6">Rate {ratingModal.user?.username}</h3>
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
