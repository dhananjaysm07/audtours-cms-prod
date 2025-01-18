import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  getYear,
  setYear,
  setMonth,
} from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const CustomCalendar = ({
  selectedDate,
  onSelect,
}: {
  selectedDate?: Date;
  onSelect: (date: Date) => void;
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const weekDays = ['Su', 'M', 'T', 'W', 'T', 'F', 'S'];
  const startPadding = monthStart.getDay();
  const paddingDays = Array(startPadding).fill(null);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const years = Array.from(
    { length: 21 },
    (_, i) => getYear(currentMonth) - 10 + i
  );
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const handleYearChange = (year: string) => {
    setCurrentMonth(setYear(currentMonth, parseInt(year)));
  };

  const handleMonthChange = (month: string) => {
    setCurrentMonth(setMonth(currentMonth, months.indexOf(month)));
  };

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handlePrevMonth}
        >
          <ChevronLeft className="h-4 w-2" />
        </Button>
        <div className="flex items-center space-x-2">
          <Select
            value={getYear(currentMonth).toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-20 text-xs h-6 p-2">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="h-32">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={format(currentMonth, 'MMMM')}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-32 text-xs h-6 p-2">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {paddingDays.map((_, index) => (
          <div key={`pad-${index}`} className="h-6" />
        ))}
        {daysInMonth.map((day) => (
          <Button
            key={day.toISOString()}
            variant={
              selectedDate && isSameDay(day, selectedDate) ? 'default' : 'ghost'
            }
            className={`h-6 w-6 ${
              !isSameMonth(day, currentMonth) ? 'text-gray-400' : ''
            }`}
            onClick={() => onSelect(day)}
          >
            {format(day, 'd')}
          </Button>
        ))}
      </div>
    </div>
  );
};
