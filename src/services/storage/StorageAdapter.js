/**
 * StorageAdapter interface specification for BorrowNest.
 * Encapsulates all persistent data access operations.
 */
export class StorageAdapter {
  async initialize() {
    throw new Error('Method not implemented: initialize');
  }

  async listItems(_options = {}) {
    throw new Error('Method not implemented: listItems');
  }

  async getItemById(_id) {
    throw new Error('Method not implemented: getItemById');
  }

  async createItem(_item) {
    throw new Error('Method not implemented: createItem');
  }

  async updateItem(_item) {
    throw new Error('Method not implemented: updateItem');
  }

  async archiveItem(_id) {
    throw new Error('Method not implemented: archiveItem');
  }

  async restoreItem(_id) {
    throw new Error('Method not implemented: restoreItem');
  }

  async deleteItem(_id) {
    throw new Error('Method not implemented: deleteItem');
  }

  async countItems(_options = {}) {
    throw new Error('Method not implemented: countItems');
  }

  async clearAllItems() {
    throw new Error('Method not implemented: clearAllItems');
  }

  async bulkCreateItems(_items) {
    throw new Error('Method not implemented: bulkCreateItems');
  }

  async replaceAllItems(_items) {
    throw new Error('Method not implemented: replaceAllItems');
  }

  // Module 05: Borrowing Request and Scheduling operations (DR-02, DR-03)
  async createBorrowRequest(_request) {
    throw new Error('Method not implemented: createBorrowRequest');
  }

  async getBorrowRequestById(_id) {
    throw new Error('Method not implemented: getBorrowRequestById');
  }

  async listBorrowRequests(_options = {}) {
    throw new Error('Method not implemented: listBorrowRequests');
  }

  async approveBorrowRequest(_id) {
    throw new Error('Method not implemented: approveBorrowRequest');
  }

  async declineBorrowRequest(_id) {
    throw new Error('Method not implemented: declineBorrowRequest');
  }

  async cancelBorrowRequest(_id) {
    throw new Error('Method not implemented: cancelBorrowRequest');
  }

  async countBorrowRequests(_options = {}) {
    throw new Error('Method not implemented: countBorrowRequests');
  }

  async clearAllBorrowRequests() {
    throw new Error('Method not implemented: clearAllBorrowRequests');
  }

  async replaceAllData(_data) {
    throw new Error('Method not implemented: replaceAllData');
  }

  async mergeAllData(_data) {
    throw new Error('Method not implemented: mergeAllData');
  }
}
