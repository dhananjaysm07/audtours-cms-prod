// components/bulk-import-dialog.tsx
import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useContentStore } from '@/store/useContentStore';
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  FileImage,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Only audio files are accepted — no allowedTypes prop needed.
const AUDIO_MIME_PREFIX = 'audio';
const AUDIO_ACCEPT = 'audio/*';

interface BulkImportDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface FileRow {
  id: string; // local uuid for keying
  file: File;
  name: string;
  position: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const getFileIcon = (file: File) => {
  if (file.type.startsWith('audio'))
    return <FileAudio size={16} className="text-purple-500 shrink-0" />;
  if (file.type.startsWith('image'))
    return <FileImage size={16} className="text-indigo-500 shrink-0" />;
  return <FileText size={16} className="text-gray-500 shrink-0" />;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const BulkImportDialog = ({
  isOpen,
  setIsOpen,
}: BulkImportDialogProps) => {
  const [rows, setRows] = useState<FileRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, currentPath } = useContentStore();

  const currentNodeId = currentPath[currentPath.length - 1].id;
  const repoId = currentNodeId.split(':')[1];

  const isTypeAllowed = (file: File) => file.type.startsWith(AUDIO_MIME_PREFIX);

  const addFiles = useCallback((files: File[]) => {
    const valid = files.filter(isTypeAllowed);
    const rejected = files.length - valid.length;
    if (rejected > 0)
      toast.error(`${rejected} file(s) skipped — unsupported type`);

    setRows(prev => {
      const existingNames = new Set(prev.map(r => r.file.name));
      const newRows: FileRow[] = valid
        .filter(f => !existingNames.has(f.name))
        .map(file => ({
          id: `${file.name}-${file.size}-${Math.random()}`,
          file,
          name: file.name.replace(/\.[^/.]+$/, ''), // strip extension for default name
          position: '',
          status: 'pending',
        }));
      return [...prev, ...newRows];
    });
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    addFiles(files);
    // reset input so same files can be re-added after removal
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeRow = (id: string) =>
    setRows(prev => prev.filter(r => r.id !== id));

  const updateRow = (id: string, field: 'name' | 'position', value: string) =>
    setRows(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r)),
    );

  const handleUploadAll = async () => {
    const pending = rows.filter(r => r.status === 'pending');
    if (!pending.length) return;

    setIsUploading(true);
    setUploadProgress(0);

    let done = 0;

    for (const row of pending) {
      // mark as uploading
      setRows(prev =>
        prev.map(r => (r.id === row.id ? { ...r, status: 'uploading' } : r)),
      );

      try {
        await uploadFile({
          file: row.file,
          name: row.name || row.file.name,
          position: row.position ? parseInt(row.position) : null,
          repoId,
          force_position: false,
        });

        setRows(prev =>
          prev.map(r => (r.id === row.id ? { ...r, status: 'success' } : r)),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setRows(prev =>
          prev.map(r =>
            r.id === row.id ? { ...r, status: 'error', errorMessage: msg } : r,
          ),
        );
      }

      done++;
      setUploadProgress(Math.round((done / pending.length) * 100));
    }

    setIsUploading(false);

    const failed = rows.filter(
      r =>
        r.status === 'error' ||
        pending.find(p => p.id === r.id && r.status === 'error'),
    ).length;

    if (failed === 0) {
      toast.success(`${pending.length} file(s) uploaded successfully`);
    } else {
      toast.warning(`${pending.length - failed} uploaded, ${failed} failed`);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setRows([]);
    setUploadProgress(0);
    setIsOpen(false);
  };

  const allDone =
    rows.length > 0 &&
    rows.every(r => r.status === 'success' || r.status === 'error');
  const pendingCount = rows.filter(r => r.status === 'pending').length;
  const successCount = rows.filter(r => r.status === 'success').length;
  const errorCount = rows.filter(r => r.status === 'error').length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload size={18} />
            Bulk Import
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Drop zone */}
          {!isUploading && (
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50',
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload
                size={28}
                className={cn(
                  'mx-auto mb-2',
                  isDragging ? 'text-blue-500' : 'text-neutral-400',
                )}
              />
              <p className="text-sm font-medium text-neutral-700">
                {isDragging ? 'Drop files here' : 'Click or drag files here'}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Accepts: audio files only (mp3, wav, aac, flac…)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={AUDIO_ACCEPT}
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>
          )}

          {/* File table */}
          {rows.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-neutral-600 w-8"></th>
                    <th className="text-left px-3 py-2 font-medium text-neutral-600">
                      File
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-neutral-600 w-48">
                      Display Name
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-neutral-600 w-28">
                      Position
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-neutral-600 w-24">
                      Status
                    </th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.map(row => (
                    <tr
                      key={row.id}
                      className={cn(
                        'transition-colors',
                        row.status === 'success' && 'bg-green-50',
                        row.status === 'error' && 'bg-red-50',
                        row.status === 'uploading' && 'bg-blue-50',
                      )}
                    >
                      {/* File icon */}
                      <td className="px-3 py-2">{getFileIcon(row.file)}</td>

                      {/* Original filename + size */}
                      <td className="px-3 py-2">
                        <span
                          className="truncate max-w-[160px] block text-neutral-700"
                          title={row.file.name}
                        >
                          {row.file.name}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {formatBytes(row.file.size)}
                        </span>
                        {row.status === 'error' && row.errorMessage && (
                          <span className="text-xs text-red-500 block truncate max-w-[160px]">
                            {row.errorMessage}
                          </span>
                        )}
                      </td>

                      {/* Display name input */}
                      <td className="px-3 py-2">
                        <Input
                          value={row.name}
                          onChange={e =>
                            updateRow(row.id, 'name', e.target.value)
                          }
                          disabled={
                            row.status === 'uploading' ||
                            row.status === 'success'
                          }
                          className="h-7 text-sm px-2"
                          placeholder="Enter name"
                        />
                      </td>

                      {/* Position input */}
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={row.position}
                          onChange={e =>
                            updateRow(row.id, 'position', e.target.value)
                          }
                          disabled={
                            row.status === 'uploading' ||
                            row.status === 'success'
                          }
                          className="h-7 text-sm px-2"
                          placeholder="Optional"
                        />
                      </td>

                      {/* Status badge */}
                      <td className="px-3 py-2">
                        {row.status === 'pending' && (
                          <span className="text-xs text-neutral-400">
                            Pending
                          </span>
                        )}
                        {row.status === 'uploading' && (
                          <span className="flex items-center gap-1 text-xs text-blue-600">
                            <Loader2 size={12} className="animate-spin" />
                            Uploading
                          </span>
                        )}
                        {row.status === 'success' && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 size={12} />
                            Done
                          </span>
                        )}
                        {row.status === 'error' && (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle size={12} />
                            Failed
                          </span>
                        )}
                      </td>

                      {/* Remove button */}
                      <td className="pr-2">
                        <button
                          onClick={() => removeRow(row.id)}
                          disabled={row.status === 'uploading' || isUploading}
                          className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Progress bar */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          )}

          {/* Summary when done */}
          {allDone && !isUploading && (
            <div className="flex items-center gap-3 text-sm rounded-lg border px-4 py-3 bg-neutral-50">
              {errorCount === 0 ? (
                <>
                  <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                  <span className="text-green-700 font-medium">
                    All {successCount} file(s) uploaded successfully
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-orange-500 shrink-0" />
                  <span className="text-orange-700">
                    {successCount} uploaded · {errorCount} failed
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between gap-3">
          <span className="text-xs text-neutral-400">
            {rows.length > 0
              ? `${rows.length} file(s) · ${pendingCount} pending`
              : 'No files selected'}
          </span>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isUploading}
            >
              {allDone ? 'Close' : 'Cancel'}
            </Button>

            {!allDone && (
              <Button
                size="sm"
                onClick={handleUploadAll}
                disabled={pendingCount === 0 || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload size={14} className="mr-1" />
                    Upload {pendingCount > 0 ? `(${pendingCount})` : ''}
                  </>
                )}
              </Button>
            )}

            {/* Retry failed */}
            {errorCount > 0 && !isUploading && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setRows(prev =>
                    prev.map(r =>
                      r.status === 'error'
                        ? { ...r, status: 'pending', errorMessage: undefined }
                        : r,
                    ),
                  );
                }}
              >
                Retry Failed ({errorCount})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
