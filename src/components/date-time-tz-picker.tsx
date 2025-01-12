import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { formatInTimeZone } from 'date-fns-tz';
import { addMinutes, parseISO } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from './ui/select';

interface TimeZoneOption {
  value: string;
  label: string;
}

// Fallback array of time zones
const timeZones: TimeZoneOption[] = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
].map((tz) => ({
  value: tz,
  label: tz.replace(/_/g, ' '),
}));

const years = Array.from(
  { length: 21 },
  (_, i) => new Date().getFullYear() - 10 + i
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

export const DateTimePicker: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeZone, setSelectedTimeZone] = useState<TimeZoneOption>({
    value: Intl.DateTimeFormat().resolvedOptions().timeZone,
    label: Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' '),
  });

  const handleDateChange = (date: Date | null) => {
    if (date) {
      // Convert to UTC
      const utcDate = addMinutes(date, -date.getTimezoneOffset());
      setSelectedDate(utcDate);
    }
  };

  const handleTimezoneChange = (value: string) => {
    const matchingTimeZone = timeZones.find((tz) => tz.value === value);
    if (matchingTimeZone) {
      setSelectedTimeZone(matchingTimeZone);
    }
  };

  const formatDateInTimeZone = (date: Date, timeZone: string) => {
    return formatInTimeZone(date, timeZone, 'EEEE, d MMMM yyyy HH:mm:ss zzz');
  };

  const localDate = new Date(
    selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000
  );
  const timeZoneDate = parseISO(
    formatInTimeZone(
      selectedDate,
      selectedTimeZone.value,
      "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"
    )
  );

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
      <div className="space-y-8">
        {/* Date Picker */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>Select Date and Time ({selectedTimeZone.value})</span>
          </label>
          <div className="relative">
            <DatePicker
              selected={localDate}
              onChange={handleDateChange}
              showTimeSelect
              showMonthDropdown
              showYearDropdown
              scrollableYearDropdown
              scrollableMonthYearDropdown
              yearDropdownItemNumber={21}
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
            />
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Timezone Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Timezone
          </label>
          <Select onValueChange={handleTimezoneChange}>
            <SelectTrigger className="w-full border-2 rounded-lg">
              <SelectValue placeholder={selectedTimeZone.label} />
            </SelectTrigger>
            <SelectContent>
              {timeZones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Output Section */}
        {/* <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
          <OutputSection
            label="UTC Timestamp"
            value={selectedDate.getTime().toString()}
            color="blue"
          />
          <OutputSection
            label="UTC Date"
            value={selectedDate.toUTCString()}
            color="green"
          />
          <OutputSection
            label="Local System Time"
            value={localDate.toString()}
            color="purple"
          />
          <OutputSection
            label="Selected Timezone Time"
            value={formatDateInTimeZone(selectedDate, selectedTimeZone.value)}
            color="orange"
          />
        </div> */}
      </div>
    </div>
  );
};

interface OutputSectionProps {
  label: string;
  value: string;
  color: string;
}

const OutputSection: React.FC<OutputSectionProps> = ({
  label,
  value,
  color,
}) => (
  <div>
    <h3 className={`text-sm font-medium text-gray-700 flex items-center gap-2`}>
      <span className={`w-3 h-3 rounded-full bg-${color}-500`}></span>
      {label}
    </h3>
    <p className="mt-1 text-lg bg-white p-3 rounded-md shadow-sm border border-gray-200 break-words">
      {value}
    </p>
  </div>
);
