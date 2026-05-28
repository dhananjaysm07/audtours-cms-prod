// components/bulk-import-dialog.tsx
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContentStore } from '@/store/useContentStore';
import { contentApi } from '@/lib/api';
import type { Repository, Node } from '@/types';
import { REPOSITORY_KINDS, FOLDER_ITEM_TYPE } from '@/types';
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const AUDIO_MIME_PREFIX = 'audio';
const AUDIO_ACCEPT = 'audio/*';

export interface BulkImportDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface RepoOption {
  repoId: string;
  languageId: number | null;
  languageName: string | null;
}

// A selectable node entry — label shows the full breadcrumb path
interface NodeOption {
  nodeId: string;
  nodeName: string;
  pathLabel: string; // e.g. "Paris > City Map > Eiffel Tower > Stop 1"
  repos: RepoOption[];
}

interface FileRow {
  id: string;
  file: File;
  name: string;
  selectedNodeId: string;
  selectedRepoId: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Recursive tree walker ────────────────────────────────────────────────────
// Walks the full Location > Map > Spot > Stop hierarchy under `nodeId`,
// collecting every node that owns at least one audio repository.
async function collectAudioNodes(
  nodeId: string,
  ancestorPath: string,
): Promise<NodeOption[]> {
  let resp: Awaited<ReturnType<typeof contentApi.fetchChildren>>;
  try {
    resp = await contentApi.fetchChildren(nodeId);
  } catch {
    return [];
  }

  const { children, repositories } = resp.data as {
    children: Node[];
    repositories: Repository[];
  };

  const results: NodeOption[] = [];

  // Audio repos directly on this node
  const audioRepos = repositories.filter(
    r => r.type === REPOSITORY_KINDS.AUDIO,
  );
  if (audioRepos.length > 0) {
    results.push({
      nodeId,
      nodeName: ancestorPath.split(' › ').pop() ?? ancestorPath,
      pathLabel: ancestorPath,
      repos: audioRepos.map(r => ({
        repoId: String(r.id),
        languageId: r.languageId ?? null,
        languageName: r.language ?? null,
      })),
    });
  }

  // Recurse into children
  await Promise.all(
    children.map(async child => {
      const childPath = ancestorPath
        ? `${ancestorPath} › ${child.name}`
        : child.name;
      const nested = await collectAudioNodes(String(child.id), childPath);
      results.push(...nested);
    }),
  );

  return results;
}

// ── Component ────────────────────────────────────────────────────────────────
export const BulkImportDialog = ({
  isOpen,
  setIsOpen,
}: BulkImportDialogProps) => {
  const [rows, setRows] = useState<FileRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nodeOptions, setNodeOptions] = useState<NodeOption[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);

  const { uploadFile, currentPath } = useContentStore();
  const currentSegment = currentPath[currentPath.length - 1];

