import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useQueryClient } from "@tanstack/react-query";

interface SearchFiltersProps {
  transactionType?: 'sale' | 'rent';
}

export interface SearchParams {
  location?: string;
  propertyType?: string;
  rooms?: string;
  minPrice?: number;
  maxPrice?: number;
  transactionType?: 'sale' | 'rent';
}

export function SearchFilters({ transactionType }: SearchFiltersProps) {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState<string>();
  const [rooms, setRooms] = useState<string>();
  const [priceRange, setPriceRange] = useState([0, 1000000]);

  const handleSearch = () => {
    const searchParams: SearchParams = {
      location: location || undefined,
      propertyType,
      rooms,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      transactionType
    };

    // Store search params in query client state
    queryClient.setQueryData(['searchParams'], searchParams);

    // Invalidate and immediately refetch with new search params
    queryClient.invalidateQueries({
      queryKey: transactionType 
        ? [`/api/properties/transaction/${transactionType}`] 
        : ['/api/properties']
    }).then(() => {
      // Force an immediate refetch
      queryClient.refetchQueries({
        queryKey: transactionType 
          ? [`/api/properties/transaction/${transactionType}`] 
          : ['/api/properties']
      });
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Input 
            placeholder="Où ? Ville, code postal..." 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
          <Button className="w-full" onClick={handleSearch}>
            Rechercher
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
    </div>
  );
}
