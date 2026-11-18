import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import App from '../../App';
import { IndexedDbStorageAdapter } from '../../services/storage/IndexedDbStorageAdapter';

describe('Cross-Module Integration: Lending to Discovery Lifecycle', () => {
  let adapter;

  beforeEach(async () => {
    window.location.hash = '#lending';
    adapter = new IndexedDbStorageAdapter(null, 'BorrowNest_CrossModule_Test');
    await adapter.initialize();
    await adapter.clearAllItems();
  });

  it('reflects listing creation, availability toggles, and archiving seamlessly between Lending and Discover', async () => {
    // 1. Initial render on Lending workspace
    await act(async () => {
      render(<App adapter={adapter} />);
    });

    expect(await screen.findByRole('heading', { name: /Lending Workspace/i })).toBeInTheDocument();

    // 2. Pre-populate item directly via storage adapter to simulate listed item
    const newItem = {
      id: 'cross-test-item-1',
      title: 'Telescopic Tree Pruner 14ft',
      description: 'Extendable manual pole saw and pruner with rope-pulley leverage.',
      category: 'GARDENING',
      conditionGrade: 4,
      conditionNotes: 'Sharp blade, smooth rope action.',
      approximateArea: 'Greenwood / Pine Valley',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photos: [
        {
          id: 'p-1',
          dataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
          altText: 'Tree pruner pole saw fully extended',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await adapter.createItem(newItem);

    // 3. Navigate to Discover workspace via hashchange
    await act(async () => {
      window.location.hash = '#discover';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    // 4. Verify item appears in Discover
    expect(await screen.findByRole('heading', { name: /Item Discovery & Catalog/i })).toBeInTheDocument();
    expect(await screen.findByText('Telescopic Tree Pruner 14ft')).toBeInTheDocument();
    expect(screen.getByText(/Showing 1 of 1 item/i)).toBeInTheDocument();

    // 5. Test Availability Filter in Discover
    const availableCheckbox = screen.getByLabelText(/Available now only/i);
    expect(availableCheckbox).not.toBeChecked();

    // 6. Navigate back to Lending
    await act(async () => {
      window.location.hash = '#lending';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(await screen.findByRole('heading', { name: /Lending Workspace/i })).toBeInTheDocument();

    // 7. Update item in storage (archive it)
    const storedItem = await adapter.getItemById('cross-test-item-1');
    storedItem.status = 'ARCHIVED';
    await adapter.updateItem(storedItem);

    // 8. Navigate back to Discover
    await act(async () => {
      window.location.hash = '#discover';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    // 9. Discover mounts afresh and honestly displays empty state
    expect(await screen.findByRole('heading', { name: /Item Discovery & Catalog/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /No items listed yet/i })).toBeInTheDocument();
    expect(screen.queryByText('Telescopic Tree Pruner 14ft')).not.toBeInTheDocument();
  });
});
