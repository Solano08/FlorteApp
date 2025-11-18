export type ProjectStatus = 'draft' | 'in_progress' | 'completed';

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  repositoryUrl?: string | null;
  status: ProjectStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  title: string;
  description?: string;
  repositoryUrl?: string;
  status?: ProjectStatus;
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>;
