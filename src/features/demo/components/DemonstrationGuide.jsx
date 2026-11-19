import React, { useState } from 'react';
import { useDemoProfile } from '../context/DemoProfileContext';
import styles from './DemonstrationGuide.module.css';

/**
 * Interactive Instructor Guide: "How to Demonstrate BorrowNest".
 * Explains the 8-step borrower-lender workflow and provides one-click profile switching.
 *
 * @param {object} props
 * @param {boolean} [props.defaultOpen=false] - Whether guide starts expanded
 * @param {function} [props.onNavigateToSection] - Optional callback to switch workspaces
 */
export function DemonstrationGuide({ defaultOpen = false, onNavigateToSection: _onNavigateToSection }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { activeProfile, switchProfile, demoProfiles } = useDemoProfile();

  const steps = [
    {
      num: '1',
      title: 'Browse',
      desc: 'Select Demo Borrower. Open Discover and explore the 20 pre-seeded sample equipment listings with authentic photography.',
    },
    {
      num: '2',
      title: 'Request',
      desc: 'Choose an available item (e.g. Cordless Drill) and submit a structured borrowing request with pickup and return dates.',
    },
    {
      num: '3',
      title: 'Switch Owner',
      desc: 'Check the assigned demo owner (e.g. Demo Owner — Tools) and switch to that profile using the switcher or one-click button.',
    },
    {
      num: '4',
      title: 'Approve',
      desc: 'Navigate to Borrowing → Owner View. Review the incoming request details and click "Approve Request" to book dates.',
    },
    {
      num: '5',
      title: 'Switch Borrower',
      desc: 'Switch back to Demo Borrower. Open Borrowing → Borrower View to verify the approved reservation status.',
    },
    {
      num: '6',
      title: 'Collection Handover',
      desc: 'Switch to owner to record collection condition (1–5). Then switch to borrower to confirm physical receipt.',
    },
    {
      num: '7',
      title: 'Return Inspection',
      desc: 'Borrower marks the item returned. Then switch to owner to record return inspection and complete the loan.',
    },
    {
      num: '8',
      title: 'Review Comparison',
      desc: 'Inspect the 3-column condition comparison (baseline, collection, return) and verified audit history.',
    },
  ];

  return (
    <aside className={styles.guideContainer} aria-label="Classroom demonstration guide">
      <div
        className={styles.guideHeader}
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        aria-expanded={isOpen}
      >
        <div className={styles.titleArea}>
          <span className={styles.guideIcon} aria-hidden="true">💡</span>
          <div>
            <h2 className={styles.guideTitle}>How to Demonstrate BorrowNest</h2>
          </div>
          <span className={styles.guideBadge}>Instructor Walkthrough</span>
        </div>
        <button
          type="button"
          className={styles.toggleBtn}
          aria-label={isOpen ? 'Hide demonstration guide' : 'Show demonstration guide'}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
        >
          {isOpen ? 'Collapse Guide ▲' : 'Expand Guide ▼'}
        </button>
      </div>

      {isOpen && (
        <div className={styles.guideBody}>
          <p className={styles.guideLead}>
            Follow this 8-step sequence to demonstrate the complete borrowing, scheduling, and physical inspection lifecycle using the 5 pre-configured demonstration profiles on this device.
          </p>

          <div className={styles.stepsGrid}>
            {steps.map((s) => (
              <div key={s.num} className={styles.stepCard}>
                <div className={styles.stepNumberRow}>
                  <span className={styles.stepNumber}>Step {s.num}</span>
                  <strong className={styles.stepTitle}>{s.title}</strong>
                </div>
                <div className={styles.stepDesc}>{s.desc}</div>
              </div>
            ))}
          </div>

          <div className={styles.quickSwitchRow}>
            <span className={styles.quickSwitchLabel}>Quick Profile Switch:</span>
            {(demoProfiles || []).map((p) => {
              const isActive = p.id === activeProfile?.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => switchProfile(p.id)}
                  className={`${styles.quickProfileBtn} ${isActive ? styles.quickProfileBtnActive : ''}`}
                  title={`Switch active demo profile to ${p.displayName} (${p.badge})`}
                >
                  <span aria-hidden="true">{p.avatar}</span>
                  <span>{p.displayName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

export default DemonstrationGuide;
