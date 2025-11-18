import { apiClient } from './apiClient';
import { CreateResourcePayload, LibraryResource } from '../types/library';

export const libraryService = {
  async listResources(): Promise<LibraryResource[]> {
    const { data } = await apiClient.get<{ success: boolean; resources: LibraryResource[] }>('/library');
    return data.resources;
  },

  async searchResources(term: string): Promise<LibraryResource[]> {
    const { data } = await apiClient.get<{ success: boolean; resources: LibraryResource[] }>('/library/search', {
      params: { q: term }
    });
    return data.resources;
  },

  async listMyResources(): Promise<LibraryResource[]> {
    const { data } = await apiClient.get<{ success: boolean; resources: LibraryResource[] }>('/library/me');
    return data.resources;
  },

  async createResource(payload: CreateResourcePayload): Promise<LibraryResource> {
    const { data } = await apiClient.post<{ success: boolean; resource: LibraryResource }>('/library', payload);
    return data.resource;
  }
};
