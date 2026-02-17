import { apiClient } from './client';
import { ExampleTemplate } from '@/types';

export const examplesApi = {
  // Get example agent templates
  list: async (): Promise<ExampleTemplate[]> => {
    return apiClient.get('/agents/examples');
  },

  // Get example by ID
  get: async (id: string): Promise<ExampleTemplate> => {
    const examples = await examplesApi.list();
    const example = examples.find((e) => e.id === id);
    if (!example) {
      throw new Error('Example not found');
    }
    return example;
  },
};
