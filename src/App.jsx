import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './navigation/Navbar';
import LendingPage from './features/listings/pages/LendingPage';
import AccountPage from './features/account/pages/AccountPage';
import DiscoverPage from './features/discover/pages/DiscoverPage';
import BorrowingPlaceholder from './features/borrowing/BorrowingPlaceholder';
import Footer from './components/Footer';
import { storageAdapter } from './services/storage/IndexedDbStorageAdapter';
import styles from './App.module.css';

const VALID_SECTIONS = ['discover', 'borrowing', 'lending', 'account'];
const DEFAULT_SECTION = 'lending';

function getSectionFromHash() {
  if (typeof window === 'undefined') return DEFAULT_SECTION;
  const rawHash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return VALID_SECTIONS.includes(rawHash) ? rawHash : DEFAULT_SECTION;
}

export function App({ adapter = storageAdapter }) {
  const [currentSection, setCurrentSection] = useState(getSectionFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      const nextSection = getSectionFromHash();
      setCurrentSection(nextSection);
    };

    window.addEventListener('hashchange', handleHashChange);

    // If initial hash is empty, set default
    if (!window.location.hash) {
      window.location.hash = DEFAULT_SECTION;
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigateTo = useCallback((sectionId) => {
    if (VALID_SECTIONS.includes(sectionId)) {
      window.location.hash = sectionId;
      setCurrentSection(sectionId);
    }
  }, []);

  return (
    <div className={styles.appWrapper}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar currentSection={currentSection} onNavigate={navigateTo} />

      <main id="main-content" className={styles.mainContent} tabIndex="-1">
        {currentSection === 'discover' && (
          <DiscoverPage adapter={adapter} onNavigateToLending={() => navigateTo('lending')} />
        )}
        {currentSection === 'borrowing' && (
          <BorrowingPlaceholder onNavigateToLending={() => navigateTo('lending')} />
        )}
        {currentSection === 'lending' && <LendingPage adapter={adapter} />}
        {currentSection === 'account' && (
          <AccountPage storageAdapter={adapter} onDataRestored={() => navigateTo('lending')} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
