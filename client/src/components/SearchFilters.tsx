import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useQueryClient } from "@tanstack/react-query";

interface SearchFiltersProps {
  transactionType?: 'sale' | 'rent';
  showTransactionTypeFilter?: boolean;
  onSearch?: (params: SearchParams) => void;
}

export interface SearchParams {
  location?: string;
  propertyType?: string;
  rooms?: string;
  minPrice?: number;
  maxPrice?: number;
  transactionType?: 'sale' | 'rent';
}

export function SearchFilters({ transactionType, showTransactionTypeFilter = false, onSearch }: SearchFiltersProps) {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState<string>();
  const [rooms, setRooms] = useState<string>();
  const [selectedTransactionType, setSelectedTransactionType] = useState<'sale' | 'rent' | undefined>(transactionType);
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [isSearching, setIsSearching] = useState(false);

  // Store search params in query client cache
  const updateSearchParams = (params: SearchParams) => {
    queryClient.setQueryData(['searchParams'], params);
  };

  // Debounced update function for better performance
  const debouncedUpdate = (params: SearchParams) => {
    // Clear timeout if it exists
    const timeoutId = (window as any).searchTimeout;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    (window as any).searchTimeout = setTimeout(() => {
      updateSearchParams(params);
      
      // Log the current search parameters
      console.log('Updating search params:', params);
      
      // Invalidate relevant queries based on context
      if (onSearch) {
        // If onSearch callback is provided, let the parent component handle query invalidation
        onSearch(params);
      } else {
        // Otherwise, handle query invalidation here
        const queries = ['/api/properties'];
        if (transactionType) {
          queries.push(`/api/properties/transaction/${transactionType}`);
        }
        queries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: [query] });
        });
      }
    }, 300); // Wait 300ms before triggering search
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    try {
      const searchParams: SearchParams = {
        location: location?.trim() || undefined,
        propertyType,
        rooms,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        transactionType: selectedTransactionType || transactionType || undefined
      };

      console.log('Searching with params:', searchParams);
      
      // Update search params and notify parent component if callback exists
      debouncedUpdate(searchParams);
      onSearch?.(searchParams);

      // Build query string
      const params = new URLSearchParams();
      if (searchParams.location) params.append('location', searchParams.location);
      if (searchParams.propertyType) params.append('type', searchParams.propertyType);
      if (searchParams.rooms) params.append('rooms', searchParams.rooms);
      if (searchParams.minPrice) params.append('minPrice', searchParams.minPrice.toString());
      if (searchParams.maxPrice) params.append('maxPrice', searchParams.maxPrice.toString());
      if (searchParams.transactionType) params.append('transactionType', searchParams.transactionType);

      let results;
      if (transactionType) {
        // Effectuer la recherche filtrée par type de transaction
        const response = await fetch(
          `/api/properties/transaction/${transactionType}?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Erreur lors de la recherche');
        }

        results = await response.json();
        console.log('Search results:', results);

        // Mettre à jour le cache avec les nouveaux résultats
        queryClient.setQueryData(
          [`/api/properties/transaction/${transactionType}`],
          results
        );
      } else {
        // Sur la page d'accueil, utiliser l'API générale
        const response = await fetch(`/api/properties?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Erreur lors de la recherche');
        }

        results = await response.json();
        console.log('Search results:', results);

        // Mettre à jour le cache avec les nouveaux résultats
        queryClient.setQueryData(['/api/properties'], results);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow-md">
      <div className="space-y-6">
        {/* Section Localisation */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Où souhaitez-vous chercher ?</Label>
              <Input 
                id="location"
                placeholder="Saisissez une ville ou un code postal" 
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (e.target.value === '') {
                    debouncedUpdate({
                      location: undefined,
                      propertyType,
                      rooms,
                      minPrice: priceRange[0],
                      maxPrice: priceRange[1],
                      transactionType: selectedTransactionType || transactionType
                    });
                  }
                }}
                className="w-full"
              />
            </div>

            {showTransactionTypeFilter && (
              <div className="space-y-2">
                <Label htmlFor="transactionType">Type de transaction</Label>
                <Select value={selectedTransactionType} onValueChange={setSelectedTransactionType}>
                  <SelectTrigger id="transactionType">
                    <SelectValue placeholder="Choisir (vente/location)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Vente</SelectItem>
                    <SelectItem value="rent">Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Section Caractéristiques */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Caractéristiques</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="propertyType">Type de bien</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger id="propertyType">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Appartement</SelectItem>
                  <SelectItem value="house">Maison</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rooms">Nombre de pièces</Label>
              <Select value={rooms} onValueChange={setRooms}>
                <SelectTrigger id="rooms">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Studio</SelectItem>
                  <SelectItem value="2">2 pièces</SelectItem>
                  <SelectItem value="3">3 pièces</SelectItem>
                  <SelectItem value="4">4 pièces</SelectItem>
                  <SelectItem value="5">5+ pièces</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section Budget */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Budget</Label>
            <span className="text-sm text-gray-600">
              {priceRange[0].toLocaleString()}€ - {priceRange[1].toLocaleString()}€
            </span>
          </div>
          <Slider
            defaultValue={[0, 1000000]}
            max={1000000}
            step={10000}
            value={priceRange}
            onValueChange={setPriceRange}
            className="my-4"
          />
        </div>

        {/* Bouton de recherche */}
        <Button type="submit" className="w-full" disabled={isSearching}>
          {isSearching ? "Recherche en cours..." : "Lancer la recherche"}
        </Button>
      </div>
    </form>
  );
}