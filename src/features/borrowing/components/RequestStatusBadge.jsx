import React from 'react';
import { REQUEST_STATUS, REQUEST_STATUS_META } from '../constants/requestStatus';
import styles from './RequestStatusBadge.module.css';

const STATUS_CLASS_MAP = {
  [REQUEST_STATUS.PENDING]: styles.statusPending,
  [REQUEST_STATUS.APPROVED]: styles.statusApproved,
  [REQUEST_STATUS.DECLINED]: styles.statusDeclined,
  [REQUEST_STATUS.CANCELLED]: styles.statusCancelled,
};

const STATUS_ICON_MAP = {
  [REQUEST_STATUS.PENDING]: '⏳',
  [REQUEST_STATUS.APPROVED]: '✓',
  [REQUEST_STATUS.DECLINED]: '✕',
  [REQUEST_STATUS.CANCELLED]: '⊘',
};

/**
 * Accessible visual badge indicating borrowing request status.
 *
 * @param {object} props
 * @param {string} props.status - Status string from REQUEST_STATUS
 */
export function RequestStatusBadge({ status }) {
  const meta = REQUEST_STATUS_META[status] || {
    label: status || 'Unknown',
    description: 'Unknown status',
  };

  const statusClass = STATUS_CLASS_MAP[status] || styles.statusCancelled;
  const icon = STATUS_ICON_MAP[status] || '•';

  return (
    <span
      className={`${styles.badge} ${statusClass}`}
      title={meta.description}
      aria-label={`Status: ${meta.label}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span>{meta.label}</span>
    </span>
  );
}

export default RequestStatusBadge;
