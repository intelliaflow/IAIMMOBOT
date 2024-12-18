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
  if (!address) {
    console.error('No address provided for geocoding');
    return null;
  }

  console.log('Starting geocoding for address:', address);
  
  try {
    // Vérifier le cache en premier
    const cachedResult = geocodingCache.get(address);
    if (cachedResult) {
      console.log('Using cached coordinates for:', address);
      return cachedResult;
    }

    // S'assurer que l'adresse est bien formatée
    let formattedAddress = address.trim();
    if (!formattedAddress.toLowerCase().includes('france')) {
      formattedAddress = `${formattedAddress}, France`;
    }
    
    // Vérifie si l'adresse contient un code postal
    if (!/\d{5}/.test(formattedAddress)) {
      console.warn('Address missing postal code:', formattedAddress);
    }

    console.log('Formatted address for geocoding:', formattedAddress);
    
    const encodedAddress = encodeURIComponent(formattedAddress);
    const url = `https://nominatim.openstreetmap.org/search?` + 
      `format=json&` +
      `q=${encodedAddress}&` +
      `countrycodes=fr&` +
      `addressdetails=1&` + // Get detailed address info
      `limit=1`; // Get only the best match
    
    console.log('Making request to:', url);
    
    // Ajouter un délai pour respecter les limites de l'API
    await delay(1000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'IAImmo/1.0',
        'Accept-Language': 'fr'
      }
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded, waiting longer...');
        await delay(2000);
        return geocodeAddress(address);
      }
      throw new Error(`Geocoding request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received geocoding response:', data);
    
    if (!data.length) {
      console.warn('No coordinates found for address:', formattedAddress);
      // Essayer avec une version simplifiée de l'adresse (ville uniquement)
      const cityOnly = formattedAddress.split(',')[0].trim();
      if (cityOnly !== formattedAddress) {
        console.log('Retrying with city only:', cityOnly);
        return geocodeAddress(cityOnly);
      }
      return null;
    }

    const result = data[0];
    
    // Validate that the result is in France
    if (result.address?.country_code?.toLowerCase() !== 'fr') {
      console.warn('Result not in France:', formattedAddress);
      return null;
    }

    const coordinates = {
      lat: result.lat,
      lon: result.lon
    };

    // Cache the result
    geocodingCache.set(address, coordinates);

    console.log('Successfully geocoded:', formattedAddress, coordinates);
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
