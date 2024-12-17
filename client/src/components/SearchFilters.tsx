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
}

export interface SearchParams {
  location?: string;
  propertyType?: string;
  rooms?: string;
  minPrice?: number;
  maxPrice?: number;
  transactionType?: 'sale' | 'rent';
}

export function SearchFilters({ transactionType, showTransactionTypeFilter = false }: SearchFiltersProps) {
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
    updateSearchParams(params);
    queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    queryClient.invalidateQueries({ queryKey: ['/api/properties/agency'] });
    queryClient.invalidateQueries({ queryKey: ['/api/properties/transaction'] });
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
      
      // Update search params in cache and invalidate queries
      debouncedUpdate(searchParams);

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
    <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label>Localisation</Label>
          <Input 
            placeholder="Ville, code postal..." 
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              // Auto-update after 500ms of no typing
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
          />
        </div>
        <div>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger>
              <SelectValue placeholder="Type de bien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">Appartement</SelectItem>
              <SelectItem value="house">Maison</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={rooms} onValueChange={setRooms}>
            <SelectTrigger>
              <SelectValue placeholder="Nombre de pièces" />
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
        <div>
          {showTransactionTypeFilter && (
            <Select value={selectedTransactionType} onValueChange={setSelectedTransactionType}>
              <SelectTrigger>
                <SelectValue placeholder="Type de transaction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">Vente</SelectItem>
                <SelectItem value="rent">Location</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <Button type="submit" className="w-full" disabled={isSearching}>
            {isSearching ? "Recherche en cours..." : "Rechercher"}
          </Button>
        </div>
      </div>
      <div className="mt-4">
        <label className="text-sm text-gray-600 mb-2 block">
          Budget : {priceRange[0].toLocaleString()}€ - {priceRange[1].toLocaleString()}€
        </label>
        <Slider
          defaultValue={[0, 1000000]}
          max={1000000}
          step={10000}
          value={priceRange}
          onValueChange={setPriceRange}
        />
      </div>
    </form>
  );
}