import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import LendingPage from './pages/LendingPage';
import { IndexedDbStorageAdapter } from '../../services/storage/IndexedDbStorageAdapter';
import * as imageService from './services/processItemImage';

describe('ListingForm Integration: Full UI-to-IndexedDB Workflow', () => {
  let adapter;
  let dbName;

  beforeEach(async () => {
    dbName = `BorrowNest_ListingForm_Test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    adapter = new IndexedDbStorageAdapter(
      null,
      dbName,
    );
    await adapter.initialize();
    await adapter.clearAllItems();
  });

  it('handles complete UI creation flow: filling form, photo upload, alt text, attestation, and persistence', async () => {
    // Mock image processing for JSDOM canvas environment
    vi.spyOn(imageService, 'processItemImage').mockResolvedValue({
      blob: new Blob(['mock-binary-data'], { type: 'image/jpeg' }),
      width: 1200,
      height: 900,
      mimeType: 'image/jpeg',
      sizeBytes: 45000,
    });

    const { unmount } = render(<LendingPage adapter={adapter} />);

    // 1. Open create modal
    const addBtn = await screen.findByRole('button', { name: /Add new item listing/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /Create Item Listing/i })).toBeInTheDocument();

    // 2. Fill required fields (matching owner scenario)
    fireEvent.change(screen.getByLabelText(/Item Title/i), {
      target: { value: 'Helloe World' },
    });
    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: 'TOOLS' },
    });
    fireEvent.change(screen.getByLabelText(/Initial Condition/i), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByLabelText(/Item Description/i), {
      target: {
        value: 'This is a genuine workshop power tool that is in great working condition.',
      },
    });
    fireEvent.change(screen.getByLabelText(/Condition Notes/i), {
      target: { value: 'dfdsfsdf' },
    });
    fireEvent.change(screen.getByLabelText(/General Pickup Area/i), {
      target: { value: 'Islamabad' },
    });

    // 3. Upload a mock photo
    const fileInput = document.getElementById('photo-upload-input');
    const fakeFile = new File(['fake-image-bytes'], 'test-photo.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    // 4. Verify preview and fill alt text
    const altInput = await screen.findByLabelText(/Image Description \(Alt Text\)/i);
    expect(altInput).toBeInTheDocument();
    fireEvent.change(altInput, { target: { value: 'hello world' } });

    // 5. ATTEMPT SUBMISSION WITH ATTESTATION DELIBERATELY UNCHECKED
    const attestationCheckbox = screen.getByLabelText(/I confirm that uploaded photographs genuinely represent/i);
    expect(attestationCheckbox.checked).toBe(false);

    const submitBtn = screen.getByRole('button', { name: /Create Listing/i });
    fireEvent.click(submitBtn);

    // Verify refusal with visible actionable error
    const attestationError = await screen.findByText(
      /You must confirm that uploaded photographs/i,
    );
    expect(attestationError).toBeInTheDocument();

    // Modal remains open and no item was created
    expect(screen.getByRole('heading', { name: /Create Item Listing/i })).toBeInTheDocument();
    const itemsBefore = await adapter.listItems();
    expect(itemsBefore.length).toBe(0);

    // 6. NOW CHECK THE ATTESTATION AND SUBMIT
    fireEvent.click(attestationCheckbox);
    expect(attestationCheckbox.checked).toBe(true);

    fireEvent.click(submitBtn);

    // 7. Modal closes only after confirmed persistence
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Create Item Listing/i })).not.toBeInTheDocument();
    });

    // 8. Item appears in Lending workspace and Total Owned updates
    expect(await screen.findByText('Helloe World')).toBeInTheDocument();
    expect(screen.getByText('Total Owned')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);

    // 9. Verify IndexedDB record directly
    const persistedItems = await adapter.listItems();
    expect(persistedItems.length).toBe(1);
    expect(persistedItems[0].title).toBe('Helloe World');
    expect(persistedItems[0].approximateArea).toBe('Islamabad');
    expect(persistedItems[0].photos.length).toBe(1);
    expect(persistedItems[0].photos[0].altText).toBe('hello world');
    expect(persistedItems[0].photoAttestation).toBe(true);

    // 10. Simulate page reload / session restart to confirm persistent display
    unmount();
    const freshAdapter = new IndexedDbStorageAdapter(null, dbName);
    await freshAdapter.initialize();
    render(<LendingPage adapter={freshAdapter} />);
    expect(await screen.findByText('Helloe World')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
  });

  it('handles asynchronous save failure: shows error inside modal and preserves form values', async () => {
    vi.spyOn(imageService, 'processItemImage').mockResolvedValue({
      blob: new Blob(['mock-binary-data'], { type: 'image/jpeg' }),
      width: 1200,
      height: 900,
      mimeType: 'image/jpeg',
      sizeBytes: 45000,
    });

    // Mock adapter.createItem to reject with a simulated quota exceeded error
    const quotaError = new Error('QuotaExceededError: The quota has been exceeded.');
    quotaError.name = 'QuotaExceededError';
    vi.spyOn(adapter, 'createItem').mockRejectedValueOnce(quotaError);

    render(<LendingPage adapter={adapter} />);

    // Open create modal
    const addBtn = await screen.findByRole('button', { name: /Add new item listing/i });
    fireEvent.click(addBtn);

    // Fill valid form
    fireEvent.change(screen.getByLabelText(/Item Title/i), {
      target: { value: 'High Pressure Washer' },
    });
    fireEvent.change(screen.getByLabelText(/Item Description/i), {
      target: {
        value: 'Heavy duty pressure washer with adjustable nozzle and detergent tank.',
      },
    });
    fireEvent.change(screen.getByLabelText(/General Pickup Area/i), {
      target: { value: 'F-10 Markaz' },
    });

    // Upload photo and fill alt text
    const fileInput = document.getElementById('photo-upload-input');
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['bytes'], 'washer.jpg', { type: 'image/jpeg' })],
      },
    });
    const altInput = await screen.findByLabelText(/Image Description \(Alt Text\)/i);
    fireEvent.change(altInput, { target: { value: 'Yellow pressure washer unit' } });

    // Check attestation
    const attestationCheckbox = screen.getByLabelText(/I confirm that uploaded photographs genuinely represent/i);
    fireEvent.click(attestationCheckbox);

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Create Listing/i });
    fireEvent.click(submitBtn);

    // Verify modal remains open
    expect(screen.getByRole('heading', { name: /Create Item Listing/i })).toBeInTheDocument();

    // Verify actionable error is shown INSIDE the modal
    const storageAlert = await screen.findByText(/Browser storage quota exceeded/i);
    expect(storageAlert).toBeInTheDocument();

    // Verify form values remain preserved
    expect(screen.getByLabelText(/Item Title/i).value).toBe('High Pressure Washer');
    expect(screen.getByLabelText(/General Pickup Area/i).value).toBe('F-10 Markaz');
    expect(screen.getByLabelText(/Image Description \(Alt Text\)/i).value).toBe(
      'Yellow pressure washer unit',
    );
  });

  it('rejects prohibited address patterns with descriptive privacy error', async () => {
    vi.spyOn(imageService, 'processItemImage').mockResolvedValue({
      blob: new Blob(['mock-binary-data'], { type: 'image/jpeg' }),
      width: 1200,
      height: 900,
      mimeType: 'image/jpeg',
      sizeBytes: 45000,
    });

    render(<LendingPage adapter={adapter} />);

    const addBtn = await screen.findByRole('button', { name: /Add new item listing/i });
    fireEvent.click(addBtn);

    // Fill prohibited street address
    fireEvent.change(screen.getByLabelText(/Item Title/i), {
      target: { value: 'Orbit Sander 200W' },
    });
    fireEvent.change(screen.getByLabelText(/Item Description/i), {
      target: {
        value: 'Random orbit sander with dust collection bag and 10 sanding discs.',
      },
    });
    fireEvent.change(screen.getByLabelText(/General Pickup Area/i), {
      target: { value: '142 Elm Street, Apt 4B' },
    });

    const fileInput = document.getElementById('photo-upload-input');
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['bytes'], 'sander.jpg', { type: 'image/jpeg' })],
      },
    });
    const altInput = await screen.findByLabelText(/Image Description \(Alt Text\)/i);
    fireEvent.change(altInput, { target: { value: 'Sander device' } });

    fireEvent.click(
      screen.getByLabelText(/I confirm that uploaded photographs genuinely represent/i),
    );

    const submitBtn = screen.getByRole('button', { name: /Create Listing/i });
    fireEvent.click(submitBtn);

    // Submitting blocked due to privacy pattern
    const privacyErrors = await screen.findAllByText(/Possible street address detected/i);
    expect(privacyErrors.length).toBeGreaterThanOrEqual(1);

    // Modal remains open and no item in database
    expect(screen.getByRole('heading', { name: /Create Item Listing/i })).toBeInTheDocument();
    const items = await adapter.listItems();
    expect(items.length).toBe(0);
  });
});
