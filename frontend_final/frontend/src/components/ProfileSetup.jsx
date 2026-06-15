import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/api';

const TABS = [
  { id: 'resume', label: 'Resume', desc: 'Upload PDF or image' },
  { id: 'github', label: 'GitHub', desc: 'Scan public repos' },
  { id: 'manual', label: 'Manual', desc: 'Type skills' },
];

function SkillBadge({ skill, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 bg-charcoal-900 text-forest-400 text-xs px-3 py-1 rounded-full border border-charcoal-600">
      {skill}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(skill)}
          className="text-gray-500 hover:text-red-400"
          aria-label={`Remove ${skill}`}
        >
          x
        </button>
      )}
    </span>
  );
}

function StatusBanner({ status }) {
  if (!status) return null;

  const styles =
    status.type === 'error'
      ? 'bg-red-950/60 border-red-900 text-red-300'
      : 'bg-forest-900/30 border-forest-800 text-green-200';

  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{status.message}</div>;
}

function TopSkillsPicker({ skills, selected, onChange }) {
  if (skills.length === 0) return null;

  const toggleSkill = (skill) => {
    if (selected.includes(skill)) {
      onChange(selected.filter((item) => item !== skill));
      return;
    }
    if (selected.length >= 3) return;
    onChange([...selected, skill]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-gray-300 text-sm font-semibold">Top skills</p>
        <span className="text-xs text-gray-500">{selected.length}/3 selected</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => {
          const isSelected = selected.includes(skill);
          return (
            <button
              type="button"
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`text-xs px-3 py-2 rounded-full border transition-colors ${
                isSelected
                  ? 'bg-forest-900 text-white border-forest-400'
                  : 'bg-charcoal-900 text-gray-400 border-charcoal-600 hover:border-forest-800'
              }`}
            >
              {skill}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ManualTab({ userId, profileFields, onSuccess }) {
  const [input, setInput] = useState('');
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const addSkill = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    
    // Split by comma and add each skill individually
    const newSkills = trimmed
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill && !skills.includes(skill));
    
    if (newSkills.length > 0) {
      setSkills((current) => [...current, ...newSkills]);
    }
    setInput('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addSkill();
    }
  };

  const handleSubmit = async () => {
    if (!userId) {
      setStatus({ type: 'error', message: 'Create your profile first.' });
      return;
    }
    if (skills.length === 0) {
      setStatus({ type: 'error', message: 'Add at least one skill before saving.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const { data } = await axios.post(`${API_BASE}/skills/manual`, {
        userId,
        skills,
        ...profileFields,
      });
      setStatus({ type: 'success', message: data.message });
      onSuccess(data.user || data.profile);
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="React, Node.js, Python..."
          className="flex-1 bg-charcoal-900 border border-charcoal-600 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-forest-400"
        />
        <button type="button" onClick={addSkill} className="bg-forest-900 hover:bg-forest-800 text-white px-4 rounded-lg">
          Add
        </button>
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <SkillBadge key={skill} skill={skill} onRemove={(value) => setSkills(skills.filter((item) => item !== value))} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || skills.length === 0}
        className="w-full bg-forest-900 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg"
      >
        {loading ? 'Saving skills...' : 'Save skills'}
      </button>

      <StatusBanner status={status} />
    </div>
  );
}

function ResumeTab({ userId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [extracted, setExtracted] = useState([]);

  const handleUpload = async () => {
    if (!userId) {
      setStatus({ type: 'error', message: 'Create your profile first.' });
      return;
    }
    if (!file) {
      setStatus({ type: 'error', message: 'Select a resume file first.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'success', message: 'Extracting skills from resume...' });

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('userId', userId);

      const { data } = await axios.post(`${API_BASE}/skills/resume`, formData);
      setExtracted(data.extractedSkills || []);
      setStatus({ type: 'success', message: data.message });
      onSuccess(data.user || data.profile);
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-charcoal-600 hover:border-forest-800 rounded-lg cursor-pointer bg-charcoal-900/70">
        <span className="text-gray-300 text-sm">{file ? file.name : 'Select resume PDF, PNG, or JPG'}</span>
        <span className="text-gray-600 text-xs mt-2">Max 5MB</span>
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setFile(event.target.files[0])} className="hidden" />
      </label>

      <button
        type="button"
        onClick={handleUpload}
        disabled={loading || !file}
        className="w-full bg-forest-900 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg"
      >
        {loading ? 'Processing resume...' : 'Extract resume skills'}
      </button>

      {extracted.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {extracted.map((skill) => (
            <SkillBadge key={skill} skill={skill} />
          ))}
        </div>
      )}

      <StatusBanner status={status} />
    </div>
  );
}

function GitHubTab({ userId, onSuccess }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);

  const handleFetch = async () => {
    if (!userId) {
      setStatus({ type: 'error', message: 'Create your profile first.' });
      return;
    }
    if (!username.trim()) {
      setStatus({ type: 'error', message: 'Enter a GitHub username.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'success', message: 'Scanning GitHub repositories...' });
    setResult(null);

    try {
      const { data } = await axios.post(`${API_BASE}/skills/github`, {
        userId,
        username: username.trim(),
      });
      setResult(data);
      setStatus({ type: 'success', message: data.message });
      onSuccess(data.user || data.profile);
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 flex items-center bg-charcoal-900 border border-charcoal-600 rounded-lg px-4 focus-within:border-forest-400">
          <span className="text-gray-500 mr-2">github.com/</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleFetch()}
            placeholder="username"
            className="flex-1 bg-transparent py-3 text-gray-200 placeholder-gray-600 focus:outline-none"
          />
        </div>
        <button type="button" onClick={handleFetch} disabled={loading} className="bg-forest-900 hover:bg-forest-800 disabled:opacity-50 text-white px-4 rounded-lg">
          {loading ? 'Scanning' : 'Import'}
        </button>
      </div>

      {result?.extractedSkills?.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {result.extractedSkills.map((skill) => (
              <SkillBadge key={skill} skill={skill} />
            ))}
          </div>
          {result.languages?.length > 0 && <p className="text-gray-500 text-xs">Languages: {result.languages.join(', ')}</p>}
        </div>
      )}

      <StatusBanner status={status} />
    </div>
  );
}

export default function ProfileSetup({ currentUserId, onComplete }) {
  const [activeTab, setActiveTab] = useState('resume');
  const [user, setUser] = useState(currentUserId ? { _id: currentUserId } : null);
  const [profile, setProfile] = useState(null);
  const [profileFields, setProfileFields] = useState({ name: '', bio: '', lookingFor: '' });
  const [selectedTopSkills, setSelectedTopSkills] = useState([]);
  const [projectsText, setProjectsText] = useState('');
  const [savingHighlights, setSavingHighlights] = useState(false);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!currentUserId) return;

    axios
      .get(`${API_BASE}/users/${currentUserId}`)
      .then((res) => {
        const currentUser = res.data;
        setUser(currentUser);
        setProfile(currentUser);
        setProfileFields({
          name: currentUser.username || '',
          bio: currentUser.bio || '',
          lookingFor: currentUser.lookingFor?.join(', ') || '',
        });
        setSelectedTopSkills(
          currentUser.topSkills?.length ? currentUser.topSkills : currentUser.techStack?.slice(0, 3) || []
        );
        setProjectsText(
          currentUser.projects
            ?.map((project) => [project.name, project.description, project.link].filter(Boolean).join(' | '))
            .join('\n') || ''
        );
      })
      .catch((error) => {
        console.error('Error loading current profile:', error);
      });
  }, [currentUserId]);

  const normalizedProfileFields = {
    name: profileFields.name.trim(),
    bio: profileFields.bio.trim(),
    lookingFor: profileFields.lookingFor
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    if (!profileFields.name.trim()) {
      setStatus({ type: 'error', message: 'Enter a display name first.' });
      return;
    }

    setCreating(true);
    setStatus(null);

    try {
      if (!userId) {
        const { data } = await axios.post(`${API_BASE}/users`, {
          username: profileFields.name.trim(),
          bio: profileFields.bio.trim(),
          lookingFor: normalizedProfileFields.lookingFor,
        });
        setUser(data);
        setStatus({ type: 'success', message: `Profile ready. Your ID is ${data._id}` });
      } else {
        const { data } = await axios.put(`${API_BASE}/users/${userId}`, {
          username: normalizedProfileFields.name || user?.username,
          bio: normalizedProfileFields.bio,
          lookingFor: normalizedProfileFields.lookingFor,
        });
        setUser(data);
        setProfile(data);
        setStatus({ type: 'success', message: 'Profile identity updated.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || error.message });
    } finally {
      setCreating(false);
    }
  };

  const handleSkillSuccess = (updated) => {
    setProfile(updated);
    if (updated?._id) setUser(updated);
    const updatedSkills = updated?.techStack || updated?.skills || [];
    const updatedTopSkills = updated?.topSkills?.length ? updated.topSkills : updatedSkills.slice(0, 3);
    setSelectedTopSkills(updatedTopSkills);
  };

  const handleRemoveSkill = async (skillToRemove) => {
    if (!userId) return;

    const updatedSkills = savedSkills.filter((skill) => skill !== skillToRemove);
    const updatedTopSkills = selectedTopSkills.filter((skill) => skill !== skillToRemove);

    try {
      const { data } = await axios.put(`${API_BASE}/users/${userId}`, {
        techStack: updatedSkills,
        topSkills: updatedTopSkills,
      });
      setProfile(data);
      setUser(data);
      setSelectedTopSkills(updatedTopSkills);
      setStatus({ type: 'success', message: `Removed ${skillToRemove}` });
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to remove skill' });
    }
  };

  const savedSkills = profile?.techStack || profile?.skills || [];
  const userId = user?._id || currentUserId;

  const parsedProjects = projectsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = '', description = '', link = ''] = line.split('|').map((part) => part.trim());
      return { name, description, link };
    })
    .filter((project) => project.name || project.description || project.link);

  const handleSaveHighlights = async () => {
    if (!userId) return;
    setSavingHighlights(true);
    setStatus(null);

    try {
      const { data } = await axios.put(`${API_BASE}/users/${userId}`, {
        username: normalizedProfileFields.name || user?.username,
        bio: normalizedProfileFields.bio,
        lookingFor: normalizedProfileFields.lookingFor,
        topSkills: selectedTopSkills,
        projects: parsedProjects,
      });
      setUser(data);
      setProfile(data);
      setStatus({ type: 'success', message: 'Profile highlights saved.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || error.message });
    } finally {
      setSavingHighlights(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-charcoal-800/95 border border-charcoal-700 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="p-6 border-b border-charcoal-700">
          <h2 className="text-xl font-bold text-forest-400 tracking-wide">Developer Profile</h2>
          <p className="text-gray-500 text-sm mt-1">Create your profile, extract skills, then enter discovery.</p>
        </div>

        <form onSubmit={handleCreateUser} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-charcoal-700">
          <input
            type="text"
            value={profileFields.name}
            onChange={(event) => setProfileFields((current) => ({ ...current, name: event.target.value }))}
            placeholder="Display name"
            className="bg-charcoal-900 border border-charcoal-600 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-forest-400"
          />
          <input
            type="text"
            value={profileFields.lookingFor}
            onChange={(event) => setProfileFields((current) => ({ ...current, lookingFor: event.target.value }))}
            placeholder="Looking for: React, ML, Backend"
            className="bg-charcoal-900 border border-charcoal-600 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-forest-400"
          />
          <textarea
            value={profileFields.bio}
            onChange={(event) => setProfileFields((current) => ({ ...current, bio: event.target.value }))}
            placeholder="Short bio"
            className="md:col-span-2 bg-charcoal-900 border border-charcoal-600 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-forest-400 min-h-24 resize-none"
          />
          <button
            type="submit"
            disabled={creating}
            className="md:col-span-2 bg-forest-900 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg"
          >
            {creating ? 'Saving...' : userId ? 'Update profile identity' : 'Create profile identity'}
          </button>
          <div className="md:col-span-2">
            <StatusBanner status={status} />
          </div>
        </form>

        <div className="flex border-b border-charcoal-700">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                activeTab === tab.id ? 'text-forest-400 border-b-2 border-forest-400 bg-charcoal-900/60' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
              <span className="block text-xs font-normal text-gray-600 mt-1">{tab.desc}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'manual' && <ManualTab userId={userId} profileFields={normalizedProfileFields} onSuccess={handleSkillSuccess} />}
          {activeTab === 'resume' && <ResumeTab userId={userId} onSuccess={handleSkillSuccess} />}
          {activeTab === 'github' && <GitHubTab userId={userId} onSuccess={handleSkillSuccess} />}
        </div>
      </div>

      {savedSkills.length > 0 && (
        <div className="mt-6 bg-charcoal-800/95 border border-charcoal-700 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4 mb-4">
            <p className="text-gray-300 text-sm font-semibold">Saved skills ({savedSkills.length})</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedSkills.map((skill) => (
              <SkillBadge key={skill} skill={skill} onRemove={() => handleRemoveSkill(skill)} />
            ))}
          </div>

          <div className="mt-6 border-t border-charcoal-700 pt-5 space-y-5">
            <TopSkillsPicker skills={savedSkills} selected={selectedTopSkills} onChange={setSelectedTopSkills} />

            <div>
              <label className="text-gray-300 text-sm font-semibold block mb-2">Projects</label>
              <textarea
                value={projectsText}
                onChange={(event) => setProjectsText(event.target.value)}
                placeholder="One project per line: Project name | what it does | link"
                className="w-full bg-charcoal-900 border border-charcoal-600 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-forest-400 min-h-28 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSaveHighlights}
                disabled={savingHighlights || selectedTopSkills.length === 0}
                className="flex-1 bg-charcoal-900 hover:bg-charcoal-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-200 text-sm font-bold px-4 py-3 rounded-lg border border-charcoal-600"
              >
                {savingHighlights ? 'Saving highlights...' : 'Save highlights'}
              </button>
              <button type="button" onClick={() => onComplete(userId)} className="flex-1 bg-forest-900 hover:bg-forest-800 text-white text-sm font-bold px-4 py-3 rounded-lg">
                Start discovering
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
