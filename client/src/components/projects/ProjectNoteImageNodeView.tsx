import { useEffect, useRef, useState } from 'react';
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import { ExternalLink, MoreVertical, Trash2 } from 'lucide-react';
import { useProjectNotesImageActions } from './projectNotesImageContext';

function ProjectNoteImageNodeView({ node, deleteNode }: ReactNodeViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const imageActions = useProjectNotesImageActions();

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const src = node.attrs.src as string;
  const alt = (node.attrs.alt as string) || '';
  const attachmentId = (node.attrs.attachmentId as string | null | undefined) || null;

  return (
    <NodeViewWrapper className="project-note-image-node group/project-img relative my-3 w-full max-w-full">
      <div ref={rootRef} className="relative w-full">
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="project-note-inline-image block w-full max-w-full rounded-2xl border border-black/10 object-cover dark:border-white/10"
        />
        <div
          className={`absolute right-2 top-2 z-10 flex flex-col items-end gap-1 transition-opacity duration-200 ${
            menuOpen ? 'opacity-100' : 'opacity-0 group-hover/project-img:opacity-100'
          }`}
        >
          <button
            type="button"
            title="Opciones de imagen"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/70 dark:bg-black/60 dark:hover:bg-black/75"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen ? (
            <div className="project-note-img-menu min-w-[180px] overflow-hidden rounded-xl border border-black/10 bg-white py-1 text-sm dark:border-white/15 dark:bg-neutral-900">
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                onMouseDown={(e) => e.preventDefault()}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[var(--color-text)] transition hover:bg-black/5 dark:hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4 shrink-0 text-brand" />
                Abrir en nueva pestaña
              </a>
              <button
                type="button"
                disabled={deleting}
                onMouseDown={(e) => e.preventDefault()}
                onClick={async () => {
                  if (attachmentId && imageActions?.deleteAttachment) {
                    setDeleting(true);
                    try {
                      await imageActions.deleteAttachment(attachmentId);
                    } catch {
                      setDeleting(false);
                      return;
                    }
                    setDeleting(false);
                  }
                  deleteNode();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 transition hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                {deleting ? 'Eliminando…' : 'Quitar del texto'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const ProjectWorkspaceImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      attachmentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-attachment-id'),
        renderHTML: (attributes) => {
          if (!attributes.attachmentId) return {};
          return { 'data-attachment-id': attributes.attachmentId };
        }
      }
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ProjectNoteImageNodeView);
  }
}).configure({
  inline: false,
  allowBase64: false
});
