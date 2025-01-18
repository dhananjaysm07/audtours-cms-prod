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
import { Button } from '@/components/ui/button';
import { UseFormReturn } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { X, Calendar as CalendarIcon, Clock, Globe } from 'lucide-react';
import LoadingSpinner from './spinner';
import { Input } from '@/components/ui/input';
import { useCallback, useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { timezones } from '@/lib/timezones';
import { formSchema } from '@/pages/codes';

// Mock node data
const availableNodes = [
  { id: 'node-1', name: 'Node 1' },
  { id: 'node-2', name: 'Node 2' },
  { id: 'node-3', name: 'Node 3' },
  { id: 'node-4', name: 'Node 4' },
  { id: 'node-5', name: 'Node 5' },
  { id: 'node-6', name: 'Node 6' },
  { id: 'node-7', name: 'Node 7' },
  { id: 'node-8', name: 'Node 8' },
  { id: 'node-9', name: 'Node 9' },
  { id: 'node-10', name: 'Node 10' },
];

// Separate date picker component
const DatePicker = ({
  selected,
  onSelect,
}: {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className="justify-start h-6 font-normal text-sm p-2 min-w-48"
        size={'sm'}
      >
        <CalendarIcon className="h-4 w-4 mr-1" />
        {selected ? format(selected, 'PPP') : 'Pick a date'}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto" align="start">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        initialFocus
      />
    </PopoverContent>
  </Popover>
);

// Separate time picker component
// Time Picker Component
const TimePicker = ({
  hour,
  minute,
  onTimeChange,
}: {
  hour: string;
  minute: string;
  onTimeChange: (type: 'hour' | 'minute', value: string) => void;
}) => {
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, '0')
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, '0')
  );

  return (
    <div className="flex items-center gap-1">
      <Clock className="h-4 w-4 mr-1.5" />
      <Select
        value={hour}
        onValueChange={(value) => onTimeChange('hour', value)}
      >
        <SelectTrigger className="w-14 h-6 p-2 text-sm">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-32">
            {hours.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
      <span>:</span>
      <Select
        value={minute}
        onValueChange={(value) => onTimeChange('minute', value)}
      >
        <SelectTrigger className="w-14 h-6 p-2 text-sm">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-32">
            {minutes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
};

// Timezone Picker Component
const TimezonePicker = ({
  timezone,
  onTimezoneChange,
}: {
  timezone: string;
  onTimezoneChange: (timezone: string) => void;
}) => (
  <div className="flex items-center gap-1">
    <Globe className="h-4 w-4 mr-2" />
    <Select value={timezone} onValueChange={onTimezoneChange}>
      <SelectTrigger className="w-32 h-6 p-2 text-sm">
        <SelectValue placeholder="Select timezone" />
      </SelectTrigger>
      <SelectContent>
        <ScrollArea className="h-32">
          {timezones.map((tz) => (
            <SelectItem key={tz.name} value={tz.name} className="text-sm">
              {tz.offset} ({tz.abbr})
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  </div>
);

// Combined date-time-zone picker component
// Date Time Zone Picker Component
const DateTimeZonePicker = ({
  value,
  onChange,
}: {
  value?: { date: Date; timezone: string };
  onChange?: (value: { date: Date; timezone: string }) => void;
}) => {
  const [date, setDate] = useState<Date | undefined>(value?.date);
  const [hour, setHour] = useState('00');
  const [minute, setMinute] = useState('00');
  const [timezone, setTimezone] = useState(
    value?.timezone || timezones[0].name
  );
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (value?.date && !isInitialized) {
      setDate(value.date);
      setHour(value.date.getHours().toString().padStart(2, '0'));
      setMinute(value.date.getMinutes().toString().padStart(2, '0'));
      setIsInitialized(true);
    }
    if (value?.timezone && !isInitialized) {
      setTimezone(value.timezone);
    }
  }, [value, isInitialized]);

  const handleDateSelect = useCallback(
    (newDate: Date | undefined) => {
      if (newDate) {
        const updatedDate = new Date(newDate);
        updatedDate.setHours(parseInt(hour), parseInt(minute));
        setDate(updatedDate);
        onChange?.({ date: updatedDate, timezone });
      }
    },
    [hour, minute, timezone, onChange]
  );

  const handleTimeChange = useCallback(
    (type: 'hour' | 'minute', value: string) => {
      if (type === 'hour') setHour(value);
      else setMinute(value);

      if (date) {
        const updatedDate = new Date(date);
        updatedDate.setHours(
          type === 'hour' ? parseInt(value) : parseInt(hour),
          type === 'minute' ? parseInt(value) : parseInt(minute)
        );
        setDate(updatedDate);
        onChange?.({ date: updatedDate, timezone });
      }
    },
    [date, hour, minute, timezone, onChange]
  );

  const handleTimezoneChange = useCallback(
    (newTimezone: string) => {
      setTimezone(newTimezone);
      if (date) {
        onChange?.({ date, timezone: newTimezone });
      }
    },
    [date, onChange]
  );

  if (!isInitialized && value?.date) {
    return null;
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <DatePicker selected={date} onSelect={handleDateSelect} />
      <TimePicker hour={hour} minute={minute} onTimeChange={handleTimeChange} />
      <TimezonePicker
        timezone={timezone}
        onTimezoneChange={handleTimezoneChange}
      />
    </div>
  );
};

const CreateCodeDialog = ({
  dialogOpen,
  setDialogOpen,
  form,
}: {
  dialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  form: UseFormReturn<z.infer<typeof formSchema>>;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNodeSearch, setShowNodeSearch] = useState(false);

  useEffect(() => {
    if (!dialogOpen) {
      // Reset states when dialog closes
      setSearchTerm('');
      setShowNodeSearch(false);
      setShowSuccess(false);
      setShowError(false);
    }
  }, [dialogOpen]);

  const selectedNodes = form.watch('nodeIds') || [];

  const filteredNodes = availableNodes.filter(
    (node) =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedNodes.includes(node.id)
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      const currentNodes = form.getValues('nodeIds') || [];
      form.setValue('nodeIds', [...currentNodes, nodeId]);
      setShowNodeSearch(false);
    },
    [form]
  );

  const handleRemoveNode = useCallback(
    (nodeId: string) => {
      const currentNodes = form.getValues('nodeIds') || [];
      form.setValue(
        'nodeIds',
        currentNodes.filter((id) => id !== nodeId)
      );
    },
    [form]
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('Form values:', values);
      setShowSuccess(true);
      setTimeout(() => {
        setDialogOpen(false);
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error(error);
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          + Create Code
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-xl"
        aria-describedby="div"
        aria-description="Create Code Dialog Box"
      >
        <DialogHeader>
          <DialogTitle>Create New Code</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="nodeIds"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Nodes</FormLabel>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {field.value.map((nodeId) => {
                        const node = availableNodes.find(
                          (n) => n.id === nodeId
                        );
                        return (
                          <Badge
                            key={nodeId}
                            variant="secondary"
                            className="gap-1.5 h-6 p-2"
                          >
                            {node?.name}
                            <button
                              type="button"
                              onClick={() => handleRemoveNode(nodeId)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}

                      <Popover
                        open={showNodeSearch}
                        onOpenChange={setShowNodeSearch}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="justify-start h-6 p-2"
                          >
                            + Add Node
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search nodes..."
                              value={searchTerm}
                              onValueChange={setSearchTerm}
                            />
                            <CommandList>
                              {filteredNodes.map((node) => (
                                <CommandItem
                                  key={node.id}
                                  onSelect={() => handleNodeSelect(node.id)}
                                >
                                  {node.name}
                                </CommandItem>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starts</FormLabel>
                    <FormControl>
                      <DateTimeZonePicker
                        onChange={(value) => field.onChange(value)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ends</FormLabel>
                    <FormControl>
                      <DateTimeZonePicker
                        onChange={(value) => field.onChange(value)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="maxUsers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Users</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      placeholder="Enter maximum users"
                      className="w-20 h-6 p-2 text-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pt-2">
              <Button type="submit" className="w-full " disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner /> : 'Create Code'}
              </Button>
            </div>

            {showSuccess && (
              <div className="bg-green-50 text-green-700 rounded p-2 text-sm">
                Code created successfully!
              </div>
            )}
            {showError && (
              <div className="bg-red-50 text-red-700 rounded p-2 text-sm">
                Failed to create code. Please try again.
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCodeDialog;
