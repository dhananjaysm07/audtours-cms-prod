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
import { contentApi, languageApi } from '@/lib/api';
import type { Repository, Node, Language } from '@/types';
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

// Existing audio repo keyed by languageId (null = no language)
interface ExistingRepo {
  repoId: string;
  languageId: number | null;
}

// A discovered node that can receive audio uploads
interface NodeOption {
  nodeId: string; // numeric node id as string
  pathLabel: string; // "Location › Map › Spot › Stop"
  repos: ExistingRepo[]; // already-existing audio repos on this node
}

// NO_LANG sentinel for the language selector
const NO_LANG_VALUE = '__none__';

interface FileRow {
  id: string;
  file: File;
  name: string;
  selectedNodeId: string;
  // languageId as string for <Select>; NO_LANG_VALUE means no language
  selectedLanguageId: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Recursive subtree walker ─────────────────────────────────────────────────
// Collects every node in the Location › Map › Spot › Stop tree that either
// already has an audio repo or is a valid stop (can have one created).
async function collectNodes(
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

  const audioRepos: ExistingRepo[] = repositories
    .filter(r => r.type === REPOSITORY_KINDS.AUDIO)
    .map(r => ({
      repoId: String(r.id),
      languageId: r.languageId ?? null,
    }));

  // Include this node if it has audio repos OR if it's a leaf (stop/spot)
  // that can accept uploads — we'll create the repo on demand if needed.
  // We include it whenever it has at least some audio repos already or is
  // a terminal node (no more children after fetch — handled by recursion).
  // Simplest rule: always include the node if it has audio repos or children
  // that might have them. We include it with whatever repos exist; the upload
  // logic will create a new repo when the chosen language has none.
  if (audioRepos.length > 0 || children.length === 0) {
    // Only include if it can meaningfully accept audio (has existing repo or is a leaf)
    results.push({
      nodeId,
      pathLabel: ancestorPath,
      repos: audioRepos,
    });
  }

  await Promise.all(
    children.map(async child => {
      const childPath = ancestorPath
        ? `${ancestorPath} › ${child.name}`
        : child.name;
      const nested = await collectNodes(String(child.id), childPath);
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
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);

  // repoId cache: "nodeId:languageId" → repoId (populated as repos are created)
  const repoCache = useRef<Record<string, string>>({});

  const { uploadFile, currentPath } = useContentStore();
  const currentSegment = currentPath[currentPath.length - 1];

  // ── Load node tree + languages on open ──────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    repoCache.current = {};

    const load = async () => {
      setIsLoadingMeta(true);
      try {
        const [langResp, nodes] = await Promise.all([
          languageApi.getLanguages(),
          (async () => {
            const isAtRepo =
              currentSegment.type === FOLDER_ITEM_TYPE.REPOSITORY &&
              currentSegment.repoType === REPOSITORY_KINDS.AUDIO;

            if (isAtRepo) {
              const repoId = currentSegment.id.split(':')[1];
              return [
                {
                  nodeId: currentSegment.id,
                  pathLabel: currentSegment.name,
                  repos: [{ repoId, languageId: null }],
                },
              ] as NodeOption[];
            }

            return collectNodes(currentSegment.id, currentSegment.name);
          })(),
        ]);

        const activeLanguages = langResp.data.filter(l => l.isActive);
        setLanguages(activeLanguages);

        // Seed the repo cache with already-known repos
        nodes.forEach(n => {
          n.repos.forEach(r => {
            const key = `${n.nodeId}:${r.languageId ?? 'null'}`;
            repoCache.current[key] = r.repoId;
          });
        });

        setNodeOptions(nodes);
      } catch {
        toast.error('Failed to load repositories or languages');
      } finally {
        setIsLoadingMeta(false);
      }
    };

    load();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const defaultNodeId = nodeOptions[0]?.nodeId ?? '';
  const defaultLangId = NO_LANG_VALUE;

  // ── File helpers ───────────────────────────────────────────────────────────
  const isTypeAllowed = (f: File) => f.type.startsWith(AUDIO_MIME_PREFIX);

  const addFiles = useCallback(
    (files: File[]) => {
      const valid = files.filter(isTypeAllowed);
      const rejected = files.length - valid.length;
      if (rejected > 0)
        toast.error(`${rejected} file(s) skipped — audio files only`);

      setRows(prev => {
        const existingNames = new Set(prev.map(r => r.file.name));
        const newRows: FileRow[] = valid
          .filter(f => !existingNames.has(f.name))
          .map(file => ({
            id: `${file.name}-${file.size}-${Math.random()}`,
            file,
            name: file.name.replace(/\.[^/.]+$/, ''),
            status: 'pending',
            selectedNodeId: defaultNodeId,
            selectedLanguageId: defaultLangId,
          }));
        return [...prev, ...newRows];
      });
    },
    [defaultNodeId], // eslint-disable-line react-hooks/exhaustive-deps
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

  const updateField = (
    id: string,
    field: 'name' | 'selectedNodeId' | 'selectedLanguageId',
    value: string,
  ) =>
    setRows(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r)),
    );

  // ── Resolve (or create) the repo for a node + language combo ─────────────
  const resolveRepoId = async (
    nodeId: string,
    languageIdStr: string,
  ): Promise<string> => {
    const languageId =
      languageIdStr === NO_LANG_VALUE ? null : Number(languageIdStr);
    const cacheKey = `${nodeId}:${languageId ?? 'null'}`;

    if (repoCache.current[cacheKey]) return repoCache.current[cacheKey];

    // Need to create a new audio repo for this node + language
    const resp = await contentApi.createRepository(
      Number(nodeId),
      REPOSITORY_KINDS.AUDIO,
      languageId ?? undefined,
    );

    const newRepoId = String(resp.data.id);
    repoCache.current[cacheKey] = newRepoId;

    // Also add to nodeOptions so the UI is consistent
    setNodeOptions(prev =>
      prev.map(n =>
        n.nodeId === nodeId
          ? {
              ...n,
              repos: [...n.repos, { repoId: newRepoId, languageId }],
            }
          : n,
      ),
    );

    return newRepoId;
  };

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
        // Step 1: get or create the repo
        const repoId = await resolveRepoId(
          row.selectedNodeId,
          row.selectedLanguageId,
        );

        // Step 2: upload the file
        await uploadFile({
          file: row.file,
          name: row.name || row.file.name,
          position: null,
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
    const failed = rows.filter(r => r.status === 'error').length;
    if (failed === 0) toast.success(`${pending.length} file(s) uploaded`);
    else toast.warning(`${pending.length - failed} uploaded, ${failed} failed`);
  };

  const handleClose = () => {
    if (isUploading) return;
    setRows([]);
    setUploadProgress(0);
    setNodeOptions([]);
    setLanguages([]);
    repoCache.current = {};
    setIsOpen(false);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const allDone =
    rows.length > 0 &&
    rows.every(r => r.status === 'success' || r.status === 'error');
  const pendingCount = rows.filter(r => r.status === 'pending').length;
  const successCount = rows.filter(r => r.status === 'success').length;
  const errorCount = rows.filter(r => r.status === 'error').length;
  const noTargets = !isLoadingMeta && nodeOptions.length === 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload size={18} />
            Bulk Import — Audio Files
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex flex-col gap-4 px-6 py-4 overflow-y-auto flex-1 min-h-0">
          {isLoadingMeta && (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Loader2 size={14} className="animate-spin" />
              Scanning repositories &amp; languages…
            </div>
          )}

          {noTargets && (
            <div className="flex items-center gap-2 text-sm text-orange-600 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <AlertCircle size={14} />
              No audio-capable nodes found under this location.
            </div>
          )}

          {/* Drop zone */}
          {!isUploading && (
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors shrink-0',
                isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50',
                (noTargets || isLoadingMeta) &&
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

          {/* File table */}
          {rows.length > 0 && (
            <div className="border rounded-lg overflow-hidden flex flex-col min-h-0">
              {/* Sticky header */}
              <div className="bg-neutral-50 border-b shrink-0">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-8" /> {/* icon */}
                    <col /> {/* file — flex */}
                    <col className="w-40" /> {/* display name */}
                    <col className="w-52" /> {/* node */}
                    <col className="w-36" /> {/* language */}
                    <col className="w-24" /> {/* status */}
                    <col className="w-8" /> {/* remove */}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="px-3 py-2" />
                      <th className="text-left px-3 py-2 font-medium text-neutral-600 text-xs">
                        File
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-neutral-600 text-xs">
                        Display Name
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-neutral-600 text-xs">
                        Node
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-neutral-600 text-xs">
                        Language
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-neutral-600 text-xs">
                        Status
                      </th>
                      <th />
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Scrollable rows — capped so header/footer always visible */}
              <div className="overflow-y-auto max-h-72">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-8" />
                    <col />
                    <col className="w-40" />
                    <col className="w-52" />
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
                              onChange={e =>
                                updateField(row.id, 'name', e.target.value)
                              }
                              disabled={isLocked}
                              className="h-7 text-xs px-2"
                              placeholder="Display name"
                            />
                          </td>

                          {/* Node selector */}
                          <td className="px-3 py-2">
                            <Select
                              value={row.selectedNodeId}
                              onValueChange={v =>
                                updateField(row.id, 'selectedNodeId', v)
                              }
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

                          {/* Language selector — global list */}
                          <td className="px-3 py-2">
                            <Select
                              value={row.selectedLanguageId}
                              onValueChange={v =>
                                updateField(row.id, 'selectedLanguageId', v)
                              }
                              disabled={isLocked}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="Language" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NO_LANG_VALUE}>
                                  No language
                                </SelectItem>
                                {languages.map(l => (
                                  <SelectItem key={l.id} value={String(l.id)}>
                                    {l.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                disabled={
                  pendingCount === 0 ||
                  isUploading ||
                  noTargets ||
                  isLoadingMeta
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
                        ? { ...r, status: 'pending', errorMessage: undefined }
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
