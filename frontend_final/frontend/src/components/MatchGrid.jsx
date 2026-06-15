import { useState, useEffect } from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import AvatarBadge from './AvatarBadge';
import { Heart, X } from 'lucide-react';
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
      <div className="bg-charcoal-800/80 backdrop-blur-sm border border-charcoal-700 rounded-xl p-6 card-hover shadow-lg">
        <h2 className="text-2xl font-bold text-forest-400 mb-2">Connect with Developers</h2>
        <p className="text-gray-400 text-sm">Find your perfect team match</p>
      </div>
      <div className="bg-charcoal-800/80 backdrop-blur-sm border border-charcoal-700 rounded-xl p-6 space-y-4 card-hover shadow-lg">
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
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            value={searchSkills}
            onChange={(e) => setSearchSkills(e.target.value)}
            className="flex-1 bg-charcoal-900 p-3 rounded-lg border border-charcoal-600 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400/50 text-gray-200 font-mono transition-all"
            placeholder="Search skills: React, Node, ML..."
          />
          <button 
            type="submit" 
            className="bg-gradient-to-r from-forest-800 to-forest-900 hover:from-forest-700 hover:to-forest-800 px-6 py-3 rounded-lg text-white font-semibold transition-all hover:shadow-lg hover:shadow-forest-400/20"
          >
            🔍 Search
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
        <LoadingSkeleton count={6} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map((user,idx) => {
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
              <div key={user._id} className="bg-charcoal-800/80 backdrop-blur-sm border border-charcoal-700 rounded-xl p-5 hover:border-forest-400 transition-all shadow-lg card-hover group flex flex-col h-full" style={{ animationDelay: `${idx * 0.05}s`, animation: 'fadeInUp 0.5s ease-out' }}>
                {/* Header with Avatar and Name */}
                <div className="flex items-start gap-3 mb-3">
                  <AvatarBadge name={user.username} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-100">{user.username}</h3>
                      {statusLabel && (
                        <span className="text-[10px] uppercase tracking-widest bg-charcoal-900 border border-charcoal-700 text-gray-300 px-2 py-1 rounded-full">
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    
                    {/* GitHub Handle */}
                    {user.githubHandle && (
                      <a 
                        href={`https://github.com/${user.githubHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-forest-400 hover:text-forest-300 mt-1 block truncate transition-colors"
                      >
                        github.com/{user.githubHandle}
                      </a>
                    )}
                    
                    {user.stackSource && (
                      <span className="text-[10px] uppercase tracking-widest text-gray-600 mt-1 block">
                        {user.stackSource} profile
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
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
                  
                {user.bio && <p className="text-sm text-gray-400 mb-3 leading-5 line-clamp-2">{user.bio}</p>}

                {/* Top Skills */}
                {topSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">Top Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {topSkills.map((tech, idx) => (
                        <span key={idx} className="bg-charcoal-700 text-forest-400 text-xs px-2 py-1 rounded-full font-semibold border border-charcoal-600">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Looking For */}
                {user.lookingFor?.length > 0 && (
                  <div className="mb-3">
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

                {/* Spacer to push buttons to bottom */}
                <div className="flex-1"></div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                <button
                  onClick={() => onViewProfile(user._id)}
                  className="flex-1 bg-charcoal-900 hover:bg-charcoal-700 border border-charcoal-600 hover:border-forest-400 px-3 py-2 rounded-lg text-sm text-gray-300 transition-all"
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => handleConnect(user._id)}
                  disabled={connectionDisabled}
                  className="flex-1 bg-gradient-to-r from-forest-800 to-forest-900 hover:from-forest-700 hover:to-forest-800 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-sm text-white font-semibold transition-all hover:shadow-lg hover:shadow-forest-400/20"
                >
                  <Heart className="inline mr-1" size={14} />
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
