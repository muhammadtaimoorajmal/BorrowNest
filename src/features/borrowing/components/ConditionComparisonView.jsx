import React from 'react';
import { CONDITION_TIERS } from '../../listings/validation/itemValidation';
import {
  compareConditionGrades,
  CONDITION_DISCLAIMER,
} from '../services/conditionValidation';
import { formatDateDisplay } from '../services/dateRange';
import styles from './ConditionComparisonView.module.css';

/**
 * Accessible Side-by-Side Condition Checkpoints Comparison View (DR-04).
 * Presents Listing Baseline, Collection Handover, and Return Inspection.
 *
 * @param {object} props
 * @param {object} [props.item] - Item listing (baseline condition)
 * @param {object} props.loan - Loan lifecycle record
 * @param {function} [props.onClose] - Close modal callback
 */
export function ConditionComparisonView({ item, loan, onClose }) {
  if (!loan) return null;

  const baselineGrade = item?.conditionGrade || null;
  const collectionCp = loan.collectionCheckpoint || null;
  const collectionGrade = collectionCp?.conditionGrade || null;
  const returnCp = loan.returnCheckpoint || null;
  const returnGrade = returnCp?.conditionGrade || null;

  const baselineTier = baselineGrade ? CONDITION_TIERS[baselineGrade] : null;
  const collectionTier = collectionGrade ? CONDITION_TIERS[collectionGrade] : null;
  const returnTier = returnGrade ? CONDITION_TIERS[returnGrade] : null;

  // Change comparisons
  const baselineToCollection = compareConditionGrades(baselineGrade, collectionGrade, 'Listing Baseline', 'Collection Handover');
  const collectionToReturn = compareConditionGrades(
    collectionGrade || baselineGrade,
    returnGrade,
    collectionGrade ? 'Collection Handover' : 'Listing Baseline',
    'Return Inspection',
  );

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="comparison-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerTitles}>
            <span className={styles.eyebrow}>DR-04 Structured Condition Checkpoints</span>
            <h2 id="comparison-dialog-title" className={styles.title}>
              Condition Comparison: {loan.itemTitleSnapshot || item?.title || 'Item Inspection'}
            </h2>
            <span className={styles.subtitle}>
              Borrower: <strong>{loan.borrowerAlias}</strong> • Period: {loan.collectionDate} to {loan.returnDeadline}
            </span>
          </div>
          {onClose && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close comparison view"
            >
              ✕
            </button>
          )}
        </header>

        <div className={styles.body}>
          {/* Informational Disclaimer Banner */}
          <div className={styles.disclaimerBanner} role="note">
            <span className={styles.infoIcon} aria-hidden="true">ℹ️</span>
            <span>{CONDITION_DISCLAIMER}</span>
          </div>

          {/* Change Summary Pills */}
          <div className={styles.summaryBar} aria-label="Condition summary transition indicators">
            <div className={styles.summaryPill}>
              <span className={styles.summaryStage}>Baseline → Collection:</span>
              <strong className={styles.summaryLabel}>{baselineToCollection.label}</strong>
            </div>
            <div className={styles.summaryPill}>
              <span className={styles.summaryStage}>Collection → Return:</span>
              <strong className={styles.summaryLabel}>{collectionToReturn.label}</strong>
            </div>
          </div>

          {/* 3-Column Comparison Grid */}
          <div className={styles.comparisonGrid}>
            {/* Checkpoint 1: Listing Baseline */}
            <section className={styles.checkpointCard} aria-labelledby="cp-baseline-title">
              <header className={styles.checkpointHeader}>
                <span className={styles.stageNumber}>Stage 1</span>
                <h3 id="cp-baseline-title" className={styles.checkpointTitle}>
                  Listing Baseline
                </h3>
                <span className={styles.checkpointMeta}>
                  Initial Owner Listing
                </span>
              </header>

              <div className={styles.checkpointBody}>
                <div className={styles.gradeBadge}>
                  <span className={styles.gradeNumber}>{baselineGrade || '—'} / 5</span>
                  <span className={styles.gradeLabel}>{baselineTier?.label || 'Not Recorded'}</span>
                </div>

                <p className={styles.notesText}>
                  {item?.conditionNotes || 'No specific baseline condition notes recorded.'}
                </p>

                {item?.photos && item.photos.length > 0 ? (
                  <div className={styles.photoThumbList}>
                    {item.photos.map((p, i) => (
                      <div key={p.id || i} className={styles.photoContainer}>
                        {p.dataUrl ? (
                          <img src={p.dataUrl} alt={p.altText || `Baseline photo ${i + 1}`} className={styles.photoThumb} />
                        ) : (
                          <div className={styles.photoPlaceholder}>📷 Photo #{i + 1}</div>
                        )}
                        <span className={styles.photoCaption}>{p.altText}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className={styles.noPhotosNotice}>No baseline photographs attached.</span>
                )}
              </div>

              <footer className={styles.checkpointFooter}>
                <span className={styles.timestamp}>
                  Recorded: {item?.createdAt ? formatDateDisplay(item.createdAt.split('T')[0]) : 'At creation'}
                </span>
                <span className={styles.provenanceNotice}>Owner listing declaration</span>
              </footer>
            </section>

            {/* Checkpoint 2: Collection Handover */}
            <section className={styles.checkpointCard} aria-labelledby="cp-collection-title">
              <header className={styles.checkpointHeader}>
                <span className={styles.stageNumber}>Stage 2</span>
                <h3 id="cp-collection-title" className={styles.checkpointTitle}>
                  Collection Handover
                </h3>
                <span className={styles.checkpointMeta}>
                  Physical Custody Transfer
                </span>
              </header>

              <div className={styles.checkpointBody}>
                {collectionCp ? (
                  <>
                    <div className={styles.gradeBadge}>
                      <span className={styles.gradeNumber}>{collectionGrade} / 5</span>
                      <span className={styles.gradeLabel}>{collectionTier?.label || collectionCp.conditionLabel}</span>
                    </div>

                    <p className={styles.notesText}>
                      <strong>Owner observations:</strong> {collectionCp.notes || 'No specific handover notes recorded.'}
                    </p>

                    {collectionCp.borrowerObservation && (
                      <p className={styles.borrowerObservation}>
                        <strong>Borrower note:</strong> &ldquo;{collectionCp.borrowerObservation}&rdquo;
                      </p>
                    )}

                    {collectionCp.photos && collectionCp.photos.length > 0 ? (
                      <div className={styles.photoThumbList}>
                        {collectionCp.photos.map((p, i) => (
                          <div key={p.id || i} className={styles.photoContainer}>
                            {p.dataUrl ? (
                              <img src={p.dataUrl} alt={p.altText || `Collection photo ${i + 1}`} className={styles.photoThumb} />
                            ) : (
                              <div className={styles.photoPlaceholder}>📷 Photo #{i + 1}</div>
                            )}
                            <span className={styles.photoCaption}>{p.altText}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.noPhotosNotice}>No handover photographs attached.</span>
                    )}
                  </>
                ) : (
                  <div className={styles.emptyCheckpoint}>
                    <span aria-hidden="true">⏳</span>
                    <p>No collection checkpoint available.</p>
                  </div>
                )}
              </div>

              <footer className={styles.checkpointFooter}>
                <span className={styles.timestamp}>
                  {collectionCp?.ownerRecordedAt
                    ? `Recorded: ${formatDateDisplay(collectionCp.ownerRecordedAt.split('T')[0])}`
                    : 'Awaiting handover'}
                </span>
                <span className={styles.provenanceNotice}>
                  {collectionCp?.borrowerReviewedAt
                    ? 'Borrower-side receipt confirmed'
                    : 'Owner-side handover recorded'}
                </span>
              </footer>
            </section>

            {/* Checkpoint 3: Return Inspection */}
            <section className={styles.checkpointCard} aria-labelledby="cp-return-title">
              <header className={styles.checkpointHeader}>
                <span className={styles.stageNumber}>Stage 3</span>
                <h3 id="cp-return-title" className={styles.checkpointTitle}>
                  Return Inspection
                </h3>
                <span className={styles.checkpointMeta}>
                  Final Checkpoint & Completion
                </span>
              </header>

              <div className={styles.checkpointBody}>
                {returnCp ? (
                  <>
                    <div className={styles.gradeBadge}>
                      <span className={styles.gradeNumber}>{returnGrade} / 5</span>
                      <span className={styles.gradeLabel}>{returnTier?.label || returnCp.conditionLabel}</span>
                    </div>

                    <p className={styles.notesText}>
                      <strong>Owner inspection:</strong> {returnCp.notes || 'No specific return inspection notes recorded.'}
                    </p>

                    {returnCp.photos && returnCp.photos.length > 0 ? (
                      <div className={styles.photoThumbList}>
                        {returnCp.photos.map((p, i) => (
                          <div key={p.id || i} className={styles.photoContainer}>
                            {p.dataUrl ? (
                              <img src={p.dataUrl} alt={p.altText || `Return photo ${i + 1}`} className={styles.photoThumb} />
                            ) : (
                              <div className={styles.photoPlaceholder}>📷 Photo #{i + 1}</div>
                            )}
                            <span className={styles.photoCaption}>{p.altText}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.noPhotosNotice}>No return inspection photographs attached.</span>
                    )}
                  </>
                ) : (
                  <div className={styles.emptyCheckpoint}>
                    <span aria-hidden="true">📦</span>
                    <p>No return inspection recorded yet.</p>
                  </div>
                )}
              </div>

              <footer className={styles.checkpointFooter}>
                <span className={styles.timestamp}>
                  {returnCp?.ownerInspectedAt
                    ? `Inspected: ${formatDateDisplay(returnCp.ownerInspectedAt.split('T')[0])}`
                    : 'Awaiting return inspection'}
                </span>
                <span className={styles.provenanceNotice}>
                  {returnCp?.ownerInspectedAt
                    ? 'Owner-side inspection completed'
                    : 'Return pending'}
                </span>
              </footer>
            </section>
          </div>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.closeActionBtn} onClick={onClose}>
            Close Comparison View
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ConditionComparisonView;
