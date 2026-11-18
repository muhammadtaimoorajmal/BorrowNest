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
}
