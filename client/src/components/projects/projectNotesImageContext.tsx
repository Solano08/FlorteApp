import { createContext, useContext, type ReactNode } from 'react';

export type ProjectNotesImageActions = {
  deleteAttachment: (attachmentId: string) => Promise<void>;
};

const ProjectNotesImageActionsContext = createContext<ProjectNotesImageActions | undefined>(undefined);

export function ProjectNotesImageActionsProvider({
  value,
  children
}: {
  value: ProjectNotesImageActions | undefined;
  children: ReactNode;
}) {
  return (
    <ProjectNotesImageActionsContext.Provider value={value}>{children}</ProjectNotesImageActionsContext.Provider>
  );
}

export function useProjectNotesImageActions() {
  return useContext(ProjectNotesImageActionsContext);
}

export type WorkspaceImageUploadResult = { src: string; attachmentId?: string };
