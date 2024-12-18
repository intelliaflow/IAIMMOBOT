import { z } from "zod";

const geocodingResultSchema = z.object({
  lat: z.string(),
  lon: z.string(),
  display_name: z.string()
});

export async function geocodeAddress(address: string): Promise<{ lat: string; lon: string } | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=fr`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    if (!data.length) {
      return null;
    }

    const result = geocodingResultSchema.parse(data[0]);
    return {
      lat: result.lat,
      lon: result.lon
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
