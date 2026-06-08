'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import BackgroundGrid from '../components/BackgroundGrid';
import StoryboardCreator from '../components/StoryboardCreator';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Password Protection State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null means checking
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedPass = sessionStorage.getItem('app_password') || '';
        
        // Fetch to check protection status and optionally validate current key
        const response = await fetch('/api/auth', {
          method: 'GET',
          headers: savedPass ? { 'X-App-Password': savedPass } : {},
        });

        const data = await response.json();
        
        if (response.ok) {
          // Password matches or app is not protected
          setIsAuthenticated(true);
        } else {
          // Wrong password or expired
          sessionStorage.removeItem('app_password');
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) return;

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'GET',
        headers: {
          'X-App-Password': password,
        },
      });

      if (response.ok) {
        sessionStorage.setItem('app_password', password);
        setIsAuthenticated(true);
      } else {
        setLoginError('סיסמה שגויה, אנא נסה שנית.');
        setPassword('');
      }
    } catch (err) {
      console.error(err);
      setLoginError('שגיאת התחברות לשרת.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      {/* Animated drifting grid background */}
      <BackgroundGrid />

      {/* Password Protection Overlay */}
      {!isAuthenticated && isAuthenticated !== null && (
        <div className="login-overlay" id="login-overlay">
          <div 
            className="workspace-card" 
            style={{ 
              maxWidth: '420px', 
              minHeight: 'auto', 
              gap: '1.5rem', 
              textAlign: 'center', 
              alignItems: 'center', 
              padding: '2.5rem 2rem', 
              display: 'flex', 
              flexDirection: 'column' 
            }}
          >
            <div className="preview-glow" />
            
            <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '38px', height: '38px' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>כניסה מאובטחת</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>אנא הזן סיסמה כדי להשתמש ב-clips.board</p>
            </div>
            
            <form onSubmit={handleLogin} style={{ width: '100%', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ width: '100%' }}>
                <input
                  type="text"
                  placeholder="הזן סיסמה..."
                  className="password-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    width: '100%',
                    outline: 'none',
                    textAlign: 'center',
                    fontSize: '0.95rem',
                  }}
                  autoComplete="new-password"
                  autoFocus
                />
                {loginError && (
                  <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>
                    {loginError}
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoggingIn || !password.trim()}
                style={{ padding: '0.9rem', width: '100%', fontSize: '0.9rem' }}
              >
                {isLoggingIn ? 'מתחבר...' : 'התחבר'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Content (visible only when authenticated) */}
      {isAuthenticated && (
        <>
          {/* Mobile Menu Backdrop */}
          <div
            className={`mobile-menu-backdrop${menuOpen ? ' open' : ''}`}
            id="mobile-menu-backdrop"
            onClick={() => setMenuOpen(false)}
          />

          {/* Mobile Menu Sidebar */}
          <div
            className={`mobile-menu${menuOpen ? ' open' : ''}`}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="תפריט ניווט"
          >
            <button
              className="mobile-close"
              id="mobile-close"
              aria-label="סגור תפריט"
              onClick={() => setMenuOpen(false)}
            >✕</button>

            <div className="mobile-menu-logo">
              <Image src="/favicon-logo.png" alt="clips.Revolution" width={56} height={56} />
            </div>

            <a
              href="https://clipsrevolution.com"
              className="mobile-menu-branded"
              onClick={() => setMenuOpen(false)}
            >
              <span className="mobile-menu-svg-icon mobile-icon-home">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                  <path d="M9 21V12h6v9"/>
                </svg>
              </span>
              חזור לדף הבית
            </a>
          </div>

          {/* Header / Nav */}
          <header>
            <div className="nav-inner">
              {/* Right side: Hamburger */}
              <div className="nav-actions">
                <button
                  className="hamburger"
                  id="hamburger"
                  aria-label="פתח תפריט"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(true)}
                >
                  <span /><span /><span />
                </button>
              </div>

              {/* Left side: Logo */}
              <a href="https://clipsrevolution.com" className="brand" aria-label="clips.Revolution">
                <Image
                  src="/favicon-logo.png"
                  alt="clips.Revolution"
                  width={38}
                  height={38}
                  className="brand-logo"
                  priority
                />
              </a>
            </div>
          </header>

          {/* Main Workspace */}
          <main>
            {/* Page Intro — no clips.board label */}
            <div className="page-intro reveal visible">
              <div className="tool-logo-icon">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/favicon-logo.png" alt="clips.Revolution Logo" />
              </div>
              <div className="tool-brand-title">
                clips.<span>board</span>
              </div>
              <h1>מחולל סטוריבורד חכם</h1>
              <p>
                הפוך רעיונות גולמיים בעברית ללוחות סטוריבורד ויזואליים,
                מובנים ועקביים להפקה בתוך שניות.
              </p>
            </div>

            {/* Interactive Storyboard Workspace Creator */}
            <StoryboardCreator />
          </main>

          {/* Footer */}
          <footer>
            <p className="footer-text">Powered by clips.Revolution</p>
            <Image
              src="/favicon-logo.png"
              alt="clips.Revolution"
              width={36}
              height={36}
              className="footer-logo"
            />
          </footer>
        </>
      )}
    </>
  );
}
