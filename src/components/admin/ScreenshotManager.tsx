'use client';
import { useState } from 'react';
import MediaSelector from './MediaSelector';
import { Trash, ArrowUp, ArrowDown } from 'lucide-react';

export default function ScreenshotManager({ initialScreenshots = [] }: { initialScreenshots?: any[] }) {
  const [screenshots, setScreenshots] = useState<any[]>(initialScreenshots);

  const addScreenshot = () => {
    setScreenshots([...screenshots, { id: 'temp_' + Date.now(), mediaAssetId: '', mediaAsset: null, order: screenshots.length }]);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newArr = [...screenshots];
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    setScreenshots(newArr);
  };

  const moveDown = (index: number) => {
    if (index === screenshots.length - 1) return;
    const newArr = [...screenshots];
    [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    setScreenshots(newArr);
  };

  const updateAssetId = (index: number, val: string) => {
    const newArr = [...screenshots];
    newArr[index].mediaAssetId = val;
    setScreenshots(newArr);
  };

  return (
    <div className="space-y-4">
      <input type="hidden" name="screenshotsData" value={JSON.stringify(screenshots.map((s, i) => ({ mediaAssetId: s.mediaAssetId, order: i })))} />
      
      {screenshots.map((s, i) => (
        <div key={s.id} className="flex gap-4 items-start p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex-1">
            <MediaSelector 
              name={`dummy_${s.id}`} 
              defaultValue={s.mediaAssetId} 
              defaultUrl={s.mediaAsset?.url}
              onChange={(id) => updateAssetId(i, id)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => moveUp(i)} disabled={i === 0} className="p-2 border rounded hover:bg-zinc-200 disabled:opacity-50"><ArrowUp className="w-4 h-4" /></button>
            <button type="button" onClick={() => moveDown(i)} disabled={i === screenshots.length - 1} className="p-2 border rounded hover:bg-zinc-200 disabled:opacity-50"><ArrowDown className="w-4 h-4" /></button>
            <button type="button" onClick={() => removeScreenshot(i)} className="p-2 border rounded hover:bg-red-50 text-red-600"><Trash className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addScreenshot} className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900">
        + Add Screenshot
      </button>
    </div>
  );
}
