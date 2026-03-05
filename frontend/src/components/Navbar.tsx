import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/tasks', label: 'Tasks' },
    { path: '/ratings', label: 'Rate Responses' },
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      height: '64px',
      background: scrolled
        ? 'rgba(6, 8, 24, 0.75)'
        : 'rgba(6, 8, 24, 0.5)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      transition: 'background 0.3s ease',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginRight: '2.5rem' }}>
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          boxShadow: '0 0 12px rgba(99,102,241,0.5)'
        }}>
          ⚡
        </div>
        <span style={{
          color: 'white',
          fontWeight: 700,
          fontSize: '1rem',
          letterSpacing: '-0.3px'
        }}>
          RL Platform
        </span>
      </div>

      {/* Liquid glass tab bar */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '0.3rem',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                textDecoration: 'none',
                padding: '0.4rem 1.1rem',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                background: isActive
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.7), rgba(14,165,233,0.6))'
                  : 'transparent',
                backdropFilter: isActive ? 'blur(8px)' : 'none',
                border: isActive
                  ? '1px solid rgba(255,255,255,0.2)'
                  : '1px solid transparent',
                boxShadow: isActive
                  ? '0 2px 12px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
