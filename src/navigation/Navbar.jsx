import React from 'react';
import BrandMark from '../components/BrandMark';
import { SECTIONS } from './navigationConstants';
import ProfileSwitcher from '../features/demo/components/ProfileSwitcher';
import styles from './Navbar.module.css';

export function Navbar({ currentSection = 'lending', onNavigate }) {
  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    if (typeof onNavigate === 'function') {
      onNavigate(sectionId);
    }
  };

  return (
    <>
      {/* Desktop Header */}
      <header className={styles.desktopHeader} role="banner">
        <div className={styles.headerContainer}>
          <div className={styles.brandGroup}>
            <a
              href="#discover"
              onClick={(e) => handleNavClick(e, 'discover')}
              className={styles.brandLink}
              aria-label="BorrowNest Home"
            >
              <BrandMark showTagline={false} size="default" />
            </a>
          </div>

          <nav className={styles.desktopNav} role="navigation" aria-label="Main Navigation">
            <ul className={styles.navList}>
              {SECTIONS.map((sec) => {
                const isActive = currentSection === sec.id;
                return (
                  <li key={sec.id} className={styles.navItem}>
                    <a
                      href={`#${sec.id}`}
                      onClick={(e) => handleNavClick(e, sec.id)}
                      className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className={styles.navText}>{sec.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.headerRightGroup}>
            <ProfileSwitcher variant="compact" />
            <div className={styles.prototypePill} role="status">
              <span className={styles.pillDot} aria-hidden="true"></span>
              <span className={styles.pillText}>Local-First Storage</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Minimum 44x44px touch targets) */}
      <nav
        className={styles.mobileBottomNav}
        role="navigation"
        aria-label="Mobile Bottom Navigation"
      >
        <ul className={styles.mobileNavList}>
          {SECTIONS.map((sec) => {
            const isActive = currentSection === sec.id;
            return (
              <li key={sec.id} className={styles.mobileNavItem}>
                <a
                  href={`#${sec.id}`}
                  onClick={(e) => handleNavClick(e, sec.id)}
                  className={`${styles.mobileNavLink} ${isActive ? styles.mobileActiveLink : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`${sec.label} section`}
                >
                  <span className={styles.mobileIconWrapper} aria-hidden="true">
                    {sec.id === 'discover' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    )}
                    {sec.id === 'borrowing' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                    {sec.id === 'lending' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    )}
                    {sec.id === 'account' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </span>
                  <span className={styles.mobileNavLabel}>{sec.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export default Navbar;
