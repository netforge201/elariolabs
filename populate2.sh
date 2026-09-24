cat << 'INNER_EOF' > src/components/public/Header.tsx
import Link from 'next/link';
export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">ElarioLabs</Link>
        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/apps" className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors">Apps</Link>
          <Link href="/blog" className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors">Blog</Link>
          <Link href="/about" className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors">About</Link>
        </nav>
      </div>
    </header>
  );
}
INNER_EOF

cat << 'INNER_EOF' > src/components/public/Footer.tsx
import Link from 'next/link';
import { prisma } from '@/lib/db';
export default async function Footer() {
  const companyInfo = await prisma.companyInformation.findFirst();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-12 mt-20">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="font-semibold text-lg tracking-tight mb-4 inline-block">{companyInfo?.name || 'ElarioLabs'}</Link>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm">An independent software studio primarily focused on creating useful, polished, high-quality native applications.</p>
        </div>
        <div>
          <h3 className="font-medium mb-4">Products</h3>
          <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <li><Link href="/apps" className="hover:text-black dark:hover:text-white transition-colors">All Apps</Link></li>
            <li><Link href="/blog" className="hover:text-black dark:hover:text-white transition-colors">Blog</Link></li>
            <li><Link href="/about" className="hover:text-black dark:hover:text-white transition-colors">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium mb-4">Legal</h3>
          <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <li><Link href="/privacy" className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors">Terms of Use</Link></li>
            {companyInfo?.email && <li><a href={`mailto:${companyInfo.email}`} className="hover:text-black dark:hover:text-white transition-colors">Contact</a></li>}
          </ul>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-500 flex flex-col md:flex-row justify-between items-center">
        <p>© {year} {companyInfo?.copyrightText || companyInfo?.name || 'ElarioLabs'}. All rights reserved.</p>
      </div>
    </footer>
  );
}
INNER_EOF

cat << 'INNER_EOF' > src/components/admin/Header.tsx
'use client';
import { LogOut } from 'lucide-react';
import { useTransition } from 'react';
import { logoutAdmin } from '@/app/admin/actions';
export default function Header({ userEmail }: { userEmail: string }) {
  const [isPending, startTransition] = useTransition();
  const handleLogout = () => { startTransition(() => { logoutAdmin(); }); };
  return (
    <header className="h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0">
      <div className="md:hidden font-semibold">ElarioLabs</div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">{userEmail}</span>
        <button onClick={handleLogout} disabled={isPending} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
INNER_EOF

cat << 'INNER_EOF' > src/components/admin/Sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Smartphone, FileText, File, Image as ImageIcon, Settings, Building2, Share2 } from 'lucide-react';
import clsx from 'clsx';
const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Applications', href: '/admin/apps', icon: Smartphone },
  { name: 'Blog', href: '/admin/blog', icon: FileText },
  { name: 'Pages', href: '/admin/pages', icon: File },
  { name: 'Media Library', href: '/admin/media', icon: ImageIcon },
  { name: 'Company Info', href: '/admin/company', icon: Building2 },
  { name: 'Social Links', href: '/admin/social', icon: Share2 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];
export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/admin" className="font-semibold text-lg tracking-tight">ElarioLabs Studio</Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link href={item.href} className={clsx('flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors', isActive ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white')}>
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
INNER_EOF

cat << 'INNER_EOF' > src/components/admin/RichTextEditor.tsx
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
INNER_EOF

cat << 'INNER_EOF' > src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/storage';
import { getSession } from '@/lib/session';
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) { return NextResponse.json({ error: 'No file provided' }, { status: 400 }); }
    const result = await uploadFile(file);
    const mediaAsset = await prisma.mediaAsset.create({ data: { filename: result.filename, originalName: file.name, mimeType: result.mimeType, size: result.size, url: result.url, }, });
    return NextResponse.json(mediaAsset);
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
INNER_EOF

cat << 'INNER_EOF' > src/app/admin/actions.ts
'use server';
import { deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';
export async function logoutAdmin() {
  await deleteSession();
  redirect('/admin/login');
}
INNER_EOF

