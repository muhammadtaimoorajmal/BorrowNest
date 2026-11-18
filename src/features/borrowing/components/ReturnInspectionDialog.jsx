import React, { useState, useEffect } from 'react';
import { CONDITION_TIERS } from '../../listings/validation/itemValidation';
import { processItemImage, ALLOWED_INPUT_MIME_TYPES } from '../../listings/services/processItemImage';
import { formatDateRange } from '../services/dateRange';
import styles from './ReturnInspectionDialog.module.css';

/**
 * Accessible Modal Dialog for Recording Physical Return Marking and Owner Return Inspection (DR-04).
 *
 * @param {object} props
 * @param {'borrower_mark_return'|'owner_inspection'} props.mode
 * @param {object} props.loan - Loan lifecycle record
 * @param {object} [props.item] - Item listing
 * @param {function} props.onSubmit - Submission handler
 * @param {function} props.onClose - Dismissal handler
 */
export function ReturnInspectionDialog({
  mode = 'owner_inspection',
  loan,
  item,
  onSubmit,
  onClose,
}) {
  const [conditionGrade, setConditionGrade] = useState(
    loan?.collectionCheckpoint?.conditionGrade
      ? String(loan.collectionCheckpoint.conditionGrade)
      : item?.conditionGrade
        ? String(item.conditionGrade)
        : '4',
  );
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoAltMap, setPhotoAltMap] = useState({});
  const [processingImage, setProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

  const handleSubmitOwnerInspection = async (e) => {
    e.preventDefault();
    setError(null);

    if (!loan?.returnCheckpoint?.borrowerReturnMarkedAt) {
      setError('Cannot complete return inspection: Borrower has not marked the physical item as returned.');
      return;
    }

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
      setError(err.message || 'Failed to complete return inspection.');
      setIsSubmitting(false);
    }
  };

  const handleSubmitBorrowerReturnMark = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(loan.requestId);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to mark return.');
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
        aria-labelledby="return-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerTitles}>
            <span className={styles.eyebrow}>
              {mode === 'owner_inspection' ? 'DR-04 Return Condition Inspection' : 'Physical Return Notification'}
            </span>
            <h2 id="return-dialog-title" className={styles.title}>
              {loan.itemTitleSnapshot || item?.title || 'Item Return'}
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

          {mode === 'borrower_mark_return' ? (
            <form onSubmit={handleSubmitBorrowerReturnMark} className={styles.form}>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Physical Item Return</h3>
                <p className={styles.infoCardText}>
                  Please confirm that you have physically returned <strong>{loan.itemTitleSnapshot || item?.title}</strong> to the owner.
                </p>
                <p className={styles.infoCardText}>
                  After you confirm, the owner will complete a physical condition inspection before the borrowing record is closed.
                </p>
              </div>

              <div className={styles.disclosureBox}>
                Notice: BorrowNest operates entirely on your local device. Recording this action creates a local acknowledgement and does not deliver remote SMS or email notifications.
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
                  {isSubmitting ? 'Recording...' : 'Mark Item as Physically Returned'}
                </button>
              </footer>
            </form>
          ) : (
            /* Mode === owner_inspection */
            <form onSubmit={handleSubmitOwnerInspection} className={styles.form}>
              {!loan?.returnCheckpoint?.borrowerReturnMarkedAt && (
                <div className={styles.awaitingWarning} role="alert">
                  <span aria-hidden="true">⚠️</span>
                  <span>
                    Cannot complete inspection: The borrower has not marked this item as returned. Owner condition inspection is only permitted after physical return is acknowledged.
                  </span>
                </div>
              )}

              {/* Prior Checkpoints Summary for Reference */}
              <div className={styles.checkpointReferenceGrid}>
                <div className={styles.referenceCol}>
                  <span className={styles.referenceLabel}>Listing Baseline:</span>
                  <strong>
                    {item?.conditionGrade ? `${item.conditionGrade}/5 — ${CONDITION_TIERS[item.conditionGrade]?.label}` : 'Not recorded'}
                  </strong>
                  <span className={styles.referenceNotes}>{item?.conditionNotes || 'No baseline notes'}</span>
                </div>
                <div className={styles.referenceCol}>
                  <span className={styles.referenceLabel}>Collection Handover:</span>
                  <strong>
                    {collectionCp?.conditionGrade ? `${collectionCp.conditionGrade}/5 — ${collectionCp.conditionLabel}` : 'Not recorded'}
                  </strong>
                  <span className={styles.referenceNotes}>{collectionCp?.notes || 'No handover notes'}</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="return-condition-select" className={styles.label}>
                  Standardized Return Condition Grade <span aria-hidden="true">*</span>
                </label>
                <select
                  id="return-condition-select"
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
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="return-inspection-notes" className={styles.label}>
                  Return Inspection Observations & Physical Condition Notes
                </label>
                <textarea
                  id="return-inspection-notes"
                  className={styles.textarea}
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. Returned clean and tested working. No new signs of wear..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <span className={styles.charCount}>{notes.length} / 500 characters</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Genuine Return Photographs (Optional, Max 5)
                </label>
                <p className={styles.helperText}>
                  Photographs are processed client-side: EXIF metadata is stripped and images are stored locally on this device.
                </p>

                <input
                  type="file"
                  id="return-photo-upload-input"
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
                Notice: Completing this inspection closes the active loan and releases the scheduled calendar reservation. Condition records are informational observations for transparency.
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
                  disabled={isSubmitting || processingImage || !loan?.returnCheckpoint?.borrowerReturnMarkedAt}
                >
                  {isSubmitting ? 'Completing Inspection...' : 'Complete Return Inspection'}
                </button>
              </footer>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReturnInspectionDialog;
