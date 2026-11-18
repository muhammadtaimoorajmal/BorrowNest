import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, CONDITION_TIERS } from '../validation/itemValidation';
import styles from './ListingDetailModal.module.css';

export function ListingDetailModal({ item, onClose }) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const photos = item?.photos;

  const photoUrls = useMemo(() => {
    if (!photos?.length) return [];
    return photos.map((p) => {
      if (p.dataUrl) return p.dataUrl;
      if (p.blob instanceof Blob) return URL.createObjectURL(p.blob);
      return null;
    });
  }, [photos]);

  useEffect(() => {
    return () => {
      photoUrls.forEach((url) => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [photoUrls]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const categoryInfo = CATEGORIES[item.category] || { label: item.category };
  const conditionInfo = CONDITION_TIERS[item.conditionGrade] || {
    label: `Tier ${item.conditionGrade}`,
    description: '',
  };

  const isAvailable = item.availability === 'AVAILABLE';
  const activeUrl = photoUrls[activePhotoIndex] || null;
  const activePhoto = item.photos?.[activePhotoIndex] || null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        <div className={styles.modalHeader}>
          <div className={styles.headerInfo}>
            <span className={styles.categoryBadge}>{categoryInfo.label}</span>
            <h2 id="detail-modal-title" className={styles.title}>
              {item.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Close details dialog"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Photo Gallery */}
          <div className={styles.gallery}>
            {activeUrl ? (
              <div className={styles.mainImageContainer}>
                <img
                  src={activeUrl}
                  alt={activePhoto?.altText || item.title}
                  className={styles.mainImage}
                />
                {activePhoto?.altText && (
                  <p className={styles.altCaption}>
                    <span className={styles.altLabel}>Photo description:</span> {activePhoto.altText}
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.noPhotoBox}>
                <span>No photo available</span>
              </div>
            )}

            {photoUrls.length > 1 && (
              <div className={styles.thumbStrip}>
                {photoUrls.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`${styles.thumbBtn} ${idx === activePhotoIndex ? styles.activeThumb : ''}`}
                    aria-label={`View photo #${idx + 1}`}
                  >
                    <img src={url} alt={`Thumbnail #${idx + 1}`} className={styles.thumbImg} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Info */}
          <div className={styles.infoSection}>
            <div className={styles.statusPillsRow}>
              <span
                className={`${styles.statusPill} ${
                  isAvailable ? styles.availablePill : styles.unavailablePill
                }`}
              >
                {isAvailable ? 'Available for borrowing' : 'Not currently available'}
              </span>
              <span className={styles.conditionPill}>
                Condition: {conditionInfo.label} ({item.conditionGrade}/5)
              </span>
              {item.status === 'ARCHIVED' && (
                <span className={styles.archivedPill}>Archived Listing</span>
              )}
            </div>

            <div className={styles.detailBlock}>
              <h3 className={styles.blockHeading}>General Pickup Area</h3>
              <p className={styles.areaText}>
                📍 {item.approximateArea}
              </p>
              <span className={styles.privacyNote}>
                Notice: Specific street addresses are never stored in BorrowNest to protect owner privacy.
              </span>
            </div>

            <div className={styles.detailBlock}>
              <h3 className={styles.blockHeading}>Condition Assessment</h3>
              <p className={styles.conditionDesc}>{conditionInfo.description}</p>
              {item.conditionNotes && (
                <p className={styles.conditionNotesText}>
                  <strong>Owner notes:</strong> {item.conditionNotes}
                </p>
              )}
            </div>

            <div className={styles.detailBlock}>
              <h3 className={styles.blockHeading}>Description & Guidelines</h3>
              <p className={styles.descText}>{item.description}</p>
            </div>

            <div className={styles.timestampRow}>
              <span>Listed: {new Date(item.createdAt).toLocaleDateString()}</span>
              {item.updatedAt !== item.createdAt && (
                <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.doneBtn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ListingDetailModal;
