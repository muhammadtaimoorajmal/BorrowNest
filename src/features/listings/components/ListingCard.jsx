import React, { useMemo, useEffect } from 'react';
import { CATEGORIES, CONDITION_TIERS } from '../validation/itemValidation';
import styles from './ListingCard.module.css';

export function ListingCard({
  item,
  onView,
  onEdit,
  onToggleAvailability,
  onArchive,
  onRestore,
  onDelete,
}) {
  const primaryPhoto = item.photos && item.photos.length > 0 ? item.photos[0] : null;

  const imageUrl = useMemo(() => {
    if (!primaryPhoto) return null;
    if (primaryPhoto.dataUrl) return primaryPhoto.dataUrl;
    if (primaryPhoto.blob instanceof Blob) {
      return URL.createObjectURL(primaryPhoto.blob);
    }
    return null;
  }, [primaryPhoto]);

  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const categoryInfo = CATEGORIES[item.category] || { label: item.category };
  const conditionInfo = CONDITION_TIERS[item.conditionGrade] || {
    label: `Tier ${item.conditionGrade}`,
  };

  const isAvailable = item.availability === 'AVAILABLE';
  const isArchived = item.status === 'ARCHIVED';

  return (
    <article className={`${styles.card} ${isArchived ? styles.archivedCard : ''}`}>
      <div className={styles.imageContainer}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={primaryPhoto?.altText || item.title}
            className={styles.image}
            loading="lazy"
          />
        ) : (
          <div className={styles.noPhotoPlaceholder}>
            <span className={styles.noPhotoIcon} aria-hidden="true">📷</span>
            <span className={styles.noPhotoText}>No photo available</span>
          </div>
        )}
        <div className={styles.badgeRow}>
          <span
            className={`${styles.availabilityBadge} ${
              isAvailable ? styles.badgeAvailable : styles.badgeUnavailable
            }`}
          >
            {isAvailable ? 'Available' : 'Unavailable'}
          </span>
          {isArchived && <span className={styles.archivedBadge}>Archived</span>}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.metaRow}>
          <span className={styles.categoryPill}>{categoryInfo.label}</span>
          <span className={styles.conditionPill} title={conditionInfo.description}>
            Condition: {conditionInfo.label}
          </span>
        </div>

        <h3 className={styles.title}>{item.title}</h3>

        <p className={styles.areaRow}>
          <svg className={styles.areaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className={styles.areaText}>{item.approximateArea}</span>
        </p>

        <p className={styles.descriptionSnippet}>
          {item.description.length > 120
            ? `${item.description.substring(0, 117)}...`
            : item.description}
        </p>

        <div className={styles.actionToolbar}>
          <button
            type="button"
            onClick={() => onView(item)}
            className={`${styles.actionBtn} ${styles.viewBtn}`}
            aria-label={`View details for ${item.title}`}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className={`${styles.actionBtn} ${styles.editBtn}`}
            aria-label={`Edit ${item.title}`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onToggleAvailability(item.id)}
            className={`${styles.actionBtn} ${styles.toggleBtn}`}
            aria-label={isAvailable ? `Mark ${item.title} unavailable` : `Mark ${item.title} available`}
          >
            {isAvailable ? 'Set Unavailable' : 'Set Available'}
          </button>
          {isArchived ? (
            <button
              type="button"
              onClick={() => onRestore(item.id)}
              className={`${styles.actionBtn} ${styles.restoreBtn}`}
              aria-label={`Restore ${item.title} to active listings`}
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onArchive(item.id)}
              className={`${styles.actionBtn} ${styles.archiveBtn}`}
              aria-label={`Archive ${item.title}`}
            >
              Archive
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(item)}
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            aria-label={`Delete ${item.title}`}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default ListingCard;
