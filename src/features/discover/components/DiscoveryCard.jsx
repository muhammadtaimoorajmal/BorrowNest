import React, { useMemo, useEffect } from 'react';
import { CATEGORIES, CONDITION_TIERS } from '../../listings/validation/itemValidation';
import { getDemoImageUrl } from '../data/exampleCatalogue';
import styles from './DiscoveryCard.module.css';

/**
 * Read-only item presentation card for public local catalog discovery.
 * Strictly adheres to DR-01, DR-04, and DR-05.
 * Contains no owner-only management controls (edit, archive, delete, toggle).
 *
 * @param {object} props
 * @param {object} props.item - Item data object
 * @param {function} props.onView - Handler called when user clicks "View Details"
 */
export function DiscoveryCard({ item, onView }) {
  const primaryPhoto = item.photos && item.photos.length > 0 ? item.photos[0] : null;

  const imageUrl = useMemo(() => {
    if (item.imagePath) {
      return getDemoImageUrl(item.imagePath);
    }
    if (!primaryPhoto) return null;
    if (primaryPhoto.dataUrl) return primaryPhoto.dataUrl;
    if (primaryPhoto.blob instanceof Blob) {
      return URL.createObjectURL(primaryPhoto.blob);
    }
    return null;
  }, [item.imagePath, primaryPhoto]);

  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const categoryInfo = CATEGORIES[item.category] || { label: item.category || 'General' };
  const conditionInfo = CONDITION_TIERS[item.conditionGrade] || {
    label: `Tier ${item.conditionGrade}`,
  };

  const isAvailable = item.availability === 'AVAILABLE';

  return (
    <article className={styles.card} aria-label={`Item listing: ${item.title}`}>
      <div className={styles.imageContainer}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.imageAlt || primaryPhoto?.altText || item.title}
            className={styles.image}
            loading="lazy"
          />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon} aria-hidden="true">
              📷
            </span>
            <span className={styles.placeholderText}>No photo provided</span>
          </div>
        )}

        <div className={styles.badgeRow}>
          {item.isDemo ? (
            <span className={styles.demoBadge}>Example Item</span>
          ) : (
            <span
              className={`${styles.availabilityBadge} ${
                isAvailable ? styles.availableBadge : styles.unavailableBadge
              }`}
            >
              {isAvailable ? 'Available' : 'Unavailable'}
            </span>
          )}
          <span className={styles.categoryBadge}>{categoryInfo.label}</span>
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.description}>{item.description}</p>

        <div className={styles.metaRow}>
          {item.isDemo ? (
            <span className={styles.conditionChip}>Illustrative Example</span>
          ) : (
            <span className={styles.conditionChip} title={conditionInfo.description}>
              Condition: {conditionInfo.label}
            </span>
          )}
          {!item.isDemo && item.approximateArea && (
            <span className={styles.areaChip}>
              <span aria-hidden="true">📍</span>
              {item.approximateArea}
            </span>
          )}
        </div>
      </div>

      <div className={styles.cardFooter}>
        <button
          type="button"
          onClick={() => onView(item)}
          className={styles.detailsBtn}
          aria-label={`View details for ${item.title}`}
        >
          View Details
        </button>
      </div>
    </article>
  );
}

export default DiscoveryCard;
