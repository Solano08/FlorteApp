import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { ProjectWorkspaceImage } from './ProjectNoteImageNodeView';
import {
  ProjectNotesImageActionsProvider,
  type ProjectNotesImageActions,
  type WorkspaceImageUploadResult
} from './projectNotesImageContext';
import DOMPurify from 'dompurify';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link2,
  Image as ImageIcon,
  Smile,
  Trash2,
  ChevronDown,
  Strikethrough,
  Code,
  Minus
} from 'lucide-react';
import { Button } from '../ui/Button';
import { EmojiPicker } from '../ui/EmojiPicker';

const MAX_HTML_LENGTH = 50_000;

const FONT_OPTIONS = [
  { label: 'Sans Serif', value: 'ui-sans-serif, system-ui, sans-serif' },
  { label: 'Serif', value: 'ui-serif, Georgia, serif' },
  { label: 'Monospace', value: 'ui-monospace, monospace' }
];

const HEADING_OPTIONS = [
  { label: 'Párrafo', value: 'paragraph' },
  { label: 'Título grande', value: 'h1' },
  { label: 'Título', value: 'h2' },
  { label: 'Subtítulo', value: 'h3' }
];

export function isEmptyWorkspaceNotesHtml(html: string): boolean {
  if (typeof document === 'undefined') return !html.trim();
  const d = document.createElement('div');
  d.innerHTML = html;
  if (d.querySelector('img')) return false;
  return (d.textContent || '').trim() === '';
}

/** Compara dos HTML de notas como equivalentes al guardar (espacios / vacíos). */
export function notesHtmlEquivalentForSave(a: string | null | undefined, b: string | null | undefined): boolean {
  if (isEmptyWorkspaceNotesHtml(a ?? '') && isEmptyWorkspaceNotesHtml(b ?? '')) return true;
  const norm = (s: string) =>
    s
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  return norm(a ?? '') === norm(b ?? '');
}

