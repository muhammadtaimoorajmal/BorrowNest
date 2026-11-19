import React from 'react';
import BrandMark from './BrandMark';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header} role="banner">
      <div className={styles.container}>
        <div className={styles.brandWrapper}>
          <BrandMark showTagline={true} />
        </div>
        <div
          className={styles.statusPill}
          role="status"
          title="BorrowNest is an interactive classroom marketplace prototype. Demo profiles and marketplace activity are stored in this browser and do not synchronize between different visitors."
        >
          <span className={styles.statusDot} aria-hidden="true"></span>
          <span className={styles.statusText}>Classroom Demo Prototype</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
