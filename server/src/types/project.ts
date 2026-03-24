export type ProjectStatus = 'draft' | 'in_progress' | 'completed';

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  repositoryUrl?: string | null;
  coverImage?: string | null;
  workspaceNotes?: string | null;
  status: ProjectStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectAttachment {
  id: string;
  projectId: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface ProjectPanelMember {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  isOwner: boolean;
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
