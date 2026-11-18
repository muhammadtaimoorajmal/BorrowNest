import React, { useState, useEffect } from 'react';
import { CONDITION_TIERS } from '../../listings/validation/itemValidation';
import { processItemImage, ALLOWED_INPUT_MIME_TYPES } from '../../listings/services/processItemImage';
import { formatDateRange } from '../services/dateRange';
import styles from './CollectionHandoverDialog.module.css';

/**
 * Accessible Modal Dialog for Recording Physical Collection Handover & Borrower Receipt (DR-04).
 *
 * @param {object} props
 * @param {'owner_handover'|'borrower_receipt'} props.mode
 * @param {object} props.loan - Loan lifecycle record
 * @param {object} [props.item] - Item listing
 * @param {function} props.onSubmit - Submission handler
 * @param {function} props.onClose - Dismissal handler
 */
export function CollectionHandoverDialog({
  mode = 'owner_handover',
  loan,
  item,
  onSubmit,
  onClose,
}) {
  const [conditionGrade, setConditionGrade] = useState(
    item?.conditionGrade ? String(item.conditionGrade) : '4',
  );
  const [notes, setNotes] = useState('');
  const [observation, setObservation] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoAltMap, setPhotoAltMap] = useState({});
  const [processingImage, setProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubmitting]);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (photos.length + files.length > 5) {
      setError('A maximum of 5 photographs may be attached.');
      return;
    }

    setProcessingImage(true);
    setError(null);

    try {
      const newProcessed = [];
      for (const file of files) {
        if (!ALLOWED_INPUT_MIME_TYPES.includes(file.type.toLowerCase())) {
          throw new Error(`File "${file.name}" has unsupported format. Only JPEG, PNG, and WebP are allowed.`);
        }
        const processed = await processItemImage(file);
        const id = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        newProcessed.push({
          id,
          name: file.name,
          blob: processed.blob,
          mimeType: processed.mimeType,
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.sizeBytes,
        });
      }
      setPhotos((prev) => [...prev, ...newProcessed]);
    } catch (err) {
      setError(err.message || 'Failed to process selected image.');
    } finally {
      setProcessingImage(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (photoId) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setPhotoAltMap((prev) => {
      const copy = { ...prev };
      delete copy[photoId];
      return copy;
    });
  };

  const handleAltChange = (photoId, altText) => {
    setPhotoAltMap((prev) => ({
      ...prev,
      [photoId]: altText,
    }));
  };

  const handleSubmitOwnerHandover = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate photo alt texts
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      const alt = (photoAltMap[p.id] || '').trim();
      if (!alt) {
        setError(`Photo #${i + 1} (${p.name || 'image'}) requires an accessible text description (alt text).`);
        return;
      }
    }

    const payloadPhotos = photos.map((p) => ({
      id: p.id,
      blob: p.blob,
      mimeType: p.mimeType,
      altText: photoAltMap[p.id].trim(),
      width: p.width,
      height: p.height,
      sizeBytes: p.sizeBytes,
    }));

    setIsSubmitting(true);
    try {
      await onSubmit(loan.requestId, {
        conditionGrade: Number(conditionGrade),
        notes: notes.trim(),
        photos: payloadPhotos,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record collection handover.');
      setIsSubmitting(false);
    }
  };

  const handleSubmitBorrowerReceipt = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(loan.requestId, observation.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to confirm collection receipt.');
      setIsSubmitting(false);
    }
  };

  const collectionCp = loan?.collectionCheckpoint;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="handover-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerTitles}>
            <span className={styles.eyebrow}>
              {mode === 'owner_handover' ? 'Physical Handover Recording' : 'Borrower Receipt Confirmation'}
            </span>
            <h2 id="handover-dialog-title" className={styles.title}>
              {loan.itemTitleSnapshot || item?.title || 'Item Collection'}
            </h2>
            <span className={styles.subtitle}>
              Agreed Period: {formatDateRange(loan.collectionDate, loan.returnDeadline)} • Borrower: <strong>{loan.borrowerAlias}</strong>
            </span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </header>

        <div className={styles.body}>
          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          {mode === 'owner_handover' ? (
            <form onSubmit={handleSubmitOwnerHandover} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="condition-grade-select" className={styles.label}>
                  Standardized Condition Grade at Handover <span aria-hidden="true">*</span>
                </label>
                <select
                  id="condition-grade-select"
                  className={styles.select}
                  value={conditionGrade}
                  onChange={(e) => setConditionGrade(e.target.value)}
                  required
                >
                  {Object.values(CONDITION_TIERS)
                    .sort((a, b) => b.grade - a.grade)
                    .map((tier) => (
                      <option key={tier.grade} value={tier.grade}>
                        {tier.grade} — {tier.label} ({tier.description})
                      </option>
                    ))}
                </select>
                <p className={styles.helperText}>
                  Listing Baseline Condition was: <strong>{item?.conditionGrade ? `${item.conditionGrade}/5 (${CONDITION_TIERS[item.conditionGrade]?.label})` : 'Not recorded'}</strong>.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="handover-notes" className={styles.label}>
                  Handover Observations & Physical State Notes
                </label>
                <textarea
                  id="handover-notes"
                  className={styles.textarea}
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. Battery fully charged, no new cosmetic scratches, accessories included..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <span className={styles.charCount}>{notes.length} / 500 characters</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Genuine Handover Photographs (Optional, Max 5)
                </label>
                <p className={styles.helperText}>
                  Photographs are processed client-side: EXIF metadata is stripped and images are stored locally on this device.
                </p>

                <input
                  type="file"
                  id="photo-upload-input"
                  className={styles.fileInput}
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={processingImage || photos.length >= 5}
                />

                {processingImage && <p className={styles.processingText}>Processing authentic photo...</p>}

                {photos.length > 0 && (
                  <div className={styles.photoList}>
                    {photos.map((p, idx) => (
                      <div key={p.id} className={styles.photoRow}>
                        <span className={styles.photoName}>📷 Photo #{idx + 1} ({p.name || 'Image'})</span>
                        <input
                          type="text"
                          className={styles.altInput}
                          placeholder="Accessible description (required)*"
                          value={photoAltMap[p.id] || ''}
                          onChange={(e) => handleAltChange(p.id, e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className={styles.removePhotoBtn}
                          onClick={() => handleRemovePhoto(p.id)}
                          aria-label={`Remove photo ${idx + 1}`}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.disclosureBox}>
                Notice: BorrowNest records this handover locally on this device. Acknowledging collection creates a local record and does not verify physical identity.
              </div>

              <footer className={styles.footer}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting || processingImage}
                >
                  {isSubmitting ? 'Recording Handover...' : 'Record Collection Handover'}
                </button>
              </footer>
            </form>
          ) : (
            /* Mode === borrower_receipt */
            <form onSubmit={handleSubmitBorrowerReceipt} className={styles.form}>
              <div className={styles.checkpointReviewCard}>
                <h3 className={styles.reviewCardTitle}>Owner Handover Record</h3>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Recorded Condition:</span>
                  <strong>
                    {collectionCp?.conditionGrade}/5 — {collectionCp?.conditionLabel}
                  </strong>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Owner Notes:</span>
                  <span>{collectionCp?.notes || 'No specific notes recorded.'}</span>
                </div>
                {collectionCp?.photos && collectionCp.photos.length > 0 && (
                  <div className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>Photographs:</span>
                    <span>{collectionCp.photos.length} photograph(s) attached by owner.</span>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="borrower-observation" className={styles.label}>
                  Borrower Discrepancy Note or Observation (Optional)
                </label>
                <textarea
                  id="borrower-observation"
                  className={styles.textarea}
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. Inspected on receipt; noted hairline scratch on left handle..."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                />
                <span className={styles.charCount}>{observation.length} / 500 characters</span>
              </div>

              <div className={styles.disclosureBox}>
                Notice: Confirming receipt will activate the loan and transition the item into your local custody. Local acknowledgement stored locally.
              </div>

              <footer className={styles.footer}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Physical Receipt'}
                </button>
              </footer>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default CollectionHandoverDialog;
