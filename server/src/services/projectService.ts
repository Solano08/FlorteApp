import { projectRepository } from '../repositories/projectRepository';
import { userRepository } from '../repositories/userRepository';
import { uploadBuffer } from './cloudinaryService';
import { AppError } from '../utils/appError';
import {
  CreateProjectInput,
  Project,
  ProjectAttachment,
  ProjectPanelMember,
  UpdateProjectInput
} from '../types/project';

async function assertProjectMember(actorId: string, project: Project): Promise<void> {
  if (project.ownerId === actorId) return;
  const members = await projectRepository.listMembers(project.id);
  if (!members.some((m) => m.userId === actorId)) {
    throw new AppError('No tienes acceso a este proyecto', 403);
  }
}

export const projectService = {
  async createProject(input: CreateProjectInput): Promise<Project> {
    if (!input.title.trim()) {
      throw new AppError('El título del proyecto es obligatorio', 400);
    }
    return await projectRepository.createProject(input);
  },

  async listProjects(): Promise<Project[]> {
    return await projectRepository.listProjects();
  },

  async listByUser(userId: string): Promise<Project[]> {
    return await projectRepository.listByMember(userId);
  },

  async updateProject(actorId: string, input: UpdateProjectInput): Promise<Project> {
    const project = await projectRepository.findById(input.projectId);
    if (!project) {
      throw new AppError('Proyecto no encontrado', 404);
    }
    if (project.ownerId !== actorId) {
      throw new AppError('No tienes permisos para actualizar este proyecto', 403);
    }
    return await projectRepository.updateProject(input);
  },


  async deleteProject(actorId: string, projectId: string): Promise<void> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError('Proyecto no encontrado', 404);
    }
    if (project.ownerId !== actorId) {
      throw new AppError('No tienes permisos para eliminar este proyecto', 403);
    }
    await projectRepository.deleteProject(projectId);
  },

  async updateProjectCover(actorId: string, projectId: string, coverUrl: string): Promise<Project> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError('Proyecto no encontrado', 404);
    }
    if (project.ownerId !== actorId) {
      throw new AppError('No tienes permisos para actualizar este proyecto', 403);
    }
    return await projectRepository.updateCover(projectId, coverUrl);
  },

  async getProjectPanel(actorId: string, projectId: string): Promise<{
    project: Project;
    members: ProjectPanelMember[];
    attachments: ProjectAttachment[];
  }> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError('Proyecto no encontrado', 404);
    }
    let memberRows = await projectRepository.listMembers(projectId);
    const isMember =
      project.ownerId === actorId || memberRows.some((m) => m.userId === actorId);
    if (!isMember) {
      throw new AppError('No tienes acceso a este proyecto', 403);
    }
    if (!memberRows.some((m) => m.userId === project.ownerId)) {
      memberRows = [{ userId: project.ownerId, role: 'lead' }, ...memberRows];
    }
    const userIds = [...new Set(memberRows.map((m) => m.userId))];
    const profiles = await userRepository.findBasicByIds(userIds);
    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const members: ProjectPanelMember[] = memberRows.map((m) => {
      const prof = profileMap.get(m.userId);
      const firstName = prof?.firstName ?? 'Usuario';
      const lastName = prof?.lastName ?? '';
      return {
        userId: m.userId,
        role: m.role,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        avatarUrl: prof?.avatarUrl ?? null,
        isOwner: m.userId === project.ownerId
      };
    });
    const attachments = await projectRepository.listAttachments(projectId);
    return { project, members, attachments };
  },

  async updateWorkspaceNotes(actorId: string, projectId: string, notes: string | null): Promise<Project> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError('Proyecto no encontrado', 404);
    }
    await assertProjectMember(actorId, project);
    if (project.ownerId !== actorId) {
      throw new AppError('Solo el dueño puede editar el espacio de trabajo', 403);
    }
    return await projectRepository.updateWorkspaceNotes(projectId, notes);
  },

  async addProjectAttachment(
    actorId: string,
    projectId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string }
  ): Promise<ProjectAttachment> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError('Proyecto no encontrado', 404);
    }
    await assertProjectMember(actorId, project);
    if (project.ownerId !== actorId) {
      throw new AppError('Solo el dueño puede subir archivos', 403);
    }
    const fileUrl = await uploadBuffer(file.buffer, 'projects/workspace', {
      mimetype: file.mimetype,
      filename: file.originalname
    });
    return await projectRepository.insertAttachment({
      projectId,
      fileUrl,
      fileName: file.originalname,
      mimeType: file.mimetype,
      uploadedBy: actorId
    });
  },

  async deleteProjectAttachment(actorId: string, projectId: string, attachmentId: string): Promise<void> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError('Proyecto no encontrado', 404);
    }
    await assertProjectMember(actorId, project);
    if (project.ownerId !== actorId) {
      throw new AppError('Solo el dueño puede eliminar archivos', 403);
    }
    const ok = await projectRepository.deleteAttachment(projectId, attachmentId);
    if (!ok) {
      throw new AppError('Archivo no encontrado', 404);
    }
  }
};
