import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  CATEGORIES,
  CONDITION_TIERS,
  AVAILABILITY_STATUS,
  CONSTRAINTS,
  validateItemRecord,
  checkPrivacyPatterns,
} from '../validation/itemValidation';
import { processItemImage } from '../services/processItemImage';
import styles from './ListingForm.module.css';

/**
 * Maps storage and database errors to actionable, user-friendly messages.
 * Does not expose raw internal stack traces.
 */
function mapStorageErrorToMessage(err) {
  if (!err) return 'Failed to save listing record.';
  const msg = err.message || String(err);
  const lower = msg.toLowerCase();

  if (err.name === 'QuotaExceededError' || lower.includes('quota')) {
    return 'Browser storage quota exceeded. Your browser storage is full and cannot save this photograph. Please clear older data in Account & Data Management or use a smaller photo.';
  }
  if (err.name === 'DuplicateKeyError') {
    return 'A listing with this ID already exists. Please try saving again.';
  }
  if (err.name === 'RecordNotFoundError') {
    return 'The listing record could not be found to update.';
  }
  if (lower.includes('validation failed') || err.validationErrors) {
    return 'Please correct the validation errors in the form before saving.';
  }
  if (lower.includes('database') || lower.includes('indexeddb') || lower.includes('transaction')) {
    return `Local database transaction failed: ${msg}. Please ensure your browser supports IndexedDB and is not running in restricted private mode.`;
  }
  return msg || 'An unexpected error occurred while saving the listing. Please try again.';
}

