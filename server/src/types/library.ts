export type ResourceType = 'document' | 'video' | 'link' | 'course' | 'other';

export interface LibraryResource {
  id: string;
  title: string;
  description?: string | null;
  resourceType: ResourceType;
  url?: string | null;
  uploadedBy: string;
  tags?: string[] | null;
  createdAt: Date;
}

export interface CreateResourceInput {
  title: string;
  description?: string;
  resourceType: ResourceType;
  url?: string;
  uploadedBy: string;
  tags?: string[];
}
