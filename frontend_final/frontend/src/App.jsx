import { useState, useEffect } from 'react';
import axios from 'axios';
import MatchGrid from './components/MatchGrid';
import PendingRequests from './components/PendingRequests'; 
import MyMatches from './components/MyMatches';
import LiveChat from './components/LiveChat';
import NetworkBackground from './components/NetworkBackground';
import ProfileSetup from './components/ProfileSetup';
import DeveloperProfile from './components/DeveloperProfile';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  // 1. Core State Management
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authStatus, setAuthStatus] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [currentView, setCurrentView] = useState('login'); // 'login', 'grid', 'inbox', 'chat'
  const [activeConnectionId, setActiveConnectionId] = useState(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);

  // 2. Boot-up Check (Persist login on refresh)
  useEffect(() => {
    const storedId = localStorage.getItem('currentUserId');
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    if (storedId && storedToken) {
      axios.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
      setCurrentUserId(storedId);
      setAuthToken(storedToken);
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('currentUser');
        }
      }
      setCurrentView('grid');
    }
  }, []);

  const completeAuth = ({ token, user }) => {
    const userId = user._id || user.id;
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUserId', userId);
    localStorage.setItem('currentUser', JSON.stringify(user));
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    setAuthToken(token);
    setCurrentUser(user);
    setCurrentUserId(userId);
    setCurrentView('grid');
  };

  // 3. Auth Handler
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthStatus(null);

    const form = e.target;
    const payload = {
      email: form.email.value.trim(),
      password: form.password.value,
    };

    if (authMode === 'signup') {
      payload.name = form.name.value.trim();
      payload.bio = form.bio.value.trim();
      payload.lookingFor = form.lookingFor.value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    try {
      const { data } = await axios.post(`${API_BASE}/auth/${authMode === 'signup' ? 'signup' : 'login'}`, payload);
      completeAuth(data);
    } catch (error) {
      setAuthStatus(error.response?.data?.message || error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLegacyProfileComplete = (userId) => {
    const token = authToken || localStorage.getItem('authToken');
    if (token) {
      localStorage.setItem('currentUserId', userId);
      setCurrentUserId(userId);
      setCurrentView('grid');
    }
  };

  // 4. Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    delete axios.defaults.headers.common.Authorization;
    setCurrentUserId(null);
    setCurrentUser(null);
    setAuthToken(null);
    setSelectedProfileUserId(null);
    setCurrentView('login');
  };

  const handleConnect = async (receiverId) => {
    try {
      await axios.post('http://localhost:5000/api/connections/request', {
        senderId: currentUserId,
        receiverId,
      });
      return true;
    } catch (err) {
      console.error("Error sending request:", err);
      alert(err.response?.data?.message || "Failed to send request.");
      throw err;
    }
  };

  // --- COMPONENT ROUTER ---
  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="bg-charcoal-800 p-8 rounded-lg border border-charcoal-700 shadow-xl w-96">
              <h2 className="text-forest-400 text-xl font-bold mb-6 text-center tracking-wide">
                {authMode === 'login' ? 'SYSTEM ACCESS' : 'CREATE ACCESS'}
              </h2>
              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                {authMode === 'signup' && (
                  <input
                    name="name"
                    className="bg-charcoal-900 p-3 rounded text-gray-200 border border-charcoal-600 focus:outline-none focus:border-forest-400 font-mono"
                    placeholder="Display name"
                    required
                  />
                )}
                <input
                  name="email"
                  type="email"
                  className="bg-charcoal-900 p-3 rounded text-gray-200 border border-charcoal-600 focus:outline-none focus:border-forest-400 font-mono" 
                  placeholder="Email"
                  required
                />
                <input
                  name="password"
                  type="password"
                  minLength={6}
                  className="bg-charcoal-900 p-3 rounded text-gray-200 border border-charcoal-600 focus:outline-none focus:border-forest-400 font-mono"
                  placeholder="Password"
                  required
                />
                {authMode === 'signup' && (
                  <>
                    <input
                      name="lookingFor"
                      className="bg-charcoal-900 p-3 rounded text-gray-200 border border-charcoal-600 focus:outline-none focus:border-forest-400 font-mono"
                      placeholder="Looking for: React, ML, Backend"
                    />
                    <textarea
                      name="bio"
                      className="bg-charcoal-900 p-3 rounded text-gray-200 border border-charcoal-600 focus:outline-none focus:border-forest-400 font-mono min-h-20 resize-none"
                      placeholder="Short bio"
                    />
                  </>
                )}
                {authStatus && <div className="text-sm text-red-300 border border-red-900 bg-red-950/40 rounded px-3 py-2">{authStatus}</div>}
                <button type="submit" disabled={authLoading} className="bg-forest-800 hover:bg-forest-900 disabled:opacity-50 px-4 py-3 rounded text-white font-bold transition-colors">
                  {authLoading ? 'Authenticating...' : authMode === 'login' ? 'Initialize Session' : 'Create Account'}
                </button>
              </form>
              <button
                type="button"
                onClick={() => {
                  setAuthStatus(null);
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                }}
                className="w-full mt-4 border border-charcoal-600 hover:border-forest-800 px-4 py-3 rounded text-gray-300 font-bold transition-colors"
              >
                {authMode === 'login' ? 'Create Developer Account' : 'Use Existing Account'}
              </button>
            </div>
          </div>
        );
      case 'profile':
        return (
          <ProfileSetup
            currentUserId={currentUserId}
            onComplete={handleLegacyProfileComplete}
          />
        );
      case 'grid':
        return (
          <MatchGrid
            currentUserId={currentUserId}
            onViewProfile={(userId) => {
              setSelectedProfileUserId(userId);
              setCurrentView('developerProfile');
            }}
          />
        );
      case 'developerProfile':
        return (
          <DeveloperProfile
            userId={selectedProfileUserId}
            currentUserId={currentUserId}
            onBack={() => setCurrentView('grid')}
            onConnect={handleConnect}
          />
        );
      case 'inbox':
        return <PendingRequests currentUserId={currentUserId} />; // <-- Replaced placeholder`
      case 'matches':
              return (
                <MyMatches 
                  currentUserId={currentUserId} 
                  onOpenChat={(connId) => {
                    setActiveConnectionId(connId);
                    setCurrentView('chat');
                  }} 
                />
              );
      case 'chat':
              return (
                <LiveChat 
                  currentUserId={currentUserId} 
                  connectionId={activeConnectionId}
                  onBack={() => setCurrentView('matches')} 
                />
              );
      default:
        return null;
    }
  };

  return (
      <>
        {/* 1. The Interactive Background */}
        <NetworkBackground />

        {/* 2. The Main UI (z-10 keeps it on top of the particles) */}
        <div className="max-w-5xl mx-auto p-6 relative z-10">
          
          {/* Top Navigation Bar */}
          <header className="flex justify-between items-center pb-4 border-b border-charcoal-700 mb-8 mt-2 bg-charcoal-900/80 p-4 rounded-xl backdrop-blur-sm shadow-lg">
            <h1 className="text-2xl font-bold text-forest-400 tracking-wider">DEV<span className="text-gray-500">TINDER</span></h1>
            
            {currentUserId && (
              <nav className="flex gap-6 items-center bg-charcoal-800 px-6 py-2 rounded-full border border-charcoal-700">
                <button 
                  onClick={() => setCurrentView('profile')} 
                  className={`font-semibold transition-colors ${currentView === 'profile' ? 'text-forest-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Profile
                </button>
                <button 
                  onClick={() => setCurrentView('grid')} 
                  className={`font-semibold transition-colors ${currentView === 'grid' ? 'text-forest-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Discover
                </button>
                <button 
                  onClick={() => setCurrentView('inbox')} 
                  className={`font-semibold transition-colors ${currentView === 'inbox' ? 'text-forest-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Inbox
                </button>
                <button 
                  onClick={() => setCurrentView('matches')} 
                  className={`font-semibold transition-colors ${currentView === 'matches' ? 'text-forest-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Matches
                </button>
                <div className="h-4 w-px bg-charcoal-600"></div>
                <span className="text-xs text-forest-400 font-mono bg-charcoal-900 px-2 py-1 rounded border border-charcoal-600">
                  {currentUser?.username || currentUser?.name || `ID: ${currentUserId.substring(0, 6)}...`}
                </span>
                <button 
                  onClick={handleLogout} 
                  className="text-sm text-red-500 hover:text-red-400 font-semibold ml-2"
                >
                  Terminate
                </button>
              </nav>
            )}
          </header>

          {/* Dynamic View Area */}
          <main>
            {renderView()}
          </main>
          
        </div>
      </>
    );
}
