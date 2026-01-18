import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopTierRank } from './TopTierRank';

describe('TopTierRank Component', () => {
  const mockProps = {
    surveyId: '123',
    questions: [
      {
        id: 'q1',
        surveyId: '123',
        text: 'Rank these fruits',
        type: 'RANKING' as const,
        options: ['Apple', 'Banana', 'Cherry'],
        assignedGame: 'TOP_TIER' as const,
      }
    ],
    onComplete: vi.fn(),
    onQuit: vi.fn(),
  };

  it('renders without crashing and does not trigger infinite loops', () => {
    // If there is an infinite loop, this test will timeout or throw "Maximum update depth exceeded"
    render(<TopTierRank {...mockProps} />);
    
    expect(screen.getByText('Rank these fruits')).toBeDefined();
    expect(screen.getByText('Apple')).toBeDefined();
  });

  it('updates when questions change without infinite loops', () => {
    const { rerender } = render(<TopTierRank {...mockProps} />);
    
    const newProps = {
      ...mockProps,
      questions: [
        {
          ...mockProps.questions[0],
          text: 'Rank these cars',
          options: ['Tesla', 'BMW'],
        }
      ]
    };

    rerender(<TopTierRank {...newProps} />);
    expect(screen.getByText('Rank these cars')).toBeDefined();
  });
});
