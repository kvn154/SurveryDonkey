import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CommunityComparison } from './CommunityComparison';
import { StorageService } from '../../services/storageService';

vi.mock('../../services/storageService', () => ({
  StorageService: {
    getConsensus: vi.fn(),
  },
}));

describe('CommunityComparison', () => {
  const allItems = [
    { id: '1', content: 'Apple' },
    { id: '2', content: 'Banana' },
    { id: '3', content: 'Cherry' },
  ];

  const userRankings = {
    S: [{ id: '1', content: 'Apple' }],
    A: [{ id: '2', content: 'Banana' }],
    B: [{ id: '3', content: 'Cherry' }],
    C: [],
    D: [],
  };

  const communityData = [
    { tier: 'S', items: [{ id: 'q1_1', content: 'Apple' }], percentage: 80 },
    { tier: 'A', items: [{ id: 'q1_2', content: 'Banana' }], percentage: 70 },
    { tier: 'D', items: [{ id: 'q1_3', content: 'Cherry' }], percentage: 60 },
  ];

  it('calculates agreement score correctly with partial credit', async () => {
    (StorageService.getConsensus as any).mockResolvedValue(communityData);

    render(
      <CommunityComparison
        surveyId="test-survey"
        userRankings={userRankings as any}
        allItems={allItems}
        onBack={() => {}}
      />
    );

    // Apple is a perfect match (S vs S) -> 1 point
    // Banana is a perfect match (A vs A) -> 1 point
    // Cherry is a far miss (B vs D) -> 0 points
    // Total points = 2 / 3 = 66.6% -> 67%
    
    await waitFor(() => {
      expect(screen.getByText('67%')).toBeDefined();
    });

    expect(screen.getByText(/2 out of 3 items/)).toBeDefined();
  });

  it('calculates partial credit for near misses', async () => {
     // User: Apple in S. Community: Apple in A.
     // Distance is 1 -> 0.5 points.
     const nearMissData = [
        { tier: 'S', items: [], percentage: 0 },
        { tier: 'A', items: [{ id: 'q1_1', content: 'Apple' }, { id: 'q1_2', content: 'Banana' }], percentage: 75 },
        { tier: 'B', items: [], percentage: 0 },
        { tier: 'C', items: [], percentage: 0 },
        { tier: 'D', items: [{ id: 'q1_3', content: 'Cherry' }], percentage: 60 },
     ];
     (StorageService.getConsensus as any).mockResolvedValue(nearMissData);

     render(
        <CommunityComparison
          surveyId="test-survey"
          userRankings={userRankings as any}
          allItems={allItems}
          onBack={() => {}}
        />
      );

      // Apple: S (user) vs A (comm) -> 0.5 points
      // Banana: A (user) vs A (comm) -> 1.0 points
      // Cherry: B (user) vs D (comm) -> 0 points
      // Total: 1.5 / 3 = 50%
      
      await waitFor(() => {
        expect(screen.getByText('50%')).toBeDefined();
      });
  });
});
