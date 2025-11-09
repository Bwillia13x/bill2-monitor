/**
 * Geo-fuzzing Implementation
 * Randomizes coordinates within 2km radius before storage
 * Prevents precise location tracking while preserving approximate geography
 */

export interface GeoFuzzedLocation {
  lat: number;
  lon: number;
  radius_km: number;
  original_lat?: number; // Only for testing, never stored
  original_lon?: number; // Only for testing, never stored
}

/**
 * Randomize coordinates within specified radius (default 2km)
 * Uses uniform distribution within circular radius
 * 
 * @param lat - Original latitude
 * @param lon - Original longitude  
 * @param radius_km - Fuzzing radius in kilometers (default: 2)
 * @returns Fuzzed coordinates
 */
export function geoFuzz(
  lat: number, 
  lon: number, 
  radius_km: number = 2.0
): GeoFuzzedLocation {
  // Earth's radius in meters
  const EARTH_RADIUS = 6371000;
  
  // Convert radius to meters
  const radius_m = radius_km * 1000;
  
  // Generate random angle (0 to 2π)
  const angle = Math.random() * 2 * Math.PI;
  
  // Generate random distance (uniform distribution within circle)
  // Using sqrt for uniform distribution in area
  const distance = Math.sqrt(Math.random()) * radius_m;
  
  // Calculate coordinate offsets
  // Latitude offset is straightforward
  const deltaLat = (distance * Math.cos(angle)) / EARTH_RADIUS;
  
  // Longitude offset depends on latitude (cosine factor)
  const deltaLon = (distance * Math.sin(angle)) / (EARTH_RADIUS * Math.cos(lat * Math.PI / 180));
  
  // Apply offsets
  const fuzzedLat = lat + deltaLat * 180 / Math.PI;
  const fuzzedLon = lon + deltaLon * 180 / Math.PI;
  
  return {
    lat: fuzzedLat,
    lon: fuzzedLon,
    radius_km
  };
}

/**
 * Test geo-fuzzing distribution
 * Useful for validating uniform distribution within radius
 */
export function testGeoFuzzDistribution(
  centerLat: number = 53.5444, // Edmonton default
  centerLon: number = -113.4909,
  radius_km: number = 2.0,
  iterations: number = 1000
): {
  points: Array<{ lat: number; lon: number; distance: number }>;
  stats: {
    meanDistance: number;
    maxDistance: number;
    minDistance: number;
    stdDev: number;
  };
} {
  const points = [];
  let totalDistance = 0;
  let maxDistance = 0;
  let minDistance = Infinity;
  
  for (let i = 0; i < iterations; i++) {
    const fuzzed = geoFuzz(centerLat, centerLon, radius_km);
    const distance = calculateDistance(centerLat, centerLon, fuzzed.lat, fuzzed.lon);
    
    points.push({
      lat: fuzzed.lat,
      lon: fuzzed.lon,
      distance
    });
    
    totalDistance += distance;
    maxDistance = Math.max(maxDistance, distance);
    minDistance = Math.min(minDistance, distance);
  }
  
  const meanDistance = totalDistance / iterations;
  
  // Calculate standard deviation
  let varianceSum = 0;
  for (const point of points) {
    varianceSum += Math.pow(point.distance - meanDistance, 2);
  }
  const stdDev = Math.sqrt(varianceSum / iterations);
  
  return {
    points,
    stats: {
      meanDistance,
      maxDistance,
      minDistance,
      stdDev
    }
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
}

/**
 * Apply geo-fuzzing to submission data
 * Should be called before storing any location data
 */
export function applyGeoFuzzingToSubmission(
  submission: any,
  radius_km: number = 2.0
): any {
  // Only fuzz if coordinates exist
  if (!submission.latitude || !submission.longitude) {
    return submission;
  }
  
  // Create fuzzed location
  const fuzzed = geoFuzz(
    submission.latitude, 
    submission.longitude, 
    radius_km
  );
  
  // Return submission with fuzzed coordinates
  // Remove original coordinates to prevent storage
  return {
    ...submission,
    latitude: fuzzed.lat,
    longitude: fuzzed.lon,
    geo_fuzzed: {
      lat: fuzzed.lat,
      lon: fuzzed.lon,
      radius_km: fuzzed.radius_km
    }
  };
}

/**
 * Validate that fuzzed coordinates are within acceptable range
 * Ensures randomization doesn't produce invalid coordinates
 */
export function validateFuzzedCoordinates(
  lat: number, 
  lon: number,
  originalLat: number,
  originalLon: number,
  maxRadiusKm: number = 2.0
): boolean {
  // Check coordinates are valid
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return false;
  }
  
  // Check distance is within expected range (with some tolerance)
  const distance = calculateDistance(originalLat, originalLon, lat, lon);
  const maxDistance = maxRadiusKm * 1000 * 1.1; // 10% tolerance
  
  return distance <= maxDistance;
}