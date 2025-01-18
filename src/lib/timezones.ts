interface TimezoneInfo {
  name: string;
  offset: string;
  abbr: string;
}

export const timezones: TimezoneInfo[] = [
  { name: 'UTC', offset: '+00:00', abbr: 'UTC' },
  { name: 'Asia/Kolkata', offset: '+05:30', abbr: 'IST' },
  { name: 'Pacific/Midway', offset: '-11:00', abbr: 'SST' },
  { name: 'Pacific/Honolulu', offset: '-10:00', abbr: 'HST' },
  { name: 'America/Anchorage', offset: '-09:00', abbr: 'AKST' },
  { name: 'America/Los_Angeles', offset: '-08:00', abbr: 'PST' },
  { name: 'America/Denver', offset: '-07:00', abbr: 'MST' },
  { name: 'America/Chicago', offset: '-06:00', abbr: 'CST' },
  { name: 'America/New_York', offset: '-05:00', abbr: 'EST' },
  { name: 'America/Halifax', offset: '-04:00', abbr: 'AST' },
  { name: 'America/St_Johns', offset: '-03:30', abbr: 'NST' },
  { name: 'America/Sao_Paulo', offset: '-03:00', abbr: 'BRT' },
  { name: 'Atlantic/Cape_Verde', offset: '-01:00', abbr: 'CVT' },
  { name: 'Europe/London', offset: '+00:00', abbr: 'GMT' },
  { name: 'Europe/Berlin', offset: '+01:00', abbr: 'CET' },
  { name: 'Europe/Helsinki', offset: '+02:00', abbr: 'EET' },
  { name: 'Europe/Moscow', offset: '+03:00', abbr: 'MSK' },
  { name: 'Asia/Tehran', offset: '+03:30', abbr: 'IRST' },
  { name: 'Asia/Dubai', offset: '+04:00', abbr: 'GST' },
  { name: 'Asia/Kabul', offset: '+04:30', abbr: 'AFT' },
  { name: 'Asia/Karachi', offset: '+05:00', abbr: 'PKT' },
  { name: 'Asia/Yangon', offset: '+06:30', abbr: 'MMT' },
  { name: 'Asia/Bangkok', offset: '+07:00', abbr: 'ICT' },
  { name: 'Asia/Shanghai', offset: '+08:00', abbr: 'CST' },
  { name: 'Asia/Tokyo', offset: '+09:00', abbr: 'JST' },
  { name: 'Australia/Adelaide', offset: '+09:30', abbr: 'ACST' },
  { name: 'Australia/Sydney', offset: '+10:00', abbr: 'AEST' },
  { name: 'Australia/Lord_Howe', offset: '+10:30', abbr: 'LHST' },
  { name: 'Pacific/Norfolk', offset: '+11:00', abbr: 'NFT' },
  { name: 'Pacific/Auckland', offset: '+12:00', abbr: 'NZST' },
  { name: 'Pacific/Chatham', offset: '+12:45', abbr: 'CHAST' },
  { name: 'Pacific/Apia', offset: '+13:00', abbr: 'WST' },
  { name: 'Pacific/Kiritimati', offset: '+14:00', abbr: 'LINT' },
];
