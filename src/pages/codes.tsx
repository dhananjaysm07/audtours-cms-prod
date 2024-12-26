import React, { useRef, useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

interface Code {
  id: string;
  code: string;
  startDate: string;
  expiryDate: string;
  accessCount: number;
  maxAccess: number;
  location: string;
  status: 'active' | 'expired';
}

interface User {
  id: string;
  name: string;
  email: string;
  lastAccess: string;
  totalAccess: number;
  codes: string[];
}

const Spinner = () => <Loader2 className="h-4 w-4 animate-spin" />;

const formSchema = z.object({
  code: z.string().min(6),
  location: z.string(),
  startDate: z.date(),
  expiryDate: z.date(),
  maxAccess: z.number().min(1),
});

export default function Codes() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('all');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      location: '',
      maxAccess: 1,
    },
  });

  const mockCodes: Code[] = [
    {
      id: '1',
      code: 'MUSEUM2024',
      startDate: '2024-03-01',
      expiryDate: '2024-12-31',
      accessCount: 5,
      maxAccess: 10,
      location: 'Germany > Museum',
      status: 'active',
    },
  ];

  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      lastAccess: '2024-03-10',
      totalAccess: 15,
      codes: ['MUSEUM2024'],
    },
  ];

  useEffect(() => {
    const calculateHeight = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          const parentHeight = parent.offsetHeight;
          const siblingHeight = Array.from(parent.children)
            .filter((child) => child !== containerRef.current)
            .reduce(
              (total, child) => total + (child as HTMLElement).offsetHeight,
              0
            );
          const availableHeight = parentHeight - siblingHeight - 32; // 32px for padding
          setMaxHeight(`${availableHeight}px`);
        }
      }
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // API call simulation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setShowSuccess(true);
      setTimeout(() => {
        setDialogOpen(false);
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6 h-screen flex flex-col">
      <div className="rounded-lg">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Codes</CardTitle>
              <CardDescription>Active codes in system</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{mockCodes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
              <CardDescription>Users with active access</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{mockUsers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Access</CardTitle>
              <CardDescription>Combined code usage</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {mockCodes.reduce((acc, code) => acc + code.accessCount, 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg flex-1" ref={containerRef}>
        <Tabs defaultValue="codes" className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="codes">Codes</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Create New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Code</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Add other form fields */}
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Spinner /> : 'Create Code'}
                    </Button>
                  </form>
                </Form>
                {showSuccess && (
                  <Popover open={showSuccess}>
                    <PopoverContent className="bg-green-50 text-green-700">
                      Code created successfully!
                    </PopoverContent>
                  </Popover>
                )}
                {showError && (
                  <Popover open={showError}>
                    <PopoverContent className="bg-red-50 text-red-700">
                      Failed to create code. Please try again.
                    </PopoverContent>
                  </Popover>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-2">
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

          <div className="flex-1 overflow-hidden" style={{ maxHeight }}>
            <div className="h-full overflow-auto">
              <TabsContent value="codes" className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCodes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell>{code.code}</TableCell>
                        <TableCell>{code.location}</TableCell>
                        <TableCell>{code.startDate}</TableCell>
                        <TableCell>{code.expiryDate}</TableCell>
                        <TableCell>
                          {code.accessCount}/{code.maxAccess}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                              code.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {code.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="users" className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Last Access</TableHead>
                      <TableHead>Total Access</TableHead>
                      <TableHead>Active Codes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.lastAccess}</TableCell>
                        <TableCell>{user.totalAccess}</TableCell>
                        <TableCell>{user.codes.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
