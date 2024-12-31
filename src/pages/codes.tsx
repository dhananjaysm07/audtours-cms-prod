import React, { useRef, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
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
import { Popover, PopoverContent } from '@/components/ui/popover';
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
  {
    id: '2',
    code: 'GALLERY2024',
    startDate: '2024-02-15',
    expiryDate: '2024-11-30',
    accessCount: 8,
    maxAccess: 15,
    location: 'France > Gallery',
    status: 'active',
  },
  {
    id: '3',
    code: 'EXHIBIT2024',
    startDate: '2024-01-01',
    expiryDate: '2024-06-30',
    accessCount: 12,
    maxAccess: 20,
    location: 'Italy > Exhibition',
    status: 'active',
  },
  {
    id: '4',
    status: 'active',
    code: 'ARTSHOW2023',
    startDate: '2023-12-01',
    expiryDate: '2024-03-31',
    accessCount: 20,
    maxAccess: 20,
    location: 'Spain > Art Show',
  },
  {
    id: '5',
    code: 'CULTURE2024',
    startDate: '2024-03-15',
    expiryDate: '2024-09-30',
    accessCount: 3,
    maxAccess: 25,
    location: 'UK > Cultural Center',
    status: 'active',
  },
  {
    id: '6',
    code: 'HERITAGE24',
    startDate: '2024-04-01',
    expiryDate: '2024-10-31',
    accessCount: 0,
    maxAccess: 30,
    location: 'Greece > Heritage Site',
    status: 'active',
  },
  {
    id: '7',
    code: 'ARCHIVE2024',
    startDate: '2024-01-15',
    expiryDate: '2024-07-31',
    accessCount: 15,
    maxAccess: 15,
    location: 'Netherlands > Archive',
    status: 'expired',
  },
  {
    id: '8',
    code: 'LIBRARY24',
    startDate: '2024-03-01',
    expiryDate: '2024-08-31',
    accessCount: 7,
    maxAccess: 40,
    location: 'Belgium > Library',
    status: 'active',
  },
];

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    lastAccess: '2024-03-15',
    totalAccess: 12,
    codes: ['MUSEUM2024', 'GALLERY2024'],
  },
  {
    id: '2',
    name: 'Emma Wilson',
    email: 'emma.w@email.com',
    lastAccess: '2024-03-14',
    totalAccess: 8,
    codes: ['EXHIBIT2024'],
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'm.brown@email.com',
    lastAccess: '2024-03-13',
    totalAccess: 15,
    codes: ['CULTURE2024', 'LIBRARY24'],
  },
  {
    id: '4',
    name: 'Sarah Davis',
    email: 'sarah.d@email.com',
    lastAccess: '2024-03-12',
    totalAccess: 5,
    codes: ['HERITAGE24'],
  },
  {
    id: '5',
    name: 'James Wilson',
    email: 'j.wilson@email.com',
    lastAccess: '2024-03-11',
    totalAccess: 20,
    codes: ['MUSEUM2024', 'GALLERY2024', 'EXHIBIT2024'],
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    email: 'l.anderson@email.com',
    lastAccess: '2024-03-10',
    totalAccess: 7,
    codes: ['CULTURE2024'],
  },
  {
    id: '7',
    name: 'Robert Taylor',
    email: 'r.taylor@email.com',
    lastAccess: '2024-03-09',
    totalAccess: 10,
    codes: ['LIBRARY24', 'HERITAGE24'],
  },
  {
    id: '8',
    name: 'Emily White',
    email: 'e.white@email.com',
    lastAccess: '2024-03-08',
    totalAccess: 3,
    codes: ['MUSEUM2024'],
  },
  {
    id: '9',
    name: 'David Miller',
    email: 'd.miller@email.com',
    lastAccess: '2024-03-07',
    totalAccess: 18,
    codes: ['GALLERY2024', 'CULTURE2024', 'LIBRARY24'],
  },
  {
    id: '10',
    name: 'Jennifer Lee',
    email: 'j.lee@email.com',
    lastAccess: '2024-03-06',
    totalAccess: 6,
    codes: ['EXHIBIT2024', 'HERITAGE24'],
  },
];

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
  // const [showCreateModal, setShowCreateModal] = React.useState(false);
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
      console.log(error);
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex container mx-auto gap-4 flex-col">
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
              <TabsTrigger value="codes" className="data-[state=active]:px-8">
                Codes
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:px-8">
                Users
              </TabsTrigger>
            </TabsList>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  {/* <Plus className="h-2 w-2" />  */}+ Create Code
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

          <div className="flex-1">
            <div>
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
