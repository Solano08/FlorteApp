export type ProjectStatus = 'draft' | 'in_progress' | 'completed';

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  repositoryUrl?: string | null;
  status: ProjectStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  repositoryUrl?: string;
  status?: ProjectStatus;
  ownerId: string;
}

export interface UpdateProjectInput {
  projectId: string;
  title?: string;
  description?: string | null;
  repositoryUrl?: string | null;
  status?: ProjectStatus;
}