  // ── Build node tree on open ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setIsLoadingNodes(true);
      try {
        const isAtRepo =
          currentSegment.type === FOLDER_ITEM_TYPE.REPOSITORY &&
          currentSegment.repoType === REPOSITORY_KINDS.AUDIO;

        if (isAtRepo) {
          // Already inside an audio repo — single implicit target
          const repoId = currentSegment.id.split(':')[1];
          setNodeOptions([
            {
              nodeId: currentSegment.id,
              nodeName: currentSegment.name,
              pathLabel: currentSegment.name,
              repos: [{ repoId, languageId: null, languageName: null }],
            },
          ]);
          return;
        }

        // Walk the full subtree from current node
        const built = await collectAudioNodes(
          currentSegment.id,
          currentSegment.name,
        );
        setNodeOptions(built);
      } catch {
        toast.error('Failed to load audio repositories');
      } finally {
        setIsLoadingNodes(false);
      }
    };

    load();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDefaults = useCallback(
    (opts = nodeOptions) => {
      const first = opts[0];
      return {
        selectedNodeId: first?.nodeId ?? '',
        selectedRepoId: first?.repos[0]?.repoId ?? '',
      };
    },
    [nodeOptions],
  );

  // ── File handling ──────────────────────────────────────────────────────────
  const isTypeAllowed = (file: File) => file.type.startsWith(AUDIO_MIME_PREFIX);

  const addFiles = useCallback(
    (files: File[]) => {
      const valid = files.filter(isTypeAllowed);
      const rejected = files.length - valid.length;
      if (rejected > 0)
        toast.error(`${rejected} file(s) skipped — audio files only`);

      setRows(prev => {
        const existingNames = new Set(prev.map(r => r.file.name));
        const defaults = getDefaults();
        const newRows: FileRow[] = valid
          .filter(f => !existingNames.has(f.name))
          .map(file => ({
            id: `${file.name}-${file.size}-${Math.random()}`,
            file,
            name: file.name.replace(/\.[^/.]+$/, ''),
            status: 'pending',
            ...defaults,
          }));
        return [...prev, ...newRows];
      });
    },
    [getDefaults],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeRow = (id: string) =>
    setRows(prev => prev.filter(r => r.id !== id));

  const updateName = (id: string, value: string) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, name: value } : r)));

  const handleNodeChange = (rowId: string, nodeId: string) => {
    const node = nodeOptions.find(n => n.nodeId === nodeId);
    const firstRepo = node?.repos[0]?.repoId ?? '';
    setRows(prev =>
      prev.map(r =>
        r.id === rowId
          ? { ...r, selectedNodeId: nodeId, selectedRepoId: firstRepo }
          : r,
      ),
    );
  };

  const handleRepoChange = (rowId: string, repoId: string) =>
    setRows(prev =>
      prev.map(r => (r.id === rowId ? { ...r, selectedRepoId: repoId } : r)),
    );

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUploadAll = async () => {
    const pending = rows.filter(r => r.status === 'pending');
    if (!pending.length) return;

    setIsUploading(true);
    setUploadProgress(0);
    let done = 0;

    for (const row of pending) {
      setRows(prev =>
        prev.map(r => (r.id === row.id ? { ...r, status: 'uploading' } : r)),
      );

      try {
        await uploadFile({
          file: row.file,
          name: row.name || row.file.name,
          position: null,
          repoId: row.selectedRepoId,
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
    const failed = rows.filter(r => r.status === 'error').length;
    if (failed === 0) toast.success(`${pending.length} file(s) uploaded`);
    else toast.warning(`${pending.length - failed} uploaded, ${failed} failed`);
  };

  const handleClose = () => {
    if (isUploading) return;
    setRows([]);
    setUploadProgress(0);
    setNodeOptions([]);
    setIsOpen(false);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const allDone =
    rows.length > 0 &&
    rows.every(r => r.status === 'success' || r.status === 'error');
  const pendingCount = rows.filter(r => r.status === 'pending').length;
  const successCount = rows.filter(r => r.status === 'success').length;
  const errorCount = rows.filter(r => r.status === 'error').length;
  const noTargets = !isLoadingNodes && nodeOptions.length === 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* ── Header (sticky) ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload size={18} />
            Bulk Import — Audio Files
          </DialogTitle>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className="flex flex-col gap-4 px-6 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Loading / no-targets notice */}
          {isLoadingNodes && (
            <div className="flex items-center gap-2 text-sm text-neutral-400 py-1">
              <Loader2 size={14} className="animate-spin" />
              Scanning audio repositories…
            </div>
          )}
          {noTargets && (
            <div className="flex items-center gap-2 text-sm text-orange-600 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <AlertCircle size={14} />
              No audio repositories found under this location.
            </div>
          )}

          {/* Drop zone — hidden while uploading */}
          {!isUploading && (
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors shrink-0',
                isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50',
                (noTargets || isLoadingNodes) &&
                  'pointer-events-none opacity-40',
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <FileAudio
                size={26}
                className={cn(
                  'mx-auto mb-1.5',
                  isDragging ? 'text-purple-500' : 'text-neutral-400',
                )}
              />
              <p className="text-sm font-medium text-neutral-700">
                {isDragging
                  ? 'Drop audio files here'
                  : 'Click or drag audio files here'}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                mp3, wav, aac, flac, ogg…
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

          {/* ── File table (scrollable independently) ── */}
          {rows.length > 0 && (
            <div className="border rounded-lg overflow-hidden flex flex-col min-h-0">
              {/* Fixed column header */}
              <div className="bg-neutral-50 border-b shrink-0">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-8" />
                    <col /> {/* file — flexible */}
                    <col className="w-44" />
                    <col className="w-48" />
                    <col className="w-36" />
                    <col className="w-24" />
                    <col className="w-8" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="px-3 py-2" />
                      <th className="text-left px-3 py-2 font-medium text-neutral-600">
                        File
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-neutral-600">
                        Display Name
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-neutral-600">
                        Node
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-neutral-600">
                        Language
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-neutral-600">
                        Status
                      </th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Scrollable rows */}
              <div className="overflow-y-auto max-h-64">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-8" />
                    <col />
                    <col className="w-44" />
                    <col className="w-48" />
                    <col className="w-36" />
                    <col className="w-24" />
                    <col className="w-8" />
                  </colgroup>
                  <tbody className="divide-y divide-neutral-100">
                    {rows.map(row => {
                      const nodeOpt = nodeOptions.find(
                        n => n.nodeId === row.selectedNodeId,
                      );
                      const isLocked =
                        row.status === 'uploading' || row.status === 'success';

                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            'transition-colors',
                            row.status === 'success' && 'bg-green-50',
                            row.status === 'error' && 'bg-red-50',
                            row.status === 'uploading' && 'bg-blue-50',
                          )}
                        >
                          {/* Icon */}
                          <td className="px-3 py-2">
                            <FileAudio
                              size={15}
                              className="text-purple-500 shrink-0"
                            />
                          </td>

                          {/* File info */}
                          <td className="px-3 py-2 min-w-0">
                            <span
                              className="truncate block text-neutral-700 text-xs"
                              title={row.file.name}
                            >
                              {row.file.name}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {formatBytes(row.file.size)}
                            </span>
                            {row.status === 'error' && row.errorMessage && (
                              <span className="text-xs text-red-500 block truncate">
                                {row.errorMessage}
                              </span>
                            )}
                          </td>

                          {/* Display name */}
                          <td className="px-3 py-2">
                            <Input
                              value={row.name}
                              onChange={e => updateName(row.id, e.target.value)}
                              disabled={isLocked}
                              className="h-7 text-xs px-2"
                              placeholder="Display name"
                            />
                          </td>

                          {/* Node selector */}
                          <td className="px-3 py-2">
                            <Select
                              value={row.selectedNodeId}
                              onValueChange={v => handleNodeChange(row.id, v)}
                              disabled={isLocked || nodeOptions.length <= 1}
                            >
                              <SelectTrigger
                                className="h-7 text-xs"
                                title={nodeOpt?.pathLabel}
                              >
                                <SelectValue placeholder="Select node">
                                  <span className="truncate block">
                                    {nodeOpt?.pathLabel ?? '—'}
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {nodeOptions.map(n => (
                                  <SelectItem
                                    key={n.nodeId}
                                    value={n.nodeId}
                                    title={n.pathLabel}
                                  >
                                    {n.pathLabel}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>

                          {/* Language selector */}
                          <td className="px-3 py-2">
                            {nodeOpt && nodeOpt.repos.length > 1 ? (
                              <Select
                                value={row.selectedRepoId}
                                onValueChange={v => handleRepoChange(row.id, v)}
                                disabled={isLocked}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue placeholder="Language" />
                                </SelectTrigger>
                                <SelectContent>
                                  {nodeOpt.repos.map(r => (
                                    <SelectItem key={r.repoId} value={r.repoId}>
                                      {r.languageName ?? 'Default'}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs text-neutral-500 px-1">
                                {nodeOpt?.repos[0]?.languageName ?? '—'}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2 whitespace-nowrap">
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

                          {/* Remove */}
                          <td className="pr-2">
                            <button
                              onClick={() => removeRow(row.id)}
                              disabled={isLocked || isUploading}
                              className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {isUploading && (
            <div className="space-y-1 shrink-0">
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          )}

          {/* Summary */}
          {allDone && !isUploading && (
            <div className="flex items-center gap-3 text-sm rounded-lg border px-4 py-3 bg-neutral-50 shrink-0">
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

        {/* ── Footer (sticky) ── */}
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
                disabled={
                  pendingCount === 0 ||
                  isUploading ||
                  noTargets ||
                  isLoadingNodes
                }
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload size={14} className="mr-1" />
                    Upload{pendingCount > 0 ? ` (${pendingCount})` : ''}
                  </>
                )}
              </Button>
            )}

            {errorCount > 0 && !isUploading && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setRows(prev =>
                    prev.map(r =>
                      r.status === 'error'
                        ? {
                            ...r,
                            status: 'pending',
                            errorMessage: undefined,
                          }
                        : r,
                    ),
                  )
                }
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
