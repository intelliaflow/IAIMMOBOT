import { z } from "zod";

const geocodingResultSchema = z.object({
  lat: z.string(),
  lon: z.string(),
  display_name: z.string()
});

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cache for geocoding results to avoid duplicate requests
const geocodingCache = new Map<string, { lat: string; lon: string }>();

export async function geocodeAddress(address: string): Promise<{ lat: string; lon: string } | null> {
  try {
    // Check cache first
    const cachedResult = geocodingCache.get(address);
    if (cachedResult) {
      console.log('Using cached coordinates for:', address);
      return cachedResult;
    }

    // Add a small delay to respect API rate limits
    await delay(1000);

    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=fr`,
      {
        headers: {
          'User-Agent': 'IAImmo/1.0', // Required by Nominatim's ToS
          'Accept-Language': 'fr' // Prefer French results
        }
      }
    );
    
    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded, waiting longer...');
        await delay(2000);
        return geocodeAddress(address);
      }
      throw new Error(`Geocoding request failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.length) {
      console.warn('No coordinates found for address:', address);
      return null;
    }

    const result = geocodingResultSchema.parse(data[0]);
    const coordinates = {
      lat: result.lat,
      lon: result.lon
    };

    // Cache the result
    geocodingCache.set(address, coordinates);

    console.log('Successfully geocoded:', address, coordinates);
    return coordinates;
  } catch (error) {
    console.error('Geocoding error for address:', address, error);
    return null;
  }
}

// Function to batch geocode multiple addresses
export async function batchGeocodeAddresses(addresses: string[]): Promise<Map<string, { lat: string; lon: string } | null>> {
  const results = new Map<string, { lat: string; lon: string } | null>();
  
  for (const address of addresses) {
    const result = await geocodeAddress(address);
    results.set(address, result);
  }
  
  return results;
}
