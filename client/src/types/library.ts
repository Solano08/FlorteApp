export type ResourceType = 'document' | 'video' | 'link' | 'course' | 'other';

export interface LibraryResource {
  id: string;
  title: string;
  description?: string | null;
  resourceType: ResourceType;
  url?: string | null;
  uploadedBy: string;
  tags?: string[] | null;
  createdAt: string;
}

export interface CreateResourcePayload {
  title: string;
  description?: string;
  resourceType: ResourceType;
  url?: string;
  tags?: string[];
}