export function ListingForm({
  initialData = null,
  onSave,
  onCancel,
  isProcessing = false,
  externalError = null,
}) {
  const isEdit = Boolean(initialData?.id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'TOOLS',
    conditionGrade: 4,
    conditionNotes: '',
    approximateArea: '',
    availability: 'AVAILABLE',
    status: 'ACTIVE',
    photoAttestation: false,
    ...initialData,
  });

  const [photos, setPhotos] = useState(initialData?.photos || []);
  const [fieldErrors, setFieldErrors] = useState({});
  const [privacyWarning, setPrivacyWarning] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const displayedSubmitError = submitError || (externalError ? mapStorageErrorToMessage({ message: externalError }) : null);

  const submitErrorRef = useRef(null);
  const validationSummaryRef = useRef(null);

  // Synchronize photo previews from Blobs or dataUrls
  const photoPreviews = useMemo(() => {
    return photos.map((p) => {
      if (p.dataUrl) return p.dataUrl;
      if (p.blob instanceof Blob) {
        return URL.createObjectURL(p.blob);
      }
      return null;
    });
  }, [photos]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [photoPreviews]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: val }));
    setSubmitError(null);

    // Clear specific field error
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    // Live privacy check on approximateArea
    if (name === 'approximateArea') {
      const warning = checkPrivacyPatterns(val);
      setPrivacyWarning(warning);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (photos.length + files.length > CONSTRAINTS.MAX_PHOTOS) {
      setImageError(`A listing can have at most ${CONSTRAINTS.MAX_PHOTOS} photos.`);
      return;
    }

    setImageError(null);
    setSubmitError(null);
    setIsProcessingImage(true);

    try {
      const processedResults = [];
      for (const file of files) {
        const processed = await processItemImage(file);
        const photoId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        processedResults.push({
          id: photoId,
          blob: processed.blob,
          altText: '',
          mimeType: processed.mimeType,
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.sizeBytes,
        });
      }

      setPhotos((prev) => [...prev, ...processedResults]);

      // Clear photos field error if now present
      if (fieldErrors.photos) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.photos;
          return next;
        });
      }
    } catch (err) {
      setImageError(err.message || 'Failed to process selected photograph.');
    } finally {
      setIsProcessingImage(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleAltTextChange = (index, altText) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], altText };
      return next;
    });

    if (fieldErrors[`photo_${index}_alt`]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[`photo_${index}_alt`];
        return next;
      });
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const focusFirstInvalidElement = (errors) => {
    const errorKeys = Object.keys(errors);
    if (!errorKeys.length) return;

    const firstKey = errorKeys[0];
    let targetId = null;

    if (firstKey === 'title') targetId = 'listing-title';
    else if (firstKey === 'category') targetId = 'listing-category';
    else if (firstKey === 'conditionGrade') targetId = 'listing-condition';
    else if (firstKey === 'description') targetId = 'listing-description';
    else if (firstKey === 'approximateArea') targetId = 'listing-area';
    else if (firstKey === 'photos') targetId = 'photo-upload-input';
    else if (firstKey.endsWith('_alt')) {
      const match = firstKey.match(/photo_(\d+)_alt/);
      if (match) targetId = `photo-alt-${match[1]}`;
    } else if (firstKey === 'photoAttestation') targetId = 'photo-attestation';

    setTimeout(() => {
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          el.focus?.();
          if (typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
      }
      validationSummaryRef.current?.focus?.();
      if (typeof validationSummaryRef.current?.scrollIntoView === 'function') {
        validationSummaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const isSaving = isProcessing || isSubmittingInternal;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isSaving || isProcessingImage) return;

    setSubmitError(null);

    const candidate = {
      status: formData.status || 'ACTIVE',
      ...formData,
      photos,
      conditionGrade: Number(formData.conditionGrade),
    };

    const { isValid, errors } = validateItemRecord(candidate);

    if (!isValid) {
      setFieldErrors(errors);
      focusFirstInvalidElement(errors);
      return;
    }

    setIsSubmittingInternal(true);
    try {
      await onSave(candidate);
      // On confirmed success, parent will close the modal and refresh
    } catch (err) {
      const friendly = mapStorageErrorToMessage(err);
      setSubmitError(friendly);
      setTimeout(() => {
        submitErrorRef.current?.focus?.();
        if (typeof submitErrorRef.current?.scrollIntoView === 'function') {
          submitErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    } finally {
      setIsSubmittingInternal(false);
    }
  };

  const validationErrorCount = Object.keys(fieldErrors).length;

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit} noValidate>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          {isEdit ? 'Edit Item Listing' : 'Create Item Listing'}
        </h2>
        <p className={styles.formSubtitle}>
          List genuine tools, appliances, or outdoor gear you own to share with your local community.
        </p>
      </div>

      {/* Persistence or Storage Error Alert Banner (Inside Modal) */}
      {displayedSubmitError && (
        <div
          ref={submitErrorRef}
          className={styles.submitErrorAlert}
          role="alert"
          tabIndex={-1}
          aria-live="assertive"
        >
          <span className={styles.alertIcon} aria-hidden="true">⚠️</span>
          <div className={styles.alertBody}>
            <strong className={styles.alertTitle}>Storage Error: Could not save listing</strong>
            <p className={styles.alertText}>{displayedSubmitError}</p>
          </div>
        </div>
      )}

      {/* Validation Error Summary Banner (Inside Modal) */}
      {validationErrorCount > 0 && (
        <div
          ref={validationSummaryRef}
          className={styles.validationErrorAlert}
          role="alert"
          tabIndex={-1}
          aria-live="polite"
        >
          <span className={styles.alertIcon} aria-hidden="true">⚠️</span>
          <div className={styles.alertBody}>
            <strong className={styles.alertTitle}>
              Please correct the {validationErrorCount} highlighted error{validationErrorCount > 1 ? 's' : ''} below before saving.
            </strong>
          </div>
        </div>
      )}

      {/* Item Title */}
      <div className={styles.fieldGroup}>
        <label htmlFor="listing-title" className={styles.label}>
          Item Title <span className={styles.requiredMark}>*</span>
        </label>
        <input
          id="listing-title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Cordless Hammer Drill 18V"
          maxLength={CONSTRAINTS.TITLE_MAX_LEN}
          className={`${styles.input} ${fieldErrors.title ? styles.inputError : ''}`}
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? 'title-error' : undefined}
          required
        />
        {fieldErrors.title && (
          <p id="title-error" className={styles.errorMessage} role="alert">
            {fieldErrors.title}
          </p>
        )}
        <span className={styles.charCount}>
          {formData.title.length}/{CONSTRAINTS.TITLE_MAX_LEN}
        </span>
      </div>

      {/* Category and Condition Grid */}
      <div className={styles.twoColumnGrid}>
        {/* Category */}
        <div className={styles.fieldGroup}>
          <label htmlFor="listing-category" className={styles.label}>
            Category <span className={styles.requiredMark}>*</span>
          </label>
          <select
            id="listing-category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`${styles.select} ${fieldErrors.category ? styles.inputError : ''}`}
            aria-invalid={Boolean(fieldErrors.category)}
            aria-describedby={fieldErrors.category ? 'category-error' : undefined}
          >
            {Object.values(CATEGORIES).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label} — {cat.description}
              </option>
            ))}
          </select>
          {fieldErrors.category && (
            <p id="category-error" className={styles.errorMessage} role="alert">
              {fieldErrors.category}
            </p>
          )}
        </div>

        {/* Condition Grade */}
        <div className={styles.fieldGroup}>
          <label htmlFor="listing-condition" className={styles.label}>
            Initial Condition <span className={styles.requiredMark}>*</span>
          </label>
          <select
            id="listing-condition"
            name="conditionGrade"
            value={formData.conditionGrade}
            onChange={handleChange}
            className={`${styles.select} ${fieldErrors.conditionGrade ? styles.inputError : ''}`}
            aria-invalid={Boolean(fieldErrors.conditionGrade)}
            aria-describedby={fieldErrors.conditionGrade ? 'condition-error' : undefined}
          >
            {Object.values(CONDITION_TIERS)
              .sort((a, b) => b.grade - a.grade)
              .map((tier) => (
                <option key={tier.grade} value={tier.grade}>
                  {tier.grade} — {tier.label} ({tier.description.split('.')[0]})
                </option>
              ))}
          </select>
          {fieldErrors.conditionGrade && (
            <p id="condition-error" className={styles.errorMessage} role="alert">
              {fieldErrors.conditionGrade}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className={styles.fieldGroup}>
        <label htmlFor="listing-description" className={styles.label}>
          Item Description <span className={styles.requiredMark}>*</span>
        </label>
        <textarea
          id="listing-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Describe the item's specifications, included attachments, usage instructions, and safety precautions."
          maxLength={CONSTRAINTS.DESC_MAX_LEN}
          className={`${styles.textarea} ${fieldErrors.description ? styles.inputError : ''}`}
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={fieldErrors.description ? 'desc-error' : undefined}
          required
        />
        {fieldErrors.description && (
          <p id="desc-error" className={styles.errorMessage} role="alert">
            {fieldErrors.description}
          </p>
        )}
        <span className={styles.charCount}>
          {formData.description.length}/{CONSTRAINTS.DESC_MAX_LEN} (minimum {CONSTRAINTS.DESC_MIN_LEN})
        </span>
      </div>

      {/* Condition Notes (Optional) */}
      <div className={styles.fieldGroup}>
        <label htmlFor="listing-condition-notes" className={styles.label}>
          Condition Notes (Optional)
        </label>
        <textarea
          id="listing-condition-notes"
          name="conditionNotes"
          value={formData.conditionNotes}
          onChange={handleChange}
          rows={2}
          placeholder="Mention pre-existing scratches, battery health, quirks, or minor cosmetic marks."
          maxLength={CONSTRAINTS.NOTES_MAX_LEN}
          className={styles.textarea}
        />
      </div>

      {/* General Pickup Area (DR-05 Privacy Protected) */}
      <div className={styles.fieldGroup}>
        <label htmlFor="listing-area" className={styles.label}>
          General Pickup Area <span className={styles.requiredMark}>*</span>
        </label>
        <input
          id="listing-area"
          name="approximateArea"
          type="text"
          value={formData.approximateArea}
          onChange={handleChange}
          placeholder="e.g. West End / Near Riverfront Park or Islamabad"
          maxLength={CONSTRAINTS.AREA_MAX_LEN}
          className={`${styles.input} ${fieldErrors.approximateArea ? styles.inputError : ''}`}
          aria-invalid={Boolean(fieldErrors.approximateArea)}
          aria-describedby="area-helper"
          required
        />
        <p id="area-helper" className={styles.helperText}>
          Enter only a broad neighborhood, district, or nearby public landmark. Do not enter a street address, house or apartment number, postcode, gate code, or private access instructions.
        </p>

        {privacyWarning && (
          <div className={styles.privacyWarningAlert} role="status">
            <span className={styles.warningIcon} aria-hidden="true">⚠️</span>
            <span>{privacyWarning}</span>
          </div>
        )}

        {fieldErrors.approximateArea && (
          <p id="area-error" className={styles.errorMessage} role="alert">
            {fieldErrors.approximateArea}
          </p>
        )}
      </div>

      {/* Availability Status */}
      <div className={styles.fieldGroup}>
        <label htmlFor="listing-availability" className={styles.label}>
          Listing Availability Preference
        </label>
        <select
          id="listing-availability"
          name="availability"
          value={formData.availability}
          onChange={handleChange}
          className={styles.select}
        >
          {Object.values(AVAILABILITY_STATUS).map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
        <p className={styles.helperText}>
          You can toggle this preference at any time from your Lending workspace.
        </p>
      </div>

      {/* Genuine Photo Section */}
      <fieldset className={styles.photoFieldset}>
        <legend className={styles.legend}>
          Authentic Item Photographs <span className={styles.requiredMark}>*</span>
        </legend>
        <p className={styles.helperText}>
          Upload genuine photographs of the actual physical item. Stock photos, AI-generated images, and manufacturer marketing shots are strictly prohibited. Original EXIF metadata and GPS coordinates are automatically stripped on your device.
        </p>

        {photos.length < CONSTRAINTS.MAX_PHOTOS && (
          <div className={styles.uploadArea}>
            <label htmlFor="photo-upload-input" className={styles.uploadButton}>
              <span aria-hidden="true">📷</span>
              <span>{isProcessingImage ? 'Processing & Stripping EXIF...' : 'Choose Item Photograph (JPEG, PNG, WebP)'}</span>
            </label>
            <input
              id="photo-upload-input"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              disabled={isProcessingImage || isSaving}
              className={styles.hiddenFileInput}
              multiple
            />
          </div>
        )}

        {imageError && (
          <p className={styles.errorMessage} role="alert">
            {imageError}
          </p>
        )}

        {fieldErrors.photos && (
          <p id="photos-error" className={styles.errorMessage} role="alert">
            {fieldErrors.photos}
          </p>
        )}

        {/* Photo Previews & Alt Text Inputs */}
        <div className={styles.photoList}>
          {photos.map((photo, index) => (
            <div key={photo.id || index} className={styles.photoCard}>
              <div className={styles.photoThumbWrapper}>
                {photoPreviews[index] && (
                  <img
                    src={photoPreviews[index]}
                    alt={`Preview #${index + 1}`}
                    className={styles.photoThumb}
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className={styles.removePhotoBtn}
                  aria-label={`Remove photograph #${index + 1}`}
                  disabled={isSaving}
                >
                  ✕
                </button>
              </div>

              <div className={styles.photoMetaInputs}>
                <label htmlFor={`photo-alt-${index}`} className={styles.label}>
                  Image Description (Alt Text) <span className={styles.requiredMark}>*</span>
                </label>
                <input
                  id={`photo-alt-${index}`}
                  type="text"
                  value={photo.altText}
                  onChange={(e) => handleAltTextChange(index, e.target.value)}
                  placeholder="e.g. Front view of cordless drill showing battery pack and chuck"
                  maxLength={CONSTRAINTS.ALT_MAX_LEN}
                  className={`${styles.input} ${
                    fieldErrors[`photo_${index}_alt`] ? styles.inputError : ''
                  }`}
                  aria-invalid={Boolean(fieldErrors[`photo_${index}_alt`])}
                  disabled={isSaving}
                  required
                />
                {fieldErrors[`photo_${index}_alt`] && (
                  <p id={`photo-alt-${index}-error`} className={styles.errorMessage} role="alert">
                    {fieldErrors[`photo_${index}_alt`]}
                  </p>
                )}
                <span className={styles.charCount}>
                  {(photo.altText || '').length}/{CONSTRAINTS.ALT_MAX_LEN} (minimum {CONSTRAINTS.ALT_MIN_LEN})
                </span>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {/* Photo Attestation (DR-04 Authenticity Confirmation) */}
      <div
        className={`${styles.checkboxFieldGroup} ${
          fieldErrors.photoAttestation ? styles.checkboxFieldGroupError : ''
        }`}
      >
        <div className={styles.checkboxTopLine}>
          <input
            id="photo-attestation"
            name="photoAttestation"
            type="checkbox"
            checked={formData.photoAttestation}
            onChange={handleChange}
            className={styles.checkbox}
            disabled={isSaving}
            aria-invalid={Boolean(fieldErrors.photoAttestation)}
            aria-describedby={
              fieldErrors.photoAttestation ? 'photo-attestation-error' : undefined
            }
            aria-required="true"
            required
          />
          <label htmlFor="photo-attestation" className={styles.checkboxLabel}>
            <strong>I confirm that uploaded photographs genuinely represent the actual physical item being listed</strong> and are not stock photos, marketing renders, or AI-generated pictures. <span className={styles.requiredMark}>*</span>
          </label>
        </div>

        <div className={styles.attestationBadgeRow}>
          <span className={styles.attestationBadge}>Mandatory Authenticity Confirmation</span>
        </div>

        {fieldErrors.photoAttestation && (
          <p id="photo-attestation-error" className={styles.errorMessage} role="alert">
            {fieldErrors.photoAttestation}
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className={styles.buttonRow}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className={styles.cancelButton}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving || isProcessingImage}
          className={styles.submitButton}
        >
          {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Listing'}
        </button>
      </div>
    </form>
  );
}

export default ListingForm;
