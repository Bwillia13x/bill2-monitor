/**
 * Alberta School Districts - Official List
 * Used for data validation and geo-fencing
 */

export interface District {
  id: string;
  name: string;
  type: 'public' | 'catholic' | 'francophone';
  city: string;
  region: 'north' | 'central' | 'south' | 'calgary' | 'edmonton';
}

export const ALBERTA_DISTRICTS: District[] = [
  // Edmonton Region
  {
    id: 'ab-edmonton-public',
    name: 'Edmonton Public Schools',
    type: 'public',
    city: 'Edmonton',
    region: 'edmonton'
  },
  {
    id: 'ab-edmonton-catholic',
    name: 'Edmonton Catholic Schools',
    type: 'catholic',
    city: 'Edmonton',
    region: 'edmonton'
  },
  {
    id: 'ab-st-albert-public',
    name: 'St. Albert Public Schools',
    type: 'public',
    city: 'St. Albert',
    region: 'edmonton'
  },
  
  // Calgary Region
  {
    id: 'ab-calgary-board',
    name: 'Calgary Board of Education',
    type: 'public',
    city: 'Calgary',
    region: 'calgary'
  },
  {
    id: 'ab-calgary-catholic',
    name: 'Calgary Catholic School District',
    type: 'catholic',
    city: 'Calgary',
    region: 'calgary'
  },
  
  // Central Alberta
  {
    id: 'ab-red-deer-public',
    name: 'Red Deer Public Schools',
    type: 'public',
    city: 'Red Deer',
    region: 'central'
  },
  {
    id: 'ab-red-deer-catholic',
    name: 'Red Deer Catholic Regional Schools',
    type: 'catholic',
    city: 'Red Deer',
    region: 'central'
  },
  {
    id: 'ab-rocky-view',
    name: 'Rocky View Schools',
    type: 'public',
    city: 'Airdrie',
    region: 'central'
  },
  {
    id: 'ab-chinooks-edge',
    name: 'Chinook\'s Edge School Division',
    type: 'public',
    city: 'Innisfail',
    region: 'central'
  },
  {
    id: 'ab-wolf-creek',
    name: 'Wolf Creek Public Schools',
    type: 'public',
    city: 'Ponoka',
    region: 'central'
  },
  
  // Southern Alberta
  {
    id: 'ab-lethbridge-public',
    name: 'Lethbridge School District',
    type: 'public',
    city: 'Lethbridge',
    region: 'south'
  },
  {
    id: 'ab-holy-spirit',
    name: 'Holy Spirit Catholic Schools',
    type: 'catholic',
    city: 'Lethbridge',
    region: 'south'
  },
  {
    id: 'ab-medicine-hat',
    name: 'Medicine Hat School District',
    type: 'public',
    city: 'Medicine Hat',
    region: 'south'
  },
  {
    id: 'ab-medicine-hat-catholic',
    name: 'Medicine Hat Catholic Board',
    type: 'catholic',
    city: 'Medicine Hat',
    region: 'south'
  },
  {
    id: 'ab-palliser',
    name: 'Palliser School Division',
    type: 'public',
    city: 'Lethbridge',
    region: 'south'
  },
  
  // Northern Alberta
  {
    id: 'ab-fort-mcmurray',
    name: 'Fort McMurray Public Schools',
    type: 'public',
    city: 'Fort McMurray',
    region: 'north'
  },
  {
    id: 'ab-northland',
    name: 'Northland School Division',
    type: 'public',
    city: 'Peace River',
    region: 'north'
  },
  {
    id: 'ab-high-prairie',
    name: 'High Prairie School Division',
    type: 'public',
    city: 'High Prairie',
    region: 'north'
  },
  {
    id: 'ab-fort-vermilion',
    name: 'Fort Vermilion School Division',
    type: 'public',
    city: 'Fort Vermilion',
    region: 'north'
  },
  
  // Other Regions
  {
    id: 'ab-grande-prairie',
    name: 'Grande Prairie Public School District',
    type: 'public',
    city: 'Grande Prairie',
    region: 'north'
  },
  {
    id: 'ab-grande-prairie-catholic',
    name: 'Grande Prairie Catholic Schools',
    type: 'catholic',
    city: 'Grande Prairie',
    region: 'north'
  },
  {
    id: 'ab-livingstone-range',
    name: 'Livingstone Range School Division',
    type: 'public',
    city: 'Claresholm',
    region: 'south'
  },
  {
    id: 'ab-westwind',
    name: 'Westwind School Division',
    type: 'public',
    city: 'Cardston',
    region: 'south'
  },
  {
    id: 'ab-franco-sud',
    name: 'FrancoSud',
    type: 'francophone',
    city: 'Calgary',
    region: 'south'
  }
];

// Create lookup maps for efficient validation
export const DISTRICT_NAME_TO_ID = ALBERTA_DISTRICTS.reduce((acc, district) => {
  acc[district.name.toLowerCase()] = district.id;
  return acc;
}, {} as Record<string, string>);

export const DISTRICT_ID_TO_NAME = ALBERTA_DISTRICTS.reduce((acc, district) => {
  acc[district.id] = district.name;
  return acc;
}, {} as Record<string, string>);

export const VALID_DISTRICT_NAMES = ALBERTA_DISTRICTS.map(d => d.name.toLowerCase());
export const VALID_DISTRICT_IDS = ALBERTA_DISTRICTS.map(d => d.id);

/**
 * Validate if a district name is an official Alberta school district
 */
export function isValidAlbertaDistrict(districtName: string): boolean {
  if (!districtName) return false;
  return VALID_DISTRICT_NAMES.includes(districtName.toLowerCase().trim());
}

/**
 * Normalize district name to official format
 */
export function normalizeDistrictName(districtName: string): string | null {
  if (!districtName) return null;
  
  const normalized = districtName.toLowerCase().trim();
  const district = ALBERTA_DISTRICTS.find(d => 
    d.name.toLowerCase() === normalized ||
    d.id.toLowerCase() === normalized
  );
  
  return district ? district.name : null;
}

/**
 * Get district ID from name
 */
export function getDistrictId(districtName: string): string | null {
  if (!districtName) return null;
  return DISTRICT_NAME_TO_ID[districtName.toLowerCase().trim()] || null;
}

/**
 * Get district name from ID
 */
export function getDistrictName(districtId: string): string | null {
  if (!districtId) return null;
  return DISTRICT_ID_TO_NAME[districtId] || null;
}

/**
 * Filter out non-Alberta districts from data
 */
export function filterAlbertaDistricts<T extends { district?: string | null }>(
  data: T[]
): T[] {
  return data.filter(item => 
    item.district && isValidAlbertaDistrict(item.district)
  );
}