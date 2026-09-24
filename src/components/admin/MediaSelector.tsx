'use client';

import { useState, useEffect } from 'react';
import { ImageIcon, X } from 'lucide-react';

export default function MediaSelector({ 
  name, 
  defaultValue, 
  defaultUrl,
  onChange
}: { 
  name: string; 
  defaultValue?: string; 
  defaultUrl?: string;
  onChange?: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>(defaultValue || '');
  const [previewUrl, setPreviewUrl] = useState<string>(defaultUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  const fetchAssets = async () => {
    const res = await fetch('/api/media');
    if (res.ok) {
      const data = await res.json();
      setAssets(data);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAssets();
  }, [isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const asset = await res.json();
        setAssets([asset, ...assets]);
        selectAsset(asset);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const selectAsset = (asset: any) => {
    setSelectedId(asset.id);
    setPreviewUrl(asset.url);
    if (onChange) onChange(asset.id);
    setIsOpen(false);
  };

  const clearSelection = () => {
    setSelectedId('');
    setPreviewUrl('');
    if (onChange) onChange('');
  }

  return (
    <div>
      <input type="hidden" name={name} value={selectedId} />
      
      {previewUrl ? (
        <div className="relative w-full max-w-sm aspect-video rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 mb-2">
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          <button 
            type="button" 
            onClick={clearSelection}
            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button 
          type="button" 
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center justify-center w-full max-w-sm aspect-video rounded-md border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors mb-2"
        >
          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-sm font-medium">Select Media</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-semibold">Select Media</h3>
              <button type="button" onClick={() => setIsOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleUpload} 
                disabled={isUploading}
                className="text-sm"
              />
              {isUploading && <span className="text-sm text-zinc-500 ml-4">Uploading...</span>}
            </div>
            <div className="p-4 overflow-y-auto grid grid-cols-3 md:grid-cols-5 gap-4">
              {assets.map(a => (
                <div 
                  key={a.id} 
                  onClick={() => selectAsset(a)}
                  className="aspect-square bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-blue-500 relative"
                >
                  <img src={a.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
