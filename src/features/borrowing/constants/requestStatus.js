/**
 * Borrowing Request Status Enumeration & Lifecycle Invariants (DR-02).
 */

export const REQUEST_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  CANCELLED: 'CANCELLED',
});

export const REQUEST_STATUS_META = Object.freeze({
  [REQUEST_STATUS.PENDING]: {
    id: 'PENDING',
    label: 'Pending Review',
    description: 'Awaiting item owner review and approval.',
    badgeClass: 'badgePending',
    isTerminal: false,
  },
  [REQUEST_STATUS.APPROVED]: {
    id: 'APPROVED',
    label: 'Approved (Reserved)',
    description: 'The owner has approved this borrowing period. Dates are reserved.',
    badgeClass: 'badgeApproved',
    isTerminal: true,
  },
  [REQUEST_STATUS.DECLINED]: {
    id: 'DECLINED',
    label: 'Declined',
    description: 'The owner declined this request. Dates are released.',
    badgeClass: 'badgeDeclined',
    isTerminal: true,
  },
  [REQUEST_STATUS.CANCELLED]: {
    id: 'CANCELLED',
    label: 'Cancelled',
    description: 'The requester cancelled this request before owner decision.',
    badgeClass: 'badgeCancelled',
    isTerminal: true,
  },
});

export function isTerminalStatus(status) {
  return status === REQUEST_STATUS.APPROVED ||
    status === REQUEST_STATUS.DECLINED ||
    status === REQUEST_STATUS.CANCELLED;
}

export function canCancelRequest(status) {
  return status === REQUEST_STATUS.PENDING;
}

export function canDecideRequest(status) {
  return status === REQUEST_STATUS.PENDING;
}
