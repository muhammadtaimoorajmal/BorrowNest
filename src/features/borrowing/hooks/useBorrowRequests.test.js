import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBorrowRequests } from './useBorrowRequests';

describe('useBorrowRequests hook with sequencing (B7)', () => {
  it('loads requests and loans and populates lookup maps', async () => {
    const mockAdapter = {
      listBorrowRequests: vi.fn().mockResolvedValue([
        {
          id: 'req-1',
          itemId: 'item-1',
          status: 'APPROVED',
          createdAt: '2026-11-18T10:00:00.000Z',
        },
      ]),
      listItems: vi.fn().mockResolvedValue([
        { id: 'item-1', title: 'Pressure Washer' },
      ]),
      listLoans: vi.fn().mockResolvedValue([
        {
          requestId: 'req-1',
          itemId: 'item-1',
          status: 'RESERVED',
          createdAt: '2026-11-18T10:00:00.000Z',
        },
      ]),
    };

    const { result } = renderHook(() => useBorrowRequests(mockAdapter));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.requests.length).toBe(1);
    expect(result.current.loans.length).toBe(1);
    expect(result.current.itemsMap.get('item-1')?.title).toBe('Pressure Washer');
    expect(result.current.loansMap.get('req-1')?.status).toBe('RESERVED');
  });

  it('guarantees request sequencing so older out-of-order responses do not overwrite newer state', async () => {
    let slowResolve;
    const slowPromise = new Promise((resolve) => {
      slowResolve = resolve;
    });

    const mockAdapter = {
      listBorrowRequests: vi
        .fn()
        // First call: slow
        .mockImplementationOnce(() => slowPromise)
        // Second call: fast
        .mockResolvedValueOnce([
          { id: 'req-fast', itemId: 'item-1', status: 'PENDING', createdAt: '2026-11-18T12:00:00.000Z' },
        ]),
      listItems: vi.fn().mockResolvedValue([]),
      listLoans: vi.fn().mockResolvedValue([]),
    };

    const { result } = renderHook(() => useBorrowRequests(mockAdapter));

    // Trigger second refresh while first is pending
    await act(async () => {
      result.current.refresh();
    });

    // Resolve the first slow call with stale data
    await act(async () => {
      slowResolve([
        { id: 'req-stale', itemId: 'item-1', status: 'DECLINED', createdAt: '2026-11-18T08:00:00.000Z' },
      ]);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Must have the fast newer data ('req-fast'), NOT the older stale data ('req-stale')
    expect(result.current.requests.some((r) => r.id === 'req-fast')).toBe(true);
    expect(result.current.requests.some((r) => r.id === 'req-stale')).toBe(false);
  });
});