export function notesRawToHtml(raw: string | null | undefined): string {
  const s = (raw ?? '').trim();
  if (!s) return '<p></p>';
  if (/^\s*</.test(s)) return s;
  const esc = s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<p>${esc.replace(/\n/g, '</p><p>')}</p>`;
}

function toolbarBtnClass(active?: boolean) {
  return `flex h-8 min-w-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
    active
      ? 'border-brand/50 bg-brand/15 text-brand'
      : 'border-transparent bg-white/60 text-[var(--color-text)] hover:bg-white/90 dark:bg-white/10 dark:hover:bg-white/15'
  }`;
}

function selectClass() {
  return 'h-8 max-w-[140px] cursor-pointer rounded-lg border border-black/10 bg-white/80 px-2 text-xs text-[var(--color-text)] dark:border-white/15 dark:bg-white/10';
}

type Props = {
  initialContent: string;
  onHtmlChange: (html: string) => void;
  onSave: () => void;
  saving: boolean;
  /** Sube la imagen al proyecto; `attachmentId` permite borrar el adjunto al quitar la imagen del texto. */
  onUploadImage: (file: File) => Promise<WorkspaceImageUploadResult>;
  uploadPending: boolean;
  /** Si existe, al quitar una imagen con `attachmentId` se elimina también el adjunto en servidor. */
  onDeleteImageAttachment?: ProjectNotesImageActions['deleteAttachment'];
};

export function ProjectWorkspaceNotesEditor({
  initialContent,
  onHtmlChange,
  onSave,
  saving,
  onUploadImage,
  uploadPending,
  onDeleteImageAttachment
}: Props) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  /** Fila de formato: aparece al enfocar el editor; el botón Aa la muestra u oculta. */
  const [showFormatRow, setShowFormatRow] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          bulletList: { HTMLAttributes: { class: 'list-disc pl-5 my-1' } },
          orderedList: { HTMLAttributes: { class: 'list-decimal pl-5 my-1' } }
        }),
        Underline,
        TextStyle,
        Color,
        FontFamily.configure({ types: ['textStyle'] }),
        TextAlign.configure({
          types: ['heading', 'paragraph']
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: 'text-brand underline underline-offset-2' }
        }),
        ProjectWorkspaceImage,
        Placeholder.configure({
          placeholder: 'Escribe notas del proyecto, avances y decisiones…'
        })
      ],
      content: notesRawToHtml(initialContent),
      shouldRerenderOnTransaction: true,
      editorProps: {
        attributes: {
          class:
            'prose-project-notes min-h-[168px] max-h-[min(55vh,420px)] overflow-y-auto px-3 py-3 text-sm text-[var(--color-text)] focus:outline-none'
        }
      },
      onUpdate: ({ editor: ed }) => {
        const html = ed.getHTML();
        if (html.length <= MAX_HTML_LENGTH) onHtmlChange(html);
      },
      onFocus: () => setShowFormatRow(true),
    },
    []
  );

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    queueMicrotask(() => onHtmlChange(editor.getHTML()));
  }, [editor, onHtmlChange]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const canUndo = useEditorState({
    editor,
    selector: (s) => s.editor.can().undo()
  });
  const canRedo = useEditorState({
    editor,
    selector: (s) => s.editor.can().redo()
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enlace (URL)', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const onColorPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      editor?.chain().focus().setColor(v).run();
    },
    [editor]
  );

  const onImageFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !file.type.startsWith('image/') || !editor) return;
      try {
        const { src, attachmentId } = await onUploadImage(file);
        editor
          .chain()
          .focus()
          .setImage({
            src,
            alt: file.name,
            ...(attachmentId ? { attachmentId } : {})
          })
          .run();
      } catch {
        // Error de red o permisos: el usuario puede reintentar
      }
    },
    [editor, onUploadImage]
  );

  const discardDraft = useCallback(() => {
    if (!editor) return;
    if (!window.confirm('¿Vaciar todas las notas de este borrador?')) return;
    editor.commands.clearContent(true);
    onHtmlChange(editor.getHTML());
  }, [editor, onHtmlChange]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      editor?.chain().focus().insertContent(emoji).run();
      setEmojiOpen(false);
    },
    [editor]
  );

  if (!editor) return null;

  const imageActions: ProjectNotesImageActions | undefined = onDeleteImageAttachment
    ? { deleteAttachment: onDeleteImageAttachment }
    : undefined;

  return (
    <ProjectNotesImageActionsProvider value={imageActions}>
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-neutral-100/80 dark:border-white/12 dark:bg-white/5">
      <input ref={colorInputRef} type="color" className="sr-only" onChange={onColorPick} aria-hidden />

      <input ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={onImageFileChange} />

      <div data-project-notes-toolbar="true">
        {showFormatRow ? (
          <div className="flex flex-wrap items-center gap-1 border-b border-black/10 p-2 dark:border-white/10">
            <button
              type="button"
              title="Deshacer"
              onMouseDown={(e) => e.preventDefault()}
              disabled={!canUndo}
              onClick={() => editor.chain().focus().undo().run()}
              className={toolbarBtnClass(false)}
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Rehacer"
              onMouseDown={(e) => e.preventDefault()}
              disabled={!canRedo}
              onClick={() => editor.chain().focus().redo().run()}
              className={toolbarBtnClass(false)}
            >
              <Redo2 className="h-4 w-4" />
            </button>

            <span className="mx-1 h-6 w-px bg-black/10 dark:bg-white/15" />

            <select
              className={selectClass()}
              onMouseDown={(e) => e.preventDefault()}
              value={
                editor.isActive('heading', { level: 1 })
                  ? 'h1'
                  : editor.isActive('heading', { level: 2 })
                    ? 'h2'
                    : editor.isActive('heading', { level: 3 })
                      ? 'h3'
                      : 'paragraph'
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'paragraph') editor.chain().focus().setParagraph().run();
                if (v === 'h1') editor.chain().focus().setHeading({ level: 1 }).run();
                if (v === 'h2') editor.chain().focus().setHeading({ level: 2 }).run();
                if (v === 'h3') editor.chain().focus().setHeading({ level: 3 }).run();
              }}
            >
              {HEADING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              className={selectClass()}
              style={{ maxWidth: 120 }}
              onMouseDown={(e) => e.preventDefault()}
              value={(editor.getAttributes('textStyle').fontFamily as string) || FONT_OPTIONS[0].value}
              onChange={(e) => {
                const v = e.target.value;
                if (v) editor.chain().focus().setFontFamily(v).run();
              }}
            >
              {FONT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <span className="mx-1 h-6 w-px bg-black/10 dark:bg-white/15" />

            <button
              type="button"
              title="Negrita"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={toolbarBtnClass(editor.isActive('bold'))}
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Cursiva"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={toolbarBtnClass(editor.isActive('italic'))}
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Subrayado"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={toolbarBtnClass(editor.isActive('underline'))}
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Color de texto"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => colorInputRef.current?.click()}
              className={toolbarBtnClass(!!editor.getAttributes('textStyle').color)}
            >
              <span className="text-sm font-bold underline decoration-2">A</span>
            </button>

            <span className="mx-1 h-6 w-px bg-black/10 dark:bg-white/15" />

            <select
              className={selectClass()}
              onMouseDown={(e) => e.preventDefault()}
              value={
                editor.isActive({ textAlign: 'center' })
                  ? 'center'
                  : editor.isActive({ textAlign: 'right' })
                    ? 'right'
                    : editor.isActive({ textAlign: 'justify' })
                      ? 'justify'
                      : 'left'
              }
              onChange={(e) => {
                const v = e.target.value as 'left' | 'center' | 'right' | 'justify';
                editor.chain().focus().setTextAlign(v).run();
              }}
            >
              <option value="left">Alinear izq.</option>
              <option value="center">Centrar</option>
              <option value="right">Alinear der.</option>
              <option value="justify">Justificar</option>
            </select>

            <select
              className={selectClass()}
              onMouseDown={(e) => e.preventDefault()}
              value={editor.isActive('orderedList') ? 'ordered' : editor.isActive('bulletList') ? 'bullet' : 'none'}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'bullet') editor.chain().focus().toggleBulletList().run();
                if (v === 'ordered') editor.chain().focus().toggleOrderedList().run();
                if (v === 'none') {
                  if (editor.isActive('bulletList')) editor.chain().focus().toggleBulletList().run();
                  else if (editor.isActive('orderedList')) editor.chain().focus().toggleOrderedList().run();
                }
              }}
            >
              <option value="none">Sin lista</option>
              <option value="bullet">Lista •</option>
              <option value="ordered">Lista 1.</option>
            </select>

            <div className="relative" ref={moreRef}>
              <button
                type="button"
                title="Más"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setMoreOpen((o) => !o)}
                className={toolbarBtnClass(moreOpen)}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              {moreOpen ? (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-black/10 bg-white py-1 shadow-lg dark:border-white/15 dark:bg-neutral-900">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor.chain().focus().toggleStrike().run();
                      setMoreOpen(false);
                    }}
                  >
                    <Strikethrough className="h-3.5 w-3.5" /> Tachado
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor.chain().focus().toggleCode().run();
                      setMoreOpen(false);
                    }}
                  >
                    <Code className="h-3.5 w-3.5" /> Código
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor.chain().focus().setHorizontalRule().run();
                      setMoreOpen(false);
                    }}
                  >
                    <Minus className="h-3.5 w-3.5" /> Línea horizontal
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="border-b border-black/10 bg-white/70 px-2 py-2 dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-full bg-[#1a73e8] px-5 text-white shadow-sm hover:bg-[#1557b0]"
              loading={saving}
              disabled={saving}
              onMouseDown={(e) => e.preventDefault()}
              onClick={onSave}
            >
              Guardar notas
            </Button>

            <button
              type="button"
              title={showFormatRow ? 'Ocultar formato' : 'Mostrar formato'}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowFormatRow((s) => !s)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1a73e8]/30 bg-[#1a73e8]/10 text-sm font-semibold text-[#1a73e8]"
            >
              Aa
            </button>

            <span className="mx-1 h-6 w-px bg-black/10 dark:bg-white/15" />

            <button
              type="button"
              title="Insertar enlace"
              onMouseDown={(e) => e.preventDefault()}
              onClick={setLink}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Link2 className="h-5 w-5" />
            </button>
            <div className="relative">
              <button
                type="button"
                title="Emoji"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setEmojiOpen((o) => !o)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-black/5 dark:hover:bg-white/10"
              >
                <Smile className="h-5 w-5" />
              </button>
              {emojiOpen ? (
                <div className="absolute left-0 top-full z-30 mt-2 w-[min(100vw-2rem,320px)] rounded-2xl border border-black/10 bg-white p-2 shadow-xl dark:border-white/15 dark:bg-neutral-900">
                  <EmojiPicker onEmojiSelect={insertEmoji} onClose={() => setEmojiOpen(false)} compactBounds />
                </div>
              ) : null}
            </div>
            <button
              type="button"
              title="Insertar foto en el texto (estilo publicación)"
              disabled={uploadPending}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => imageFileRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ImageIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              title="Vaciar notas"
              onMouseDown={(e) => e.preventDefault()}
              onClick={discardDraft}
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <EditorContent editor={editor} className="bg-white dark:bg-neutral-950/40" />
    </div>
    </ProjectNotesImageActionsProvider>
  );
}

type ReadonlyProps = { html: string | null | undefined };

export function ProjectWorkspaceNotesReadonly({ html }: ReadonlyProps) {
  const trimmed = html?.trim() ?? '';
  if (!trimmed) {
    return (
      <p className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-[var(--color-muted)] dark:border-white/10">
        El dueño aún no ha dejado notas en este proyecto.
      </p>
    );
  }

  if (!/^\s*</.test(trimmed)) {
    return (
      <p className="whitespace-pre-line rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-[var(--color-text)] dark:border-white/10">
        {trimmed}
      </p>
    );
  }

  const clean = DOMPurify.sanitize(trimmed, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['img'],
    ADD_ATTR: ['src', 'alt', 'class', 'data-attachment-id']
  });
  return (
    <div
      className="prose-project-notes-readonly rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-[var(--color-text)] dark:border-white/10"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
