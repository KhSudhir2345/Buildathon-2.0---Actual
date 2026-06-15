import { useState, useEffect } from 'react';
import axios from 'axios';
import MatchGrid from './components/MatchGrid';
import PendingRequests from './components/PendingRequests'; 
import MyMatches from './components/MyMatches';
import LiveChat from './components/LiveChat';
import NetworkBackground from './components/NetworkBackground';
import ProfileSetup from './components/ProfileSetup';
import DeveloperProfile from './components/DeveloperProfile';
import { API_BASE } from './config/api';

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
      await axios.post(`${API_BASE}/connections/request`, {
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
          <div className="flex flex-col items-center justify-center h-screen">
            <div className="bg-charcoal-800/95 backdrop-blur-md p-8 rounded-2xl border border-charcoal-700 shadow-2xl w-96 card-hover relative overflow-hidden">
              {/* Glow effect background */}
              <div className="absolute inset-0 bg-forest-400/5 rounded-2xl pointer-events-none" style={{filter: 'blur(20px)'}} />
              
              {/* Decorative top accent */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-forest-400 to-transparent"></div>
              
              <div className="relative z-10 space-y-6">
                {/* Creative Header */}
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-2xl">
                    <span className="text-forest-400">◆</span>
                    <h2 className="text-forest-400 text-2xl font-black tracking-widest">DEV NEXUS</h2>
                    <span className="text-forest-400">◆</span>
                  </div>
                  <p className="text-gray-400 text-sm tracking-wide font-mono">
                    {authMode === 'login' ? 'CONNECT • BUILD • SHIP' : 'JOIN THE NETWORK'}
                  </p>
                </div>

                {/* Creative Tagline */}
                <div className="bg-gradient-to-r from-forest-900/20 to-transparent p-4 rounded-lg border border-forest-400/20">
                  <p className="text-forest-300 text-sm font-semibold leading-relaxed text-center">
                    {authMode === 'login' 
                      ? ' Find Your Perfect Dev Squad. Build Epic Projects. Win Together.'
                      : ' Join Thousands of Developers. Collaborate. Innovate. Succeed.'}
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-charcoal-600"></div>
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">
                    {authMode === 'login' ? 'Access' : 'Launch'}
                  </span>
                  <div className="flex-1 h-px bg-charcoal-600"></div>
                </div>

                {/* Form */}
                <form onSubmit={handleAuth} className="flex flex-col gap-4">
                  {authMode === 'signup' && (
                    <input
                      name="name"
                      className="bg-charcoal-900 p-3 rounded-lg text-gray-200 border border-charcoal-600 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400/50 font-mono transition-all placeholder-gray-600"
                      placeholder="Display name"
                      required
                    />
                  )}
                  <input
                    name="email"
                    type="email"
                    className="bg-charcoal-900 p-3 rounded-lg text-gray-200 border border-charcoal-600 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400/50 font-mono transition-all placeholder-gray-600"
                    placeholder="Email"
                    required
                  />
                  <input
                    name="password"
                    type="password"
                    minLength={6}
                    className="bg-charcoal-900 p-3 rounded-lg text-gray-200 border border-charcoal-600 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400/50 font-mono transition-all placeholder-gray-600"
                    placeholder="Password"
                    required
                  />
                  {authMode === 'signup' && (
                    <>
                      <input
                        name="lookingFor"
                        className="bg-charcoal-900 p-3 rounded-lg text-gray-200 border border-charcoal-600 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400/50 font-mono transition-all placeholder-gray-600"
                        placeholder="Looking for: React, ML, Backend"
                      />
                      <textarea
                        name="bio"
                        className="bg-charcoal-900 p-3 rounded-lg text-gray-200 border border-charcoal-600 focus:outline-none focus:border-forest-400 font-mono min-h-20 resize-none placeholder-gray-600"
                        placeholder="Tell us about yourself..."
                      />
                    </>
                  )}
                  {authStatus && (
                    <div className="text-sm text-red-300 border border-red-900 bg-red-950/40 rounded px-3 py-2 font-mono">
                      ⚠ {authStatus}
                    </div>
                  )}
                  <button 
                    type="submit" 
                    disabled={authLoading} 
                    className="w-full bg-gradient-to-r from-forest-800 to-forest-900 hover:from-forest-700 hover:to-forest-800 disabled:opacity-50 px-4 py-3 rounded-lg text-white font-bold transition-all hover:shadow-lg hover:shadow-forest-400/20 disabled:cursor-not-allowed uppercase tracking-wide"
                  >
                    {authLoading ? '⏳ Authenticating...' : authMode === 'login' ? '→ Enter Network' : '→ Create Account'}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-charcoal-600"></div>
                  <span className="text-xs text-gray-500 font-mono">OR</span>
                  <div className="flex-1 h-px bg-charcoal-600"></div>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    setAuthStatus(null);
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  }}
                  className="w-full border border-charcoal-600 hover:border-forest-400 hover:bg-forest-900/10 px-4 py-3 rounded-lg text-gray-300 font-bold transition-all uppercase tracking-wide text-sm"
                >
                  {authMode === 'login' ? '+ Create New Account' : '← Back to Login'}
                </button>

                {/* Footer Info */}
                <p className="text-center text-xs text-gray-600 font-mono">
                  {authMode === 'login' 
                    ? '✓ Secure • Anonymous • Lightning Fast'
                    : '✓ Join 1000+ Developers • No Spam • Your Data is Safe'}
                </p>
              </div>

              {/* Decorative bottom accent */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-forest-400 to-transparent"></div>
            </div>

            {/* Side Info - Optional */}
            <div className="mt-12 text-center max-w-md">
              <h3 className="text-forest-400 font-bold text-lg mb-3">Why StackConnect?</h3>
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-400">
                <div className="space-y-1">
                  <p className="text-forest-300 font-bold">⚡ Fast</p>
                  <p className="text-xs">Find matches instantly</p>
                </div>
                <div className="space-y-1">
                  <p className="text-forest-300 font-bold">🔥 Smart</p>
                  <p className="text-xs">AI-powered matching</p>
                </div>
                <div className="space-y-1">
                  <p className="text-forest-300 font-bold">🚀 Real</p>
                  <p className="text-xs">Real developers only</p>
                </div>
              </div>
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
            <h1 className="text-2xl font-bold text-forest-400 tracking-wider">STACK<span className="text-gray-500">CONNECT</span></h1>
            
            {currentUserId && (
              <nav className="flex gap-6 items-center bg-charcoal-800/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-charcoal-700 shadow-lg">
                <button 
                  onClick={() => setCurrentView('profile')} 
                  className={`font-semibold transition-all px-3 py-1 rounded-lg ${currentView === 'profile' ? 'text-white bg-forest-900 border border-forest-400 shadow-lg shadow-forest-400/20' : 'text-gray-400 hover:text-forest-400'}`}
                >
                  Profile
                </button>
                <button 
                  onClick={() => setCurrentView('grid')} 
                  className={`font-semibold transition-all px-3 py-1 rounded-lg ${currentView === 'profile' ? 'text-white bg-forest-900 border border-forest-400 shadow-lg shadow-forest-400/20' : 'text-gray-400 hover:text-forest-400'}`}
                >
                  Connect
                </button>
                <button 
                  onClick={() => setCurrentView('inbox')} 
                  className={`font-semibold transition-all px-3 py-1 rounded-lg relative ${currentView === 'inbox' ? 'text-white bg-forest-900 border border-forest-400 shadow-lg shadow-forest-400/20' : 'text-gray-400 hover:text-forest-400'}`}
                >
                  Inbox
                  {/* Red notification badge - you'll need to track pending count */}
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </button>
                <button 
                  onClick={() => setCurrentView('matches')} 
                  className={`font-semibold transition-all px-3 py-1 rounded-lg ${currentView === 'profile' ? 'text-white bg-forest-900 border border-forest-400 shadow-lg shadow-forest-400/20' : 'text-gray-400 hover:text-forest-400'}`}
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
