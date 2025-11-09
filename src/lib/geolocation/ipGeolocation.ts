/**
 * IP Geolocation Service
 * Checks if user is accessing from Alberta, Canada
 * Uses ipapi.co - free tier: 30,000 requests/month, no API key required
 */

export interface GeoLocationResult {
  ip: string;
  city: string;
  region: string;
  region_code: string;
  country_name: string;
  country_code: string;
  is_alberta: boolean;
  is_canada: boolean;
  latitude: number;
  longitude: number;
  error?: string;
}

export interface GeoFenceConfig {
  enabled: boolean;
  strictMode: boolean; // If true, reject non-Alberta IPs. If false, warn only.
  allowedRegions: string[];
}

const DEFAULT_CONFIG: GeoFenceConfig = {
  enabled: true,
  strictMode: false, // Start with warning mode, can switch to strict later
  allowedRegions: ['Alberta']
};

/**
 * Get geolocation data for current user
 * Falls back to null on error to allow submission
 */
export async function getGeolocation(): Promise<GeoLocationResult | null> {
  try {
    // Use ipapi.co - free, no API key needed
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      ip: data.ip || '',
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      region_code: data.region_code || '',
      country_name: data.country_name || 'Unknown',
      country_code: data.country_code || '',
      is_alberta: (data.region === 'Alberta'),
      is_canada: (data.country_code === 'CA'),
      latitude: parseFloat(data.latitude) || 0,
      longitude: parseFloat(data.longitude) || 0
    };
  } catch (error) {
    console.error('Geolocation check failed:', error);
    // Fail open - allow submission if geolocation fails
    return null;
  }
}

/**
 * Check if user is accessing from Alberta
 * Returns true if Alberta OR if check fails (fail-open)
 */
export async function isAlbertaIP(): Promise<boolean> {
  const geo = await getGeolocation();
  
  if (!geo) {
    // Geolocation failed, fail open
    console.warn('Geolocation check failed, allowing submission');
    return true;
  }
  
  return geo.is_alberta;
}

/**
 * Get detailed location info for logging
 */
export async function getLocationInfo(): Promise<{
  ip: string;
  region: string;
  country: string;
  is_alberta: boolean;
} | null> {
  const geo = await getGeolocation();
  
  if (!geo) return null;
  
  return {
    ip: geo.ip,
    region: geo.region,
    country: geo.country_name,
    is_alberta: geo.is_alberta
  };
}

/**
 * Detect VPN usage based on common indicators
 * This is heuristic-based and not foolproof
 */
export function detectVPNHeuristics(): boolean {
  const indicators = [
    // Check for WebRTC IP mismatch (simplified)
    // Note: Full WebRTC IP detection requires more complex implementation
    
    // Check for common VPN browser extensions
    'chrome-extension://',
    'moz-extension://'
  ];
  
  // Check if any VPN extensions are detected
  // This is a simplified check - in production, you'd want more robust detection
  return false; // For now, return false to avoid false positives
}

/**
 * Check geofence status with detailed result
 */
export interface GeoFenceCheck {
  allowed: boolean;
  is_alberta: boolean;
  is_canada: boolean;
  location: string;
  warning?: string;
  error?: string;
}

export async function checkGeoFence(
  config: GeoFenceConfig = DEFAULT_CONFIG
): Promise<GeoFenceCheck> {
  try {
    const geo = await getGeolocation();
    
    if (!geo) {
      return {
        allowed: true,
        is_alberta: false,
        is_canada: false,
        location: 'Unknown',
        warning: 'Location check failed - allowing submission'
      };
    }
    
    const isAlberta = geo.is_alberta;
    const isCanada = geo.is_canada;
    const location = `${geo.city}, ${geo.region}, ${geo.country_name}`;
    
    // If in Alberta, always allow
    if (isAlberta) {
      return {
        allowed: true,
        is_alberta: true,
        is_canada: true,
        location
      };
    }
    
    // If in Canada but not Alberta, warn or block
    if (isCanada && !isAlberta) {
      const warning = config.strictMode 
        ? 'Only Alberta residents can submit data'
        : 'You appear to be outside Alberta. Data may be filtered.';
      
      return {
        allowed: !config.strictMode,
        is_alberta: false,
        is_canada: true,
        location,
        warning
      };
    }
    
    // If outside Canada
    const warning = config.strictMode
      ? 'Only Canadian residents can submit data'
      : 'You appear to be outside Canada. VPN use may affect data quality.';
    
    return {
      allowed: !config.strictMode,
      is_alberta: false,
      is_canada: false,
      location,
      warning
    };
    
  } catch (error) {
    return {
      allowed: true,
      is_alberta: false,
      is_canada: false,
      location: 'Unknown',
      error: 'Geolocation check failed',
      warning: 'Unable to verify location - allowing submission'
    };
  }
}

/**
 * Get IP address without geolocation data
 * Useful for rate limiting without location tracking
 */
export async function getIPAddress(): Promise<string | null> {
  try {
    const response = await fetch('https://ipapi.co/ip/');
    return await response.text();
  } catch (error) {
    console.error('Failed to get IP address:', error);
    return null;
  }
}