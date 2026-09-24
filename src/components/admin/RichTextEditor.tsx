'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Quote } from 'lucide-react';
export default function RichTextEditor({ content, onChange }: { content: string, onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => { onChange(editor.getHTML()); },
    editorProps: { attributes: { class: 'prose prose-zinc dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none', }, },
  });
  if (!editor) return null;
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden bg-white dark:bg-zinc-950">
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 dark:border-zinc-700 p-2 bg-zinc-50 dark:bg-zinc-900">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('bold') ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}><Bold className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('italic') ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}><Italic className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('bulletList') ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}><List className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('orderedList') ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}><ListOrdered className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('blockquote') ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}><Quote className="w-4 h-4" /></button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
