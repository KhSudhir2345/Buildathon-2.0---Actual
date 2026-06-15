import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/api';

function SkillPill({ children, highlight = false }) {
  return (
    <span
      className={`text-xs px-3 py-1 rounded-full border ${
        highlight
          ? 'bg-forest-900 text-white border-forest-400'
          : 'bg-charcoal-900 text-gray-400 border-charcoal-700'
      }`}
    >
      {children}
    </span>
  );
}

export default function DeveloperProfile({ userId, currentUserId, onBack, onConnect }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE}/users/${userId}`)
      .then((res) => {
        setUser(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching profile:', err);
        setLoading(false);
      });
  }, [userId]);

  const handleConnect = async () => {
    try {
      await onConnect(user._id);
      setRequested(true);
    } catch {
      // MatchGrid-style alerts are handled by the parent callback.
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-forest-400 font-mono animate-pulse">Loading developer profile...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto bg-charcoal-800 border border-charcoal-700 rounded-xl p-8 text-center">
        <p className="text-gray-400 mb-4">Profile not found.</p>
        <button type="button" onClick={onBack} className="bg-charcoal-900 border border-charcoal-600 px-4 py-2 rounded text-gray-200">
          Back
        </button>
      </div>
    );
  }

  const topSkills = user.topSkills?.length ? user.topSkills : user.techStack?.slice(0, 3) || [];
  const otherSkills = (user.techStack || []).filter((skill) => !topSkills.includes(skill));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button type="button" onClick={onBack} className="text-gray-400 hover:text-forest-400 text-sm font-semibold">
        Back to discover
      </button>

      <section className="bg-charcoal-800/95 border border-charcoal-700 rounded-xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div>
            <h2 className="text-3xl font-bold text-gray-100">{user.username}</h2>
            {user.githubHandle && (
              <p className="text-sm text-forest-400 mt-2 font-mono">github.com/{user.githubHandle}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-amber-300">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star}>
                    {star <= Math.round(user.ratingAverage || 0) ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <div className="text-sm text-gray-400">
                {user.ratingCount > 0
                  ? `${(user.ratingAverage || 0).toFixed(1)} / 5 · ${user.ratingCount} rating${user.ratingCount === 1 ? '' : 's'}`
                  : 'No ratings yet'}
              </div>
            </div>
          </div>
          {user._id !== currentUserId && (
            <button
              type="button"
              onClick={handleConnect}
              disabled={requested}
              className={`px-6 py-3 rounded-lg font-bold ${
                requested
                  ? 'bg-charcoal-900 border border-charcoal-600 text-gray-500 cursor-not-allowed'
                  : 'bg-forest-900 hover:bg-forest-800 text-white'
              }`}
            >
              {requested ? 'Request Sent' : 'Connect'}
            </button>
          )}
        </div>

        {user.bio && <p className="text-gray-300 leading-7 mt-6">{user.bio}</p>}

        {topSkills.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3">Best at</p>
            <div className="flex flex-wrap gap-2">
              {topSkills.map((skill) => (
                <SkillPill key={skill} highlight>
                  {skill}
                </SkillPill>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-charcoal-800/95 border border-charcoal-700 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-gray-200 mb-4">Skills</h3>
          {otherSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {otherSkills.map((skill) => (
                <SkillPill key={skill}>{skill}</SkillPill>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No extra skills listed yet.</p>
          )}
        </div>

        <div className="bg-charcoal-800/95 border border-charcoal-700 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-gray-200 mb-4">Looking For</h3>
          {user.lookingFor?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.lookingFor.map((item) => (
                <SkillPill key={item}>{item}</SkillPill>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No preferences listed yet.</p>
          )}
        </div>
      </section>

      <section className="bg-charcoal-800/95 border border-charcoal-700 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-gray-200 mb-4">Projects</h3>
        {user.projects?.length > 0 ? (
          <div className="space-y-4">
            {user.projects.map((project, index) => (
              <div key={`${project.name}-${index}`} className="border border-charcoal-700 rounded-lg p-4 bg-charcoal-900/70">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h4 className="text-gray-100 font-bold">{project.name || 'Untitled project'}</h4>
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noreferrer" className="text-xs text-forest-400 hover:text-green-300 font-mono">
                      View project
                    </a>
                  )}
                </div>
                {project.description && <p className="text-gray-400 text-sm mt-2 leading-6">{project.description}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No projects added yet.</p>
        )}
      </section>
    </div>
  );
}
