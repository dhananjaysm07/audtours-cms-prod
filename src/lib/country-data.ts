// src/lib/country-data.ts

// A map of countries to their continents
export type Country = {
  name: string;
  continent: string;
  code: string;
};

export const continents = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'Oceania',
  'South America',
  'Antarctica',
] as const;

export type Continent = (typeof continents)[number];

// This is a simplified list. In a real application, you would use a more complete list.
export const countries: Country[] = [
  { name: 'Afghanistan', continent: 'Asia', code: 'AF' },
  { name: 'Albania', continent: 'Europe', code: 'AL' },
  { name: 'Algeria', continent: 'Africa', code: 'DZ' },
  { name: 'Andorra', continent: 'Europe', code: 'AD' },
  { name: 'Angola', continent: 'Africa', code: 'AO' },
  { name: 'Argentina', continent: 'South America', code: 'AR' },
  { name: 'Armenia', continent: 'Asia', code: 'AM' },
  { name: 'Australia', continent: 'Oceania', code: 'AU' },
  { name: 'Austria', continent: 'Europe', code: 'AT' },
  { name: 'Azerbaijan', continent: 'Asia', code: 'AZ' },
  { name: 'Bahamas', continent: 'North America', code: 'BS' },
  { name: 'Bahrain', continent: 'Asia', code: 'BH' },
  { name: 'Bangladesh', continent: 'Asia', code: 'BD' },
  { name: 'Belgium', continent: 'Europe', code: 'BE' },
  { name: 'Belize', continent: 'North America', code: 'BZ' },
  { name: 'Bhutan', continent: 'Asia', code: 'BT' },
  { name: 'Bolivia', continent: 'South America', code: 'BO' },
  { name: 'Brazil', continent: 'South America', code: 'BR' },
  { name: 'Canada', continent: 'North America', code: 'CA' },
  { name: 'China', continent: 'Asia', code: 'CN' },
  { name: 'Colombia', continent: 'South America', code: 'CO' },
  { name: 'Costa Rica', continent: 'North America', code: 'CR' },
  { name: 'Croatia', continent: 'Europe', code: 'HR' },
  { name: 'Cuba', continent: 'North America', code: 'CU' },
  { name: 'Czech Republic', continent: 'Europe', code: 'CZ' },
  { name: 'Denmark', continent: 'Europe', code: 'DK' },
  { name: 'Ecuador', continent: 'South America', code: 'EC' },
  { name: 'Egypt', continent: 'Africa', code: 'EG' },
  { name: 'Estonia', continent: 'Europe', code: 'EE' },
  { name: 'Finland', continent: 'Europe', code: 'FI' },
  { name: 'France', continent: 'Europe', code: 'FR' },
  { name: 'Germany', continent: 'Europe', code: 'DE' },
  { name: 'Greece', continent: 'Europe', code: 'GR' },
  { name: 'Greenland', continent: 'North America', code: 'GL' },
  { name: 'Guatemala', continent: 'North America', code: 'GT' },
  { name: 'Honduras', continent: 'North America', code: 'HN' },
  { name: 'Hungary', continent: 'Europe', code: 'HU' },
  { name: 'Iceland', continent: 'Europe', code: 'IS' },
  { name: 'India', continent: 'Asia', code: 'IN' },
  { name: 'Indonesia', continent: 'Asia', code: 'ID' },
  { name: 'Iran', continent: 'Asia', code: 'IR' },
  { name: 'Iraq', continent: 'Asia', code: 'IQ' },
  { name: 'Ireland', continent: 'Europe', code: 'IE' },
  { name: 'Israel', continent: 'Asia', code: 'IL' },
  { name: 'Italy', continent: 'Europe', code: 'IT' },
  { name: 'Japan', continent: 'Asia', code: 'JP' },
  { name: 'Jordan', continent: 'Asia', code: 'JO' },
  { name: 'Kenya', continent: 'Africa', code: 'KE' },
  { name: 'Kuwait', continent: 'Asia', code: 'KW' },
  { name: 'Latvia', continent: 'Europe', code: 'LV' },
  { name: 'Lebanon', continent: 'Asia', code: 'LB' },
  { name: 'Libya', continent: 'Africa', code: 'LY' },
  { name: 'Lithuania', continent: 'Europe', code: 'LT' },
  { name: 'Luxembourg', continent: 'Europe', code: 'LU' },
  { name: 'Malaysia', continent: 'Asia', code: 'MY' },
  { name: 'Mexico', continent: 'North America', code: 'MX' },
  { name: 'Morocco', continent: 'Africa', code: 'MA' },
  { name: 'Netherlands', continent: 'Europe', code: 'NL' },
  { name: 'New Zealand', continent: 'Oceania', code: 'NZ' },
  { name: 'Nigeria', continent: 'Africa', code: 'NG' },
  { name: 'Norway', continent: 'Europe', code: 'NO' },
  { name: 'Pakistan', continent: 'Asia', code: 'PK' },
  { name: 'Panama', continent: 'North America', code: 'PA' },
  { name: 'Peru', continent: 'South America', code: 'PE' },
  { name: 'Philippines', continent: 'Asia', code: 'PH' },
  { name: 'Poland', continent: 'Europe', code: 'PL' },
  { name: 'Portugal', continent: 'Europe', code: 'PT' },
  { name: 'Romania', continent: 'Europe', code: 'RO' },
  { name: 'Russia', continent: 'Europe', code: 'RU' },
  { name: 'Saudi Arabia', continent: 'Asia', code: 'SA' },
  { name: 'Singapore', continent: 'Asia', code: 'SG' },
  { name: 'South Africa', continent: 'Africa', code: 'ZA' },
  { name: 'South Korea', continent: 'Asia', code: 'KR' },
  { name: 'Spain', continent: 'Europe', code: 'ES' },
  { name: 'Sri Lanka', continent: 'Asia', code: 'LK' },
  { name: 'Sweden', continent: 'Europe', code: 'SE' },
  { name: 'Switzerland', continent: 'Europe', code: 'CH' },
  { name: 'Thailand', continent: 'Asia', code: 'TH' },
  { name: 'Turkey', continent: 'Europe', code: 'TR' },
  { name: 'Ukraine', continent: 'Europe', code: 'UA' },
  { name: 'United Arab Emirates', continent: 'Asia', code: 'AE' },
  { name: 'United Kingdom', continent: 'Europe', code: 'GB' },
  { name: 'United States', continent: 'North America', code: 'US' },
  { name: 'Vietnam', continent: 'Asia', code: 'VN' },
];

// Helper function to get a country by name
export const getCountryByName = (name: string): Country | undefined => {
  return countries.find(country => country.name === name);
};

// Helper function to get continent by country name
export const getContinentByCountry = (
  countryName: string,
): string | undefined => {
  const country = getCountryByName(countryName);
  return country?.continent;
};

// Helper function to get countries by continent
export const getCountriesByContinent = (continent: string): Country[] => {
  return countries.filter(country => country.continent === continent);
};
