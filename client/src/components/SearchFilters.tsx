import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  // Store search params in query client cache
  const updateSearchParams = (params: SearchParams) => {
    queryClient.setQueryData(['searchParams'], params);
  };

  // Update function for search parameters
  const updateSearch = (params: SearchParams) => {
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
        transactionType: selectedTransactionType || transactionType
      };

      console.log('Searching with params:', searchParams);
      
      // Mettre à jour les paramètres de recherche
      queryClient.setQueryData(['searchParams'], searchParams);
      
      if (onSearch) {
        // Si onSearch est fourni, laisser le composant parent gérer la recherche
        onSearch(searchParams);
      } else {
        // Sur la page d'accueil
        await queryClient.invalidateQueries({ 
          queryKey: ['/api/properties']
        });
        await queryClient.refetchQueries({ 
          queryKey: ['/api/properties']
        });
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la recherche",
        variant: "destructive",
      });
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
                    updateSearch({
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