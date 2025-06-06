import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import CreateCodeDialog from '@/components/create-code-dialog';
import UpdateCodeDialog from '@/components/update-code-dialog';
import { subscriptionApi, templateApi } from '@/lib/api';
import type { CodeResponse, PaginationMeta, User } from '@/types';
import LoadingSpinner from '@/components/spinner';
import {
  createCodeSchema,
  CreateCodeSchema,
} from '@/schemas/create-code-schema';
import {
  updateCodeSchema,
  UpdateCodeSchema,
} from '@/schemas/update-code-schema';
import { userApi } from '@/lib/api/user';
import { Download, Eye, EyeOff } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Define API error type
interface ApiErrorDetail {
  status: number;
  message: string;
  data?: {
    errors?: Record<string, string[]>;
  };
}

const DEFAULT_PAGINATION: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

export default function Codes() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedCodeId, setSelectedCodeId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('codes');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [usersPagination, setUsersPagination] =
    useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [userSearch, setUserSearch] = useState('');
  const [showingUserCodes, setShowingUserCodes] = useState(false);
  const [visibleOtps, setVisibleOtps] = useState<Record<string, boolean>>({});

  // State for template status checking and PDF loading
  const [codeTemplateStatus, setCodeTemplateStatus] = useState<
    Record<number, boolean>
  >({});
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);

  const [codes, setCodes] = useState<CodeResponse[]>([]);
  const [pagination, setPagination] =
    useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const createForm = useForm<CreateCodeSchema>({
    resolver: zodResolver(createCodeSchema),
    defaultValues: {
      nodeIds: [],
      expiryDays: 7,
      expiryHours: 0,
      maxUsers: 1,
    },
  });

  const updateForm = useForm<UpdateCodeSchema>({
    resolver: zodResolver(updateCodeSchema),
    defaultValues: {
      expiryDays: 0,
      expiryHours: 0,
    },
  });

  // Check if a code has all required templates
  const checkCodeTemplates = useCallback(
    async (codeId: number): Promise<boolean> => {
      // Return cached result if available
      if (codeTemplateStatus[codeId] !== undefined) {
        return codeTemplateStatus[codeId];
      }

      try {
        const response = await templateApi.checkCodeTemplates(codeId);

        if (response.status === 'success') {
          // Update cache
          setCodeTemplateStatus(prev => ({
            ...prev,
            [codeId]: response.data.complete,
          }));

          return response.data.complete;
        }

        return false;
      } catch (error) {
        console.error(`Error checking templates for code ${codeId}:`, error);
        return false;
      }
    },
    [codeTemplateStatus],
  );

  // Check templates for all codes when they load
  useEffect(() => {
    if (codes.length > 0) {
      codes.forEach(code => {
        if (code.isActive) {
          checkCodeTemplates(code.codeId);
        }
      });
    }
  }, [checkCodeTemplates, codes]);

  const loadCodes = useCallback(
    async (page?: number, limit?: number) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await subscriptionApi.getCodes(
          page ?? pagination.page,
          limit ?? pagination.limit,
        );

        if (response.status === 'success') {
          setCodes(response.data);
          if (response.meta?.pagination) {
            setPagination(response.meta.pagination);
          }
        } else {
          toast.error(response.message || 'Failed to load codes');
        }
      } catch (error) {
        toast.error('Failed to load codes');
        console.error('Failed to load codes:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.page, pagination.limit],
  );

  const loadUsers = useCallback(
    async (page?: number, limit?: number) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await userApi.getUsers(
          page ?? usersPagination.page,
          limit ?? usersPagination.limit,
        );

        if (response.status === 'success') {
          setUsers(response.data);
          if (response.meta?.pagination) {
            setUsersPagination(response.meta.pagination);
          }
        } else {
          toast.error(response.message || 'Failed to load users');
        }
      } catch (error) {
        toast.error('Failed to load users');
        console.error('Failed to load users:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [usersPagination.page, usersPagination.limit],
  );

  const handleCodesSearch = useCallback(
    async (searchTerm: string) => {
      try {
        setIsLoading(true);
        setError(null);

        if (searchTerm.trim()) {
          const response = await subscriptionApi.searchCodes(searchTerm);
          if (response.status === 'success') {
            setCodes(response.data);
          } else {
            toast.error(response.message || 'Search failed');
          }
        } else {
          await loadCodes(1, pagination.limit);
        }
      } catch (error) {
        toast.error('Search failed');
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [loadCodes, pagination.limit],
  );

  const handleUserSearch = useCallback(
    async (searchTerm: string) => {
      try {
        setIsLoading(true);
        setError(null);

        if (searchTerm.trim()) {
          const response = await userApi.searchUsers(searchTerm);
          if (response.status === 'success') {
            setUsers(response.data);
          } else {
            toast.error(response.message || 'User search failed');
          }
        } else {
          await loadUsers(1, usersPagination.limit);
        }
      } catch (error) {
        toast.error('User search failed');
        console.error('User search failed:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [loadUsers, usersPagination.limit],
  );

  const handleShowOtp = useCallback(
    (userId: number, field: 'otp' | 'resetPasswordOTP') => {
      setVisibleOtps(prev => ({ ...prev, [`${userId}-${field}`]: true }));
      setTimeout(() => {
        setVisibleOtps(prev => ({ ...prev, [`${userId}-${field}`]: false }));
      }, 10000);
    },
    [],
  );

  useEffect(() => {
    if (mounted) {
      loadUsers();
    }
  }, [loadUsers, mounted]);

  const handleDeactivate = useCallback(
    async (codeId: number) => {
      try {
        setError(null);
        const response = await subscriptionApi.deactivateCode(codeId);
        if (response.status === 'success') {
          toast.success('Code deactivated successfully');
          await loadCodes();
        } else {
          toast.error(response.message || 'Failed to deactivate code');
        }
      } catch (error) {
        toast.error('Failed to deactivate code');
        console.error('Failed to deactivate code:', error);
      }
    },
    [loadCodes],
  );

  // Updated function to handle downloading tickets - uses only codeId
  const handleDownloadTicket = async (codeId: number): Promise<void> => {
    try {
      // First check if all templates exist
      const templateCheckResponse = await templateApi.checkCodeTemplates(
        codeId,
      );

      if (
        templateCheckResponse.status !== 'success' ||
        !templateCheckResponse.data.complete
      ) {
        if (
          templateCheckResponse.data.missingNodes &&
          templateCheckResponse.data.missingNodes.length > 0
        ) {
          toast.error(
            `Cannot generate PDF: Missing templates for nodes: ${templateCheckResponse.data.missingNodes.join(
              ', ',
            )}`,
          );
        } else {
          toast.error('Cannot generate PDF: Some nodes are missing templates');
        }
        return;
      }

      // Proceed with download if all templates exist
      setIsPdfLoading(true);
      setPdfLoadingId(codeId);
      toast.info('Generating ticket PDF...');

      try {
        // Try to get PDF as base64 first - only passing codeId
        const response = await templateApi.generatePdfAsBase64(codeId);

        if (response.status === 'success' && response.data) {
          // Download the PDF using base64 data
          templateApi.downloadBase64Pdf(
            response.data.base64Pdf,
            response.data.filename,
          );
          toast.success('Ticket downloaded successfully');
        } else {
          throw new Error(
            response.message || 'Failed to generate PDF as base64',
          );
        }
      } catch (error) {
        // Try to extract error details
        const apiError = error as ApiErrorDetail;

        // Check if this is a validation error (missing templates)
        if (apiError.status === 400 && apiError.data?.errors?.template) {
          toast.error(apiError.data.errors.template[0]);
          return;
        }

        console.error(
          'Base64 generation failed, trying direct download:',
          error,
        );

        try {
          // Fallback to direct download - only passing codeId
          const response = await templateApi.generatePdfForDownload(codeId);

          // Process as blob and download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ticket-${codeId}.pdf`;
          document.body.appendChild(a);
          a.click();

          // Clean up
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast.success('Ticket downloaded successfully');
        } catch (downloadError) {
          const apiDownloadError = downloadError as ApiErrorDetail;

          if (
            apiDownloadError.status === 400 &&
            apiDownloadError.data?.errors?.template
          ) {
            toast.error(apiDownloadError.data.errors.template[0]);
          } else {
            toast.error('Failed to download ticket. Please try again.');
          }
          console.error('Error in direct download:', downloadError);
        }
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Failed to download ticket. Please try again.');
    } finally {
      setIsPdfLoading(false);
      setPdfLoadingId(null);
    }
  };

  // DownloadButton component with tooltips
  const DownloadButton: React.FC<{ code: CodeResponse }> = ({ code }) => {
    const hasTemplates = codeTemplateStatus[code.codeId] === true;

    if (!code.isActive || !code.nodes?.length) {
      return <span className="text-xs text-gray-400">Not available</span>;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 py-1 px-2 font-semibold flex items-center gap-1"
              onClick={() => handleDownloadTicket(code.codeId)} // Only pass codeId
              disabled={
                (isPdfLoading && pdfLoadingId === code.codeId) || !hasTemplates
              }
            >
              {isPdfLoading && pdfLoadingId === code.codeId ? (
                <LoadingSpinner size="small" />
              ) : (
                <Download size={14} />
              )}
              <span>Ticket</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {!hasTemplates
              ? 'All nodes must have templates to generate a PDF ticket'
              : 'Download ticket'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  useEffect(() => {
    if (mounted) loadCodes();
  }, [loadCodes, mounted]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const filteredCodes = useMemo(() => {
    return codes.filter(code => {
      if (filter === 'all') return true;
      return filter === 'active' ? code.isActive : !code.isActive;
    });
  }, [codes, filter]);

  const handleCreateCode = useCallback(
    async (data: CreateCodeSchema) => {
      try {
        const response = await subscriptionApi.createCode(data);
        if (response.status === 'success') {
          toast.success('Code created successfully');
          setCreateDialogOpen(false);
          loadCodes();
        } else {
          toast.error(response.message || 'Failed to create code');
        }
      } catch (error) {
        toast.error('Failed to create code');
        console.error('Failed to create code:', error);
      }
    },
    [loadCodes],
  );

  const handleUpdateCode = useCallback(
    async (data: UpdateCodeSchema) => {
      try {
        const response = await subscriptionApi.updateCode(
          selectedCodeId as number,
          data,
        );
        if (response.status === 'success') {
          toast.success('Code updated successfully');
          setUpdateDialogOpen(false);
          loadCodes(); // Refresh the list after update
        } else {
          toast.error(response.message || 'Failed to update code');
        }
      } catch (error) {
        toast.error('Failed to update code');
        console.error('Failed to update code:', error);
      }
    },
    [loadCodes, setUpdateDialogOpen, selectedCodeId],
  );

  if (!mounted) return null;

  return (
    <div className="flex container mx-auto gap-4 flex-col">
      <div className="rounded-lg">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Codes</CardTitle>
              <CardDescription>Total codes in system</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pagination?.total ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Codes</CardTitle>
              <CardDescription>Currently active codes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {codes?.filter(code => code.isActive)?.length ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Usage</CardTitle>
              <CardDescription>Combined code usage</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {codes?.reduce((acc, code) => acc + (code.usedCount ?? 0), 0) ??
                  0}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg flex-1" ref={containerRef}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="codes" className="data-[state=active]:px-8">
                Codes
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:px-8">
                Users
              </TabsTrigger>
            </TabsList>
            {activeTab === 'codes' && (
              <CreateCodeDialog
                dialogOpen={createDialogOpen}
                setDialogOpen={setCreateDialogOpen}
                form={createForm}
                onCreateCode={handleCreateCode}
              />
            )}
            <UpdateCodeDialog
              dialogOpen={updateDialogOpen}
              setDialogOpen={setUpdateDialogOpen}
              form={updateForm}
              codeId={selectedCodeId!}
              handleUpdateCode={handleUpdateCode}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
          <>
            {activeTab === 'codes' && (
              <div className="mb-4 flex justify-between items-center">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search Codes..."
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      handleCodesSearch(e.target.value);
                    }}
                    className="w-[200px]"
                  />
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {activeTab === 'users' && (
              <div className="mb-4">
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={e => {
                    setUserSearch(e.target.value);
                    handleUserSearch(e.target.value);
                  }}
                  className="w-[200px]"
                />
              </div>
            )}
          </>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="flex-1">
              <TabsContent value="codes" className="h-full">
                {codes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48">
                    <img
                      src="no-codes.png"
                      alt="No Codes Found"
                      width={100}
                      height={100}
                    />
                    <span>No Codes Found</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Nodes</TableHead>
                        <TableHead>Valid To</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Deactivation</TableHead>
                        <TableHead>Extend</TableHead>
                        <TableHead>Ticket</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCodes.map(code => (
                        <TableRow key={code.codeId}>
                          <TableCell>{code.code}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {code.nodes?.map(node => (
                                <Badge
                                  key={node.nodeId}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {node.path}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(code.validTo).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {code.usedCount}/{code.maxUsers}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                                code.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {code.isActive ? 'active' : 'expired'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-6 py-1 px-2 font-semibold"
                              onClick={() => handleDeactivate(code.codeId)}
                              disabled={!code.isActive}
                            >
                              Deactivate
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-6 py-1 px-2 font-semibold"
                              onClick={() => {
                                setUpdateDialogOpen(true);
                                setSelectedCodeId(code.codeId);
                              }}
                            >
                              Extend
                            </Button>
                          </TableCell>
                          <TableCell>
                            <DownloadButton code={code} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="mt-4 flex px-2 items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}{' '}
                    of {pagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadCodes(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadCodes(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="users" className="h-full">
                {showingUserCodes ? (
                  <div>
                    <Button
                      variant="outline"
                      className="mb-4"
                      onClick={() => setShowingUserCodes(false)}
                    >
                      Back to Users
                    </Button>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Nodes</TableHead>
                          <TableHead>Valid To</TableHead>
                          <TableHead>Usage</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>OTP</TableHead>
                        <TableHead>Reset Password OTP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {visibleOtps[`${user.id}-otp`] ? (
                                <span>{user.otp}</span>
                              ) : (
                                <span>••••••</span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShowOtp(user.id, 'otp')}
                              >
                                {visibleOtps[`${user.id}-otp`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {visibleOtps[`${user.id}-resetPasswordOTP`] ? (
                                <span>{user.resetPasswordOTP}</span>
                              ) : (
                                <span>••••••</span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleShowOtp(user.id, 'resetPasswordOTP')
                                }
                              >
                                {visibleOtps[`${user.id}-resetPasswordOTP`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Add pagination for users */}
                <div className="mt-4 flex px-2 items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing{' '}
                    {(usersPagination.page - 1) * usersPagination.limit + 1} to{' '}
                    {Math.min(
                      usersPagination.page * usersPagination.limit,
                      usersPagination.total,
                    )}{' '}
                    of {usersPagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadUsers(usersPagination.page - 1)}
                      disabled={usersPagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadUsers(usersPagination.page + 1)}
                      disabled={
                        usersPagination.page >= usersPagination.totalPages
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}
