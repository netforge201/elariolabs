'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
export default function MediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData, });
      if (res.ok) { router.refresh(); } else { const data = await res.json(); alert(data.error || 'Upload failed'); }
    } catch (err) { alert('Upload failed'); } finally { setIsUploading(false); e.target.value = ''; }
  };
  return (
    <div className="relative">
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
      <div className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 pointer-events-none">
        <Upload className="w-4 h-4" /> {isUploading ? 'Uploading...' : 'Upload Media'}
      </div>
    </div>
  );
}
