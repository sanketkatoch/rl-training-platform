import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import TasksPage from './pages/TasksPage';
import RatingsPage from './pages/RatingsPage';
import { getUsers } from './services/api';

interface User {
  id: number;
  name: string;
  role: string;
}

export const UserContext = React.createContext<{
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}>({ currentUser: null, setCurrentUser: () => {} });

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    getUsers().then(setUsers).catch(console.error);
  }, []);

  useEffect(() => {
    if (users.length > 0 && !currentUser) {
      setShowPicker(true);
    }
  }, [users, currentUser]);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      <Router>
        <div style={{ minHeight: '100vh' }}>
          <Navbar currentUser={currentUser} onSwitchUser={() => setShowPicker(true)} />
          <div className="page-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/ratings" element={<RatingsPage />} />
            </Routes>
          </div>
        </div>

        {/* User picker modal */}
        {showPicker && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeInUp 0.3s ease both'
          }}>
            <div style={{
              background: 'rgba(15,18,35,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '2.5rem',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', margin: '0 auto 1rem',
                  boxShadow: '0 0 20px rgba(99,102,241,0.4)'
                }}>⚡</div>
                <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.4rem' }}>
                  Who are you?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
                  Select your account to continue
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {users.map(user => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      setShowPicker(false);
                    }}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(99,102,241,0.5)';
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.1)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: user.role === 'researcher'
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'linear-gradient(135deg, #10b981, #0ea5e9)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', flexShrink: 0
                    }}>
                      {user.role === 'researcher' ? '🔬' : '⭐'}
                    </div>
                    <div>
                      <p style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
                        {user.name}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', margin: 0, textTransform: 'capitalize' }}>
                        {user.role}
                      </p>
                    </div>
                    <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem' }}>
                      →
                    </div>
                  </div>
                ))}
              </div>

              <p style={{
                color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem',
                textAlign: 'center', marginTop: '1.5rem', marginBottom: 0
              }}>
                Researchers create tasks · Annotators rate responses
              </p>
            </div>
          </div>
        )}
      </Router>
    </UserContext.Provider>
  );
}

export default App;
