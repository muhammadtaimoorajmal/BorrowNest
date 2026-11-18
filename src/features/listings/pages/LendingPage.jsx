import React, { useState } from 'react';
import { useListings } from '../hooks/useListings';
import ListingCard from '../components/ListingCard';
import ListingForm from '../components/ListingForm';
import ListingDetailModal from '../components/ListingDetailModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { useBorrowRequests } from '../../borrowing/hooks/useBorrowRequests';
import RequestCard from '../../borrowing/components/RequestCard';
import RequestActionConfirmDialog from '../../borrowing/components/RequestActionConfirmDialog';
import { REQUEST_STATUS } from '../../borrowing/constants/requestStatus';
import styles from './LendingPage.module.css';

export function LendingPage({ adapter }) {
  const {
    activeItems,
    archivedItems,
    stats,
    loading,
    error,
    createListing,
    updateListing,
    toggleAvailability,
    archiveListing,
    restoreListing,
    deleteListing,
  } = useListings(adapter);

  const {
    requests,
    itemsMap,
    approveRequest,
    declineRequest,
  } = useBorrowRequests(adapter);

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived' | 'requests'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingIncomingCount = requests.filter(
    (r) => r.status === REQUEST_STATUS.PENDING,
  ).length;

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
    setActionError(null);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
    setActionError(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setActionError(null);
  };

  const handleSaveListing = async (formData) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      if (editingItem?.id) {
        await updateListing(editingItem.id, formData);
      } else {
        await createListing(formData);
      }
      setIsFormOpen(false);
      setEditingItem(null);
    } catch (err) {
      setActionError(err.message || 'Failed to save listing record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (id) => {
    setActionError(null);
    try {
      await toggleAvailability(id);
    } catch (err) {
      setActionError(err.message || 'Failed to update availability.');
    }
  };

  const handleArchive = async (id) => {
    setActionError(null);
    try {
      await archiveListing(id);
    } catch (err) {
      setActionError(err.message || 'Failed to archive listing.');
    }
  };

  const handleRestore = async (id) => {
    setActionError(null);
    try {
      await restoreListing(id);
    } catch (err) {
      setActionError(err.message || 'Failed to restore listing.');
    }
  };

  const handleDeleteConfirm = async (id) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await deleteListing(id);
      setDeletingItem(null);
    } catch (err) {
      setActionError(err.message || 'Failed to delete listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.pageTitle}>Lending Workspace</h1>
          <p className={styles.pageSubtitle}>
            Manage items you own, coordinate genuine lending availability, and maintain authentic condition records.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className={styles.primaryAddBtn}
          aria-label="Add new item listing"
        >
          <span aria-hidden="true">＋</span> Add New Item
        </button>
      </div>

      {/* Global Error Banner */}
      {(error || actionError) && (
        <div className={styles.errorAlert} role="alert">
          <span className={styles.alertIcon} aria-hidden="true">⚠️</span>
          <span>{actionError || error?.message}</span>
        </div>
      )}

      {/* Real Statistics derived solely from IndexedDB */}
      <section className={styles.statsSection} aria-label="Library Overview">
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Owned</span>
          <span className={styles.statValue}>{stats.total}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Available</span>
          <span className={`${styles.statValue} ${styles.statAvailable}`}>{stats.available}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Unavailable</span>
          <span className={styles.statValue}>{stats.unavailable}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Archived</span>
          <span className={styles.statValue}>{stats.archived}</span>
        </div>
      </section>

      {/* Tab Switcher */}
      <div className={styles.tabBar} role="tablist" aria-label="Listing Status Tabs">
        <button
          type="button"
          role="tab"
          id="tab-active"
          aria-selected={activeTab === 'active'}
          aria-controls="panel-active"
          onClick={() => setActiveTab('active')}
          className={`${styles.tabBtn} ${activeTab === 'active' ? styles.activeTab : ''}`}
        >
          Active Listings <span className={styles.tabBadge}>{stats.active}</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-archived"
          aria-selected={activeTab === 'archived'}
          aria-controls="panel-archived"
          onClick={() => setActiveTab('archived')}
          className={`${styles.tabBtn} ${activeTab === 'archived' ? styles.activeTab : ''}`}
        >
          Archived <span className={styles.tabBadge}>{stats.archived}</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-requests"
          aria-selected={activeTab === 'requests'}
          aria-controls="panel-requests"
          onClick={() => setActiveTab('requests')}
          className={`${styles.tabBtn} ${activeTab === 'requests' ? styles.activeTab : ''}`}
        >
          Incoming Requests <span className={styles.tabBadge}>{pendingIncomingCount}</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className={styles.loadingBox} role="status">
          <span className={styles.spinner} aria-hidden="true"></span>
          <span>Loading local library records...</span>
        </div>
      ) : activeTab === 'active' ? (
        <section id="panel-active" role="tabpanel" aria-labelledby="tab-active">
          {activeItems.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} aria-hidden="true">📦</div>
              <h2 className={styles.emptyTitle}>No items listed yet</h2>
              <p className={styles.emptyText}>
                Your local BorrowNest library is currently empty. As part of our strict data-integrity policy, we never populate the interface with fake listings, fictitious borrowers, or fabricated transactions. Add your own genuine tools or household items to start sharing.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className={styles.emptyActionBtn}
              >
                Add Your First Item
              </button>
            </div>
          ) : (
            <div className={styles.cardsGrid}>
              {activeItems.map((item) => (
                <ListingCard
                  key={item.id}
                  item={item}
                  onView={setViewingItem}
                  onEdit={handleOpenEdit}
                  onToggleAvailability={handleToggleAvailability}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  onDelete={setDeletingItem}
                />
              ))}
            </div>
          )}
        </section>
      ) : activeTab === 'archived' ? (
        <section id="panel-archived" role="tabpanel" aria-labelledby="tab-archived">
          {archivedItems.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} aria-hidden="true">🗄️</div>
              <h2 className={styles.emptyTitle}>No archived listings</h2>
              <p className={styles.emptyText}>
                When you temporarily retire or pack away an item, archive it here to keep your active lending list clean without deleting its history.
              </p>
            </div>
          ) : (
            <div className={styles.cardsGrid}>
              {archivedItems.map((item) => (
                <ListingCard
                  key={item.id}
                  item={item}
                  onView={setViewingItem}
                  onEdit={handleOpenEdit}
                  onToggleAvailability={handleToggleAvailability}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  onDelete={setDeletingItem}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section id="panel-requests" role="tabpanel" aria-labelledby="tab-requests">
          {requests.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} aria-hidden="true">📬</div>
              <h2 className={styles.emptyTitle}>No incoming requests yet</h2>
              <p className={styles.emptyText}>
                When community members discover your items and request to borrow them, their requests will appear here for your review and approval.
              </p>
            </div>
          ) : (
            <div className={styles.requestsList}>
              {requests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  item={itemsMap.get(req.itemId)}
                  perspective="owner"
                  onApprove={(r) => setConfirmAction({ action: 'approve', request: r })}
                  onDecline={(r) => setConfirmAction({ action: 'decline', request: r })}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Form Dialog Modal */}
      {isFormOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.formModalWrapper}>
            <ListingForm
              initialData={editingItem}
              onSave={handleSaveListing}
              onCancel={handleCloseForm}
              isProcessing={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {viewingItem && (
        <ListingDetailModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingItem && (
        <DeleteConfirmDialog
          item={deletingItem}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingItem(null)}
          isDeleting={isSubmitting}
        />
      )}

      {/* Request Action Confirmation Dialog */}
      {confirmAction && (
        <RequestActionConfirmDialog
          action={confirmAction.action}
          request={confirmAction.request}
          item={itemsMap.get(confirmAction.request.itemId)}
          onConfirm={async (requestId) => {
            if (confirmAction.action === 'approve') {
              await approveRequest(requestId);
            } else if (confirmAction.action === 'decline') {
              await declineRequest(requestId);
            }
          }}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

export default LendingPage;
