import React, { useState, useRef, useEffect } from 'react';
import { useDemoProfile } from '../context/DemoProfileContext';
import styles from './ProfileSwitcher.module.css';

/**
 * Accessible Classroom Demonstration Profile Switcher.
 *
 * Allows instructors and evaluators to switch between demonstration participants
 * to test both borrower and owner perspectives within a single browser session.
 *
 * @param {object} props
 * @param {'compact'|'cards'} [props.variant='compact'] - Rendering style
 * @param {string} [props.className] - Optional custom class
 */
export function ProfileSwitcher({ variant = 'compact', className = '' }) {
  const { activeProfile, switchProfile, demoProfiles } = useDemoProfile();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);

  // Close on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (profileId) => {
    switchProfile(profileId);
    setIsOpen(false);
  };

  if (!activeProfile) return null;

  // Expanded card grid for Account workspace
  if (variant === 'cards') {
    return (
      <div className={`${styles.expandedContainer} ${className}`} aria-label="Classroom demonstration profiles">
        <div className={styles.expandedGrid}>
          {demoProfiles.map((p) => {
            const isSelected = p.id === activeProfile.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p.id)}
                className={`${styles.cardOption} ${isSelected ? styles.cardOptionActive : ''}`}
                aria-pressed={isSelected}
              >
                <div className={styles.cardTopRow}>
                  <span className={styles.cardAvatar} aria-hidden="true">
                    {p.avatar}
                  </span>
                  <span className={styles.roleTag}>{p.badge}</span>
                </div>
                <div className={styles.cardName}>{p.displayName}</div>
                <div className={styles.cardDesc}>{p.roleDescription}</div>
                {isSelected && (
                  <span className={styles.activeBadge} style={{ marginTop: '8px', alignSelf: 'flex-start' }}>
                    Active Profile
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Compact popover selector for Navbar/Header
  return (
    <div ref={wrapperRef} className={`${styles.switcherWrapper} ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={styles.triggerButton}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Current demo profile: ${activeProfile.displayName}. Click to switch demonstration profile.`}
      >
        <span aria-hidden="true">{activeProfile.avatar}</span>
        <span>{activeProfile.displayName}</span>
        <span className={styles.roleTag}>{activeProfile.badge}</span>
        <span className={`${styles.caretIcon} ${isOpen ? styles.caretOpen : ''}`} aria-hidden="true">
          ▼
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu} role="menu" aria-label="Switch demonstration profile">
          <div className={styles.menuHeader}>
            <span className={styles.menuTitle}>Classroom Demo Profiles</span>
            <span className={styles.menuSubtitle}>
              Switch between simulated profiles to test borrower and owner workflows.
            </span>
          </div>

          {demoProfiles.map((p) => {
            const isSelected = p.id === activeProfile.id;
            return (
              <button
                key={p.id}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(p.id)}
                className={`${styles.profileOption} ${isSelected ? styles.profileOptionActive : ''}`}
              >
                <span className={styles.profileAvatar} aria-hidden="true">
                  {p.avatar}
                </span>
                <div className={styles.profileInfo}>
                  <div className={styles.profileNameRow}>
                    <span className={styles.profileName}>{p.displayName}</span>
                    {isSelected && <span className={styles.activeBadge}>Active</span>}
                  </div>
                  <div className={styles.profileRole}>{p.roleDescription}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProfileSwitcher;
