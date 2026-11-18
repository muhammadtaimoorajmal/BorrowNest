import React from 'react';
import Header from './components/Header';
import EmptyState from './components/EmptyState';
import Footer from './components/Footer';
import styles from './App.module.css';

export function App() {
  return (
    <div className={styles.appWrapper}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className={styles.mainContent} tabIndex="-1">
        <div className={styles.container}>
          <div className={styles.introHeader}>
            <h1 className={styles.introTitle}>Community Item Sharing</h1>
            <p className={styles.introLead}>
              BorrowNest is an open-source, local-first lending coordination tool. Share what you own, borrow what you need, and keep clear records of every borrowing arrangement.
            </p>
          </div>

          <EmptyState />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
