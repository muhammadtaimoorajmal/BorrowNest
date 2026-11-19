import React from 'react';
import styles from './Footer.module.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div>
            <span className={styles.footerBrand}>
              Borrow<span className={styles.brandAccent}>Nest</span>
            </span>
            <p className={styles.footerTagline}>
              Share what you own. Borrow what you need.
            </p>
          </div>
          <div className={styles.metaBadge}>
            <span>Local-First Community Sharing</span>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <p className={styles.copyright}>
            &copy; {currentYear} BorrowNest Contributors. Open source under the{' '}
            <span className={styles.licenseName}>MIT License</span>.
          </p>
          <p className={styles.disclaimer}>
            BorrowNest is a local-first prototype. Listings, requests and loan records are stored in this browser. It does not yet publish items to a shared online marketplace or synchronize data between users.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
