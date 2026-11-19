import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CATEGORIES, CONDITION_TIERS } from '../../listings/validation/itemValidation';
import { getDemoImageUrl } from '../data/exampleCatalogue';
import { useDemoProfile } from '../../demo/context/DemoProfileContext';
import { getDemoOwnerForCategory } from '../../demo/data/demoProfiles';
import styles from './ItemDetailModal.module.css';

/**
 * Accessible read-only Item Detail Modal dialog.
 * Adheres strictly to WCAG 2.2 accessibility, DR-04 condition tiers, and DR-05 location privacy.
 *
 * @param {object} props
 * @param {object} props.item - The selected item listing
 * @param {function} props.onClose - Modal close handler
 * @param {function} [props.onRequestBorrow] - Handler for initiating borrow request (for genuine local items)
 * @param {function} [props.onNavigateToLending] - Handler to navigate to lending workspace (for demo items)
 */
export function ItemDetailModal({ item, onClose, onRequestBorrow, onNavigateToLending }) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Focus close button on mount
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Convert photos to object URLs and manage cleanup (for real user uploads)
  const photoUrls = useMemo(() => {
    if (item.imagePath) {
      return [getDemoImageUrl(item.imagePath)];
    }
    if (!item.photos || !Array.isArray(item.photos)) return [];
    return item.photos.map((p) => {
      if (p.dataUrl) return p.dataUrl;
      if (p.blob instanceof Blob) {
        return URL.createObjectURL(p.blob);
      }
      return null;
    });
  }, [item.imagePath, item.photos]);

  useEffect(() => {
    return () => {
      photoUrls.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [photoUrls]);

  const categoryInfo = CATEGORIES[item.category] || { label: item.category || 'General' };
  const conditionInfo = CONDITION_TIERS[item.conditionGrade] || {
    label: `Tier ${item.conditionGrade}`,
    description: 'Condition details not specified.',
  };

  const isAvailable = item.availability === 'AVAILABLE';
  const currentPhoto = item.photos?.[activePhotoIndex];
  const currentPhotoUrl = photoUrls[activePhotoIndex];

  const { activeProfile } = useDemoProfile();
  const assignedOwner = useMemo(() => {
    if (item.ownerProfileId && item.ownerDisplayName) {
      return { id: item.ownerProfileId, displayName: item.ownerDisplayName };
    }
    if (item.isDemo && item.category) {
      return getDemoOwnerForCategory(item.category);
    }
    return null;
  }, [item.ownerProfileId, item.ownerDisplayName, item.isDemo, item.category]);

  const isOwner = Boolean(
    activeProfile && assignedOwner && activeProfile.id === assignedOwner.id,
  );

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
        className={styles.modal}
      >
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <span className={styles.categoryTag}>{categoryInfo.label}</span>
            <h2 id="item-modal-title" className={styles.title}>
              {item.title}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close item details"
          >
            ✕
          </button>
        </header>

        <div className={styles.body}>
          {/* Demonstration Notice Banner (DR-01 / Module 06) */}
          {item.isDemo && (
            <div className={styles.demoNoticeBanner} role="note">
              <span aria-hidden="true">💡</span>
              <div>
                <strong>Classroom Demonstration Listing</strong>
                <p>
                  Classroom demonstration listing. This item is assigned to {assignedOwner?.displayName || 'Demo Owner'}. Availability and borrowing activity are simulated in this browser.
                </p>
              </div>
            </div>
          )}

          {/* Photo Gallery */}
          {photoUrls.length > 0 && (
            <div className={styles.gallerySection}>
              <div className={styles.mainImageWrapper}>
                {currentPhotoUrl ? (
                  <img
                    src={currentPhotoUrl}
                    alt={item.imageAlt || currentPhoto?.altText || `${item.title} photo`}
                    className={styles.mainImage}
                  />
                ) : (
                  <div className={styles.mainImage}>No preview available</div>
                )}
              </div>

              {photoUrls.length > 1 && (
                <div className={styles.thumbnailRow} role="tablist" aria-label="Item photo thumbnails">
                  {photoUrls.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={idx === activePhotoIndex}
                      aria-label={`View photo ${idx + 1} of ${photoUrls.length}`}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`${styles.thumbnailBtn} ${
                        idx === activePhotoIndex ? styles.thumbnailBtnActive : ''
                      }`}
                    >
                      <img
                        src={url}
                        alt={item.photos?.[idx]?.altText || `Thumbnail ${idx + 1}`}
                        className={styles.thumbnailImg}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Description</h3>
            <p className={styles.descriptionText}>{item.description}</p>
          </div>

          {/* Key Specifications (Example Items) */}
          {item.specifications && Array.isArray(item.specifications) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Key Specifications</h3>
              <ul className={styles.specList}>
                {item.specifications.map((spec, idx) => (
                  <li key={idx}>{spec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Use Case */}
          {item.suggestedUseCase && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Potential Use Case</h3>
              <p className={styles.descriptionText}>{item.suggestedUseCase}</p>
            </div>
          )}

          {/* Specifications and Location */}
          <div className={styles.gridSpecs}>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Classification</span>
              <span className={styles.specValue}>
                {item.isDemo ? '✨ Classroom Demonstration Listing' : 'Community Equipment Listing'}
              </span>
            </div>

            <div className={styles.specItem}>
              <span className={styles.specLabel}>Availability Status</span>
              <span className={styles.specValue}>
                {isAvailable ? '✅ Available for borrowing' : '⏳ Currently unavailable'}
              </span>
            </div>

            <div className={styles.specItem}>
              <span className={styles.specLabel}>Condition Grade</span>
              <span className={styles.specValue}>
                {conditionInfo.label} (Tier {item.conditionGrade || 4}/5)
              </span>
            </div>

            {assignedOwner && (
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Simulated Owner</span>
                <span className={styles.specValue}>👤 {assignedOwner.displayName}</span>
              </div>
            )}

            {item.approximateArea && (
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Approximate Area (DR-05)</span>
                <span className={styles.specValue}>📍 {item.approximateArea}</span>
              </div>
            )}
          </div>

          {/* Condition Notes / Description */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Condition Inspection</h3>
            <div className={styles.notesBox}>
              {item.isDemo
                ? 'Sample condition information — not a verified physical inspection.'
                : item.conditionDescription || item.conditionNotes || conditionInfo.description}
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.dismissBtn}>
            Close
          </button>

          {isOwner ? (
            <button
              type="button"
              disabled
              className={styles.requestBtnDisabled}
              title="You own this demonstration item. Switch to Demo Borrower to request it."
            >
              You Own This Item ({assignedOwner?.displayName})
            </button>
          ) : !isAvailable ? (
            <button
              type="button"
              disabled
              className={styles.requestBtnDisabled}
              title="Item is currently marked unavailable"
            >
              Unavailable for Request
            </button>
          ) : onRequestBorrow ? (
            <button
              type="button"
              onClick={() => onRequestBorrow(item)}
              className={styles.requestBtn}
            >
              Request to Borrow
            </button>
          ) : onNavigateToLending ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToLending();
              }}
              className={styles.addOwnItemBtn}
            >
              Add Your Own Item in Lending
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

export default ItemDetailModal;
