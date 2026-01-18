import { describe, it, expect, vi, Mock } from 'vitest';
import { StorageService } from './storageService';
import { client } from './apiClient';

// Mock the api client
vi.mock('./apiClient', () => ({
  client: {
    api: {
      surveys: {
        $get: vi.fn(),
        ':id': {
          $get: vi.fn(),
        }
      },
      responses: {
        $get: vi.fn(),
        $post: vi.fn(),
      },
    },
  },
}));

describe('StorageService', () => {
  it('should fetch surveys successfully', async () => {
    const mockSurveys = [{ id: '1', title: 'Test Survey', questions: [] }];
    (client.api.surveys.$get as Mock).mockResolvedValue({ 
      ok: true,
      json: () => Promise.resolve(mockSurveys) 
    });

    const result = await StorageService.getSurveys();
    
    expect(result).toEqual(mockSurveys);
    expect(client.api.surveys.$get).toHaveBeenCalled();
  });

  it('should return empty array on error', async () => {
    (client.api.surveys.$get as Mock).mockResolvedValue({ 
      ok: false 
    });

    const result = await StorageService.getSurveys();
    
    expect(result).toEqual([]);
  });
});
