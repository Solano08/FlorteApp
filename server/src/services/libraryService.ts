import { libraryRepository } from '../repositories/libraryRepository';
import { CreateResourceInput, LibraryResource } from '../types/library';
import { AppError } from '../utils/appError';

export const libraryService = {
  async createResource(input: CreateResourceInput): Promise<LibraryResource> {
    if (!input.title.trim()) {
      throw new AppError('El título es obligatorio', 400);
    }
    return await libraryRepository.createResource(input);
  },

  async listResources(): Promise<LibraryResource[]> {
    return await libraryRepository.listResources();
  },

  async searchResources(term: string): Promise<LibraryResource[]> {
    if (!term.trim()) {
      return await libraryRepository.listResources();
    }
    return await libraryRepository.searchResources(term);
  },

  async listByUser(userId: string): Promise<LibraryResource[]> {
    return await libraryRepository.listByUser(userId);
  }
};
