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
import { subscriptionApi } from '@/lib/api';
import type { CodeResponse, PaginationMeta } from '@/types';
import LoadingSpinner from '@/components/spinner';
import {
  createCodeSchema,
  CreateCodeSchema,
} from '@/schemas/create-code-schema';

const DEFAULT_PAGINATION: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

export default function Codes() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [, setMaxHeight] = useState<string>('0');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('codes');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [codes, setCodes] = useState<CodeResponse[]>([]);
  const [pagination, setPagination] =
    useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const form = useForm<CreateCodeSchema>({
    resolver: zodResolver(createCodeSchema),
    defaultValues: {
      nodeIds: [],
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date().toISOString().split('T')[0],
      maxUsers: 1,
    },
  });

  const loadCodes = useCallback(
    async (page?: number, limit?: number) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await subscriptionApi.getCodes(
          page ?? pagination.page,
          limit ?? pagination.limit
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
    [pagination.page, pagination.limit]
  );

  const handleSearch = useCallback(
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
    [loadCodes, pagination.limit]
  );

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
    [loadCodes]
  );

  useEffect(() => {
    if (mounted) loadCodes();
  }, [loadCodes, mounted]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const calculateHeight = () => {
      if (!containerRef.current) return;

      const parent = containerRef.current.parentElement;
      if (!parent) return;

      const parentHeight = parent.offsetHeight;
      const siblingHeight = Array.from(parent.children)
        .filter((child) => child !== containerRef.current)
        .reduce(
          (total, child) => total + (child as HTMLElement).offsetHeight,
          0
        );

      const availableHeight = parentHeight - siblingHeight - 32;
      setMaxHeight(`${availableHeight}px`);
    };

    if (mounted) {
      calculateHeight();
      window.addEventListener('resize', calculateHeight);
      return () => window.removeEventListener('resize', calculateHeight);
    }
  }, [mounted]);

  const filteredCodes = useMemo(() => {
    return codes.filter((code) => {
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
          setDialogOpen(false);
          loadCodes();
        } else {
          toast.error(response.message || 'Failed to create code');
        }
      } catch (error) {
        toast.error('Failed to create code');
        console.error('Failed to create code:', error);
      }
    },
    [loadCodes, setDialogOpen]
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
                {codes?.filter((code) => code.isActive)?.length ?? 0}
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
            </TabsList>
            <CreateCodeDialog
              dialogOpen={dialogOpen}
              setDialogOpen={setDialogOpen}
              form={form}
              onCreateCode={handleCreateCode}
            />
          </div>

          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-2">
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleSearch(e.target.value);
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

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}

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
                        <TableHead>Valid From</TableHead>
                        <TableHead>Valid To</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCodes.map((code) => (
                        <TableRow key={code.codeId}>
                          <TableCell>{code.code}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {code.nodes?.map((node) => (
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
                            {new Date(code.validFrom).toLocaleDateString()}
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
                            {code.isActive && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-6 py-1 px-2"
                                onClick={() => handleDeactivate(code.codeId)}
                              >
                                Deactivate
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}
