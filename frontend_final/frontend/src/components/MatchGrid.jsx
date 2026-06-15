import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/api';

export default function MatchGrid({ currentUserId, onViewProfile }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestedIds, setRequestedIds] = useState([]);
  const [searchSkills, setSearchSkills] = useState('');
  const [searchMode, setSearchMode] = useState('manual');
  const [projectDescription, setProjectDescription] = useState('');
  const [suggestedSkills, setSuggestedSkills] = useState([]);
  const [selectedProjectSkills, setSelectedProjectSkills] = useState([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState('');

    const getConnectionLabel = (status) => {
    switch (status) {
      case 'PENDING_SENT':
        return 'Pending';
      case 'PENDING_RECEIVED':
        return 'Incoming';
      case 'REJECTED_SENT':
      case 'REJECTED_RECEIVED':
        return 'Rejected';
      default:
        return null;
    }
  };

  const isConnectionDisabled = (status) => Boolean(status);
  const fetchDevelopers = (skills = '') => {
    setLoading(true);
    const params = skills.trim() ? { skills: skills.trim(), limit: 24 } : { limit: 24 };

    axios.get(`${API_BASE}/profiles/discover`, { params })
      .then(res => {
        const rankedUsers = res.data.profiles || [];
        setUsers(rankedUsers.filter(u => u._id !== currentUserId));
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching ranked developers:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDevelopers();
  }, [currentUserId]);

  const handleSearch = (event) => {
    event.preventDefault();
    fetchDevelopers(searchSkills);
  };

  const handleProjectSuggestions = async (event) => {
    event.preventDefault();
    setProjectLoading(true);
    setProjectError('');
    setSuggestedSkills([]);
    setSelectedProjectSkills([]);

    try {
      const { data } = await axios.post(`${API_BASE}/skills/project-suggestions`, {
        description: projectDescription,
      });
      const skills = data.suggestedSkills || [];
      setSuggestedSkills(skills);
      setSelectedProjectSkills(skills.slice(0, Math.min(skills.length, 6)));
    } catch (err) {
      setProjectError(err.response?.data?.error || 'Could not suggest skills from this project.');
    } finally {
      setProjectLoading(false);
    }
  };

  const toggleProjectSkill = (skill) => {
    setSelectedProjectSkills((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill]
    );
  };

  const handleProjectSearch = () => {
    if (selectedProjectSkills.length === 0) {
      setProjectError('Select at least one suggested skill to search.');
      return;
    }

    setProjectError('');
    fetchDevelopers(selectedProjectSkills.join(', '));
  };

  const handleConnect = async (receiverId) => {
    try {
      // Fire the handshake logic we built in the backend
      await axios.post(`${API_BASE}/connections/request`, {
        senderId: currentUserId,
        receiverId: receiverId
      });
      // Add the user to the requested list to disable the button
      setRequestedIds(prev => [...prev, receiverId]);
      return true;
    } catch (err) {
      console.error("Error sending request:", err);
      // If they already sent a request, the backend throws a 400, which we catch here
      alert(err.response?.data?.message || "Failed to send request.");
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-charcoal-800/95 border border-charcoal-700 rounded-xl p-4 shadow-lg space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSearchMode('manual')}
            className={`px-4 py-2 rounded font-bold transition-colors border ${
              searchMode === 'manual'
                ? 'bg-forest-900 border-forest-800 text-white'
                : 'bg-charcoal-900 border-charcoal-600 text-gray-400 hover:text-gray-200'
            }`}
          >
            Manual Skills
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('project')}
            className={`px-4 py-2 rounded font-bold transition-colors border ${
              searchMode === 'project'
                ? 'bg-forest-900 border-forest-800 text-white'
                : 'bg-charcoal-900 border-charcoal-600 text-gray-400 hover:text-gray-200'
            }`}
          >
            Project Description
          </button>
        </div>

        {searchMode === 'manual' ? (
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchSkills}
              onChange={(event) => setSearchSkills(event.target.value)}
              className="flex-1 bg-charcoal-900 p-3 rounded text-gray-200 border border-charcoal-600 focus:outline-none focus:border-forest-400 font-mono"
              placeholder="Search skills: React, Python, MongoDB"
            />
            <button type="submit" className="bg-forest-900 hover:bg-forest-800 text-white font-bold px-6 py-3 rounded transition-colors">
              Rank Developers
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleProjectSuggestions} className="space-y-3">
              <textarea
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                className="w-full bg-charcoal-900 p-3 rounded text-gray-200 border border-charcoal-600 focus:outline-none focus:border-forest-400 font-mono min-h-28 resize-none"
                placeholder="Describe your project: real-time chat app with authentication, resume parsing, AI summaries..."
                minLength={20}
                required
              />
              <button
                type="submit"
                disabled={projectLoading}
                className="bg-forest-900 hover:bg-forest-800 disabled:opacity-50 text-white font-bold px-6 py-3 rounded transition-colors"
              >
                {projectLoading ? 'Extracting Skills...' : 'Suggest Skills'}
              </button>
            </form>

            {projectError && (
              <div className="text-sm text-red-300 border border-red-900 bg-red-950/40 rounded px-3 py-2">
                {projectError}
              </div>
            )}

            {suggestedSkills.length > 0 && (
              <div className="space-y-3 border-t border-charcoal-700 pt-4">
                <div className="flex flex-wrap gap-2">
                  {suggestedSkills.map((skill) => {
                    const selected = selectedProjectSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleProjectSkill(skill)}
                        className={`px-3 py-2 rounded-full text-sm font-semibold border transition-colors ${
                          selected
                            ? 'bg-forest-900 border-forest-700 text-white'
                            : 'bg-charcoal-900 border-charcoal-600 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {selected ? '[x] ' : '+ '}
                        {skill}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleProjectSearch}
                  className="bg-forest-900 hover:bg-forest-800 text-white font-bold px-6 py-3 rounded transition-colors"
                >
                  Rank Developers by Selected Skills
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-forest-400 font-mono animate-pulse">Scanning mainframe for developers...</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => {
          const topSkills = user.topSkills?.length ? user.topSkills : user.techStack?.slice(0, 3) || [];
          const statusLabel = getConnectionLabel(user.connectionStatus);
          const connectionDisabled = requestedIds.includes(user._id) || isConnectionDisabled(user.connectionStatus);

          const connectText = requestedIds.includes(user._id)
            ? 'Sent'
            : user.connectionStatus === 'PENDING_SENT'
            ? 'Pending'
            : user.connectionStatus === 'PENDING_RECEIVED'
            ? 'Incoming'
            : user.connectionStatus?.startsWith('REJECTED')
            ? 'Rejected'
            : 'Connect';

          return (
            <div key={user._id} className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6 hover:border-forest-900 transition-colors flex flex-col justify-between h-full shadow-lg">
              <div>
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-200">{user.username}</h3>
                      {statusLabel && (
                        <span className="text-[10px] uppercase tracking-widest bg-charcoal-900 border border-charcoal-700 text-gray-300 px-2 py-1 rounded-full">
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    {user.stackSource && (
                      <span className="text-[10px] uppercase tracking-widest text-gray-600">
                        {user.stackSource} profile
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                      {user.ratingCount > 0 ? (
                        <>
                          <span className="text-amber-300">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star}>
                                {star <= Math.round(user.ratingAverage || 0) ? '★' : '☆'}
                              </span>
                            ))}
                          </span>
                          <span>{(user.ratingAverage || 0).toFixed(1)} / 5</span>
                          <span className="text-gray-500">·</span>
                          <span>{user.ratingCount} rating{user.ratingCount === 1 ? '' : 's'}</span>
                        </>
                      ) : (
                        <span>No ratings yet</span>
                      )}
                    </div>
                  </div>
                  {user.githubHandle && (
                    <span className="bg-charcoal-900 border border-charcoal-600 px-2 py-1 rounded text-xs font-mono text-gray-400">
                      github.com/{user.githubHandle}
                    </span>
                  )}
                </div>
                {user.bio && <p className="text-sm text-gray-400 mb-4 leading-6 line-clamp-2">{user.bio}</p>}
                <div className="flex flex-wrap gap-2 mb-5">
                  {topSkills.map((tech, idx) => (
                    <span key={idx} className="bg-charcoal-700 text-forest-400 text-xs px-3 py-1 rounded-full font-semibold border border-charcoal-600">
                      {tech}
                    </span>
                  ))}
                  {topSkills.length === 0 && (
                    <span className="text-xs text-gray-600">No top skills selected yet.</span>
                  )}
                </div>
                {user.lookingFor?.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">Looking for</p>
                    <div className="flex flex-wrap gap-2">
                      {user.lookingFor.slice(0, 2).map((item, idx) => (
                        <span key={idx} className="bg-charcoal-900 text-gray-400 text-[10px] px-2 py-1 rounded border border-charcoal-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onViewProfile(user._id)}
                  className="py-3 rounded font-bold transition-all border border-charcoal-600 text-gray-300 hover:border-forest-800 hover:text-forest-400"
                >
                  View Profile
                </button>
                <button
                  onClick={() => handleConnect(user._id)}
                  disabled={connectionDisabled}
                  className={`py-3 rounded font-bold transition-all ${
                    connectionDisabled
                      ? 'bg-charcoal-900 border border-charcoal-600 text-gray-500 cursor-not-allowed'
                      : 'bg-forest-900 hover:bg-forest-800 text-white shadow-md'
                  }`}
                >
                  {connectText}
                </button>
              </div>
            </div>
          );
        })}
      
        {users.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-500 font-mono">
            No other developers found in the system.
          </div>
        )}
      </div>
      )}
    </div>
  );
}
