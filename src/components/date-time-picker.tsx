import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns-tz';
import { CustomCalendar } from './custom-calendar';

const INDIA_TIMEZONE = 'Asia/Kolkata';

interface DateComponents {
  year: number;
  month: number;
  day: number;
}

const parseInitialValue = (isoString?: string): DateComponents => {
  if (!isoString) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
  }

  const date = new Date(isoString);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
};

const componentsToIsoString = (components: DateComponents): string => {
  const localDate = new Date(
    components.year,
    components.month - 1,
    components.day
  );
  return localDate.toISOString().split('T')[0]; // Only return YYYY-MM-DD
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
        {date
          ? format(date, 'PPP', { timeZone: INDIA_TIMEZONE })
          : 'Pick a date'}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <CustomCalendar selectedDate={date} onSelect={onSelect} />
    </PopoverContent>
  </Popover>
);

export const DateTimePicker = ({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) => {
  const [components, setComponents] = useState<DateComponents>(() =>
    parseInitialValue(value)
  );

  useEffect(() => {
    if (value) {
      setComponents(parseInitialValue(value));
    }
  }, [value]);

  const updateComponents = useCallback(
    (newComponents: Partial<DateComponents>) => {
      setComponents((prev) => {
        const updated = { ...prev, ...newComponents };
        if (onChange) {
          const isoString = componentsToIsoString(updated);
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
    components.day
  );

  return (
    <div className="flex flex-col gap-2">
      <DatePicker date={currentDate} onSelect={handleDateSelect} />
    </div>
  );
};
