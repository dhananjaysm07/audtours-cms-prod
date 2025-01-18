import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, Clock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CustomCalendar } from './custom-calendar';

interface DateTimeComponents {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
}

const parseInitialValue = (isoString?: string): DateTimeComponents => {
  if (!isoString) {
    return {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      hour: 0,
      minute: 0,
    };
  }

  const date = new Date(isoString);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  };
};

const componentsToUtcIsoString = (components: DateTimeComponents): string => {
  return new Date(
    Date.UTC(
      components.year,
      components.month - 1,
      components.day,
      components.hour,
      components.minute
    )
  ).toISOString();
};

const DatePicker = ({
  date,
  onSelect,
}: {
  date?: Date;
  onSelect: (date: Date) => void;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className="justify-start h-7 font-normal text-sm p-2 min-w-[12rem]"
        size="sm"
      >
        <CalendarIcon className="h-4 w-4 mr-2" />
        {date ? format(date, 'PPP') : 'Pick a date'}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <CustomCalendar selectedDate={date} onSelect={onSelect} />
    </PopoverContent>
  </Popover>
);

const TimePicker = ({
  hour,
  minute,
  onTimeChange,
}: {
  hour: number;
  minute: number;
  onTimeChange: (hour: number, minute: number) => void;
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="flex items-center gap-1">
      <Clock className="h-4 w-4 mr-1.5" />
      <Select
        value={hour.toString()}
        onValueChange={(value) => onTimeChange(parseInt(value), minute)}
      >
        <SelectTrigger className="w-16 h-7 p-2 text-sm">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-32">
            {hours.map((h) => (
              <SelectItem key={h} value={h.toString()}>
                {h.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
      <span>:</span>
      <Select
        value={minute.toString()}
        onValueChange={(value) => onTimeChange(hour, parseInt(value))}
      >
        <SelectTrigger className="w-16 h-7 p-2 text-sm">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-32">
            {minutes.map((m) => (
              <SelectItem key={m} value={m.toString()}>
                {m.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
};

export const DateTimePicker = ({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) => {
  const [components, setComponents] = useState<DateTimeComponents>(() =>
    parseInitialValue(value)
  );

  useEffect(() => {
    if (value) {
      setComponents(parseInitialValue(value));
    }
  }, [value]);

  const updateComponents = useCallback(
    (newComponents: Partial<DateTimeComponents>) => {
      setComponents((prev) => {
        const updated = { ...prev, ...newComponents };
        if (onChange) {
          const isoString = componentsToUtcIsoString(updated);
          onChange(isoString);
        }
        return updated;
      });
    },
    [onChange]
  );

  const handleDateSelect = useCallback(
    (date: Date) => {
      updateComponents({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      });
    },
    [updateComponents]
  );

  const currentDate = new Date(
    components.year,
    components.month - 1,
    components.day,
    components.hour,
    components.minute
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        <DatePicker date={currentDate} onSelect={handleDateSelect} />
        <TimePicker
          hour={components.hour}
          minute={components.minute}
          onTimeChange={(hour, minute) => updateComponents({ hour, minute })}
        />
      </div>
    </div>
  );
};
