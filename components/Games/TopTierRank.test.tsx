import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopTierRank } from './TopTierRank';

describe('TopTierRank Component', () => {
  const mockProps = {
    surveyId: '123',
    gamifiedData: [
      {
        original_question: "Rank these fruits",
        games: {
          top_tier_rank: {
            applicable: true,
            concepts: ['Apple', 'Banana', 'Cherry'],
            derived_questions: ['Rank these fruits']
          },
          imposter_spyfall: {
            applicable: false,
            secret_word: '',
            derived_questions: []
          }
        }
      }
    ],
    onComplete: vi.fn(),
    onQuit: vi.fn(),
  };

  it('renders without crashing and does not trigger infinite loops', () => {
    render(<TopTierRank {...mockProps} />);
    
    expect(screen.getByText('Rank these fruits')).toBeDefined();
    expect(screen.getByText('Apple')).toBeDefined();
  });

  it('updates when data changes without infinite loops', () => {
    const { rerender } = render(<TopTierRank {...mockProps} />);
    
    const newProps = {
      ...mockProps,
      gamifiedData: [
        {
          original_question: "Rank these cars",
          games: {
            top_tier_rank: {
              applicable: true,
              concepts: ['Tesla', 'BMW'],
              derived_questions: ['Rank these cars']
            },
            imposter_spyfall: {
              applicable: false,
              secret_word: '',
              derived_questions: []
            }
          }
        }
      ]
    };

    rerender(<TopTierRank {...newProps} />);
    expect(screen.getByText('Rank these cars')).toBeDefined();
  });
});
