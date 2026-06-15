import { useState, useEffect } from 'react';
import AvatarBadge from './AvatarBadge';
import { Check, X } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config/api';

export default function PendingRequests({ currentUserId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // selected request for modal
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/connections/pending/${currentUserId}`)
      .then(res => {
        setRequests(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching inbox:", err);
        setLoading(false);
      });
  }, [currentUserId]);

  const removeRequestFromList = (connectionId) => {
    setRequests(prev => prev.filter(req => req._id !== connectionId));
  };

  const handleAccept = async (connectionId) => {
    try {
      await axios.put(`${API_BASE}/connections/accept/${connectionId}`);
      removeRequestFromList(connectionId);
      if (selected && selected._id === connectionId) {
        setModalOpen(false);
        setSelected(null);
      }
      alert("Connection Accepted! You can now chat.");
    } catch (err) {
      console.error("Error accepting connection:", err);
      alert("Failed to accept request.");
    }
  };

  const handleReject = async (connectionId) => {
    try {
      await axios.put(`${API_BASE}/connections/reject/${connectionId}`);
      removeRequestFromList(connectionId);
      if (selected && selected._id === connectionId) {
        setModalOpen(false);
        setSelected(null);
      }
      alert("Request rejected.");
    } catch (err) {
      console.error("Error rejecting connection:", err);
      alert("Failed to reject request.");
    }
  };

  const openProfile = (request) => {
    setSelected(request);
    setModalOpen(true);
  };

  if (loading) {
    return <div className="text-center py-20 text-forest-400 font-mono animate-pulse">Decrypting inbox...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-200 border-b border-charcoal-700 pb-2 mb-6">Pending Access Requests</h2>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-charcoal-800 border border-charcoal-700 rounded-lg text-gray-500 font-mono">
          Inbox is empty. No pending requests.
        </div>
      ) : (
        requests.map(request => {
          const sender = request.senderId || {};
          const topSkills = sender.topSkills?.length
            ? sender.topSkills
            : sender.techStack?.slice(0, 3) || [];

          return (
            <div key={request._id} className="bg-charcoal-800/80 backdrop-blur-sm border border-charcoal-700 rounded-xl p-5 flex items-center justify-between hover:border-forest-400 transition-all shadow-lg card-hover group animate-slideInRight gap-4">
              <AvatarBadge name={sender.username} size="lg" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-200">{sender.username}</h3>
                {sender.githubHandle && (
                  <div className="text-xs font-mono text-gray-400 mt-1">
                    GitHub: <span className="text-forest-400">{sender.githubHandle}</span>
                  </div>
                )}
                {sender.bio && <p className="text-sm text-gray-400 mt-2 max-w-xl">{sender.bio}</p>}
                <div className="flex gap-2 mt-3">
                  {topSkills.map((tech, idx) => (
                    <span key={idx} className="bg-charcoal-900 text-gray-400 text-[10px] px-2 py-1 rounded border border-charcoal-700">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openProfile(request)}
                  className="bg-charcoal-900 hover:bg-charcoal-700 border border-charcoal-600 hover:border-forest-400 px-3 py-2 rounded-lg text-sm text-gray-300 transition-all"
                >
                  👤 View
                </button>
                <button
                  onClick={() => handleAccept(request._id)}
                  className="bg-gradient-to-r from-forest-800 to-forest-900 hover:from-forest-700 hover:to-forest-800 px-4 py-2 rounded-lg text-sm text-white font-semibold transition-all hover:shadow-lg hover:shadow-forest-400/20"
                >
                  <Check size={16} className="inline mr-1" /> Accept
                </button>
                <button
                  onClick={() => handleReject(request._id)}
                  className="bg-charcoal-900 border border-red-900 hover:border-red-700 hover:bg-red-950/30 px-4 py-2 rounded-lg text-sm text-red-400 transition-all"
                >
                  <X size={16} className="inline mr-1" /> Reject
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Profile modal */}
      {modalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-charcoal-900 border border-charcoal-700 rounded-lg p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-200">{selected.senderId.username}</h3>
                {selected.senderId.githubHandle && (
                  <div className="text-xs font-mono text-gray-400 mt-1">
                    github.com/<span className="text-forest-400">{selected.senderId.githubHandle}</span>
                  </div>
                )}
                <p className="text-sm text-gray-400 mt-2">{selected.senderId.bio}</p>

                {selected.senderId.topSkills?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-gray-300 text-xs font-semibold">Top skills</p>
                    <div className="flex gap-2 mt-2">
                      {selected.senderId.topSkills.map((s, i) => (
                        <span key={i} className="bg-charcoal-800 text-gray-300 text-xs px-2 py-1 rounded border border-charcoal-700">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.senderId.techStack?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-gray-300 text-xs font-semibold">Tech stack</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {selected.senderId.techStack.map((s, i) => (
                        <span key={i} className="bg-charcoal-800 text-gray-300 text-xs px-2 py-1 rounded border border-charcoal-700">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.senderId.lookingFor?.length > 0 && (
                  <p className="text-gray-400 text-xs mt-3">Looking for: {selected.senderId.lookingFor.join(', ')}</p>
                )}

                {selected.senderId.projects?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-gray-300 text-xs font-semibold">Projects</p>
                    <div className="mt-2 space-y-2">
                      {selected.senderId.projects.map((p, i) => (
                        <div key={i} className="border border-charcoal-700 rounded p-3 bg-charcoal-800">
                          <div className="text-sm font-semibold text-gray-200">{p.name}</div>
                          {p.description && <div className="text-xs text-gray-400">{p.description}</div>}
                          {p.link && (
                            <a className="text-xs text-forest-400 mt-1 inline-block" href={p.link} target="_blank" rel="noreferrer">
                              {p.link}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-3">
                <button
                  onClick={() => handleAccept(selected._id)}
                  className="bg-forest-900 hover:bg-forest-800 text-white font-bold py-2 px-4 rounded"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleReject(selected._id)}
                  className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                >
                  Reject
                </button>
                <button
                  onClick={() => { setModalOpen(false); setSelected(null); }}
                  className="bg-charcoal-900 hover:bg-charcoal-800 text-gray-200 font-semibold py-2 px-4 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
