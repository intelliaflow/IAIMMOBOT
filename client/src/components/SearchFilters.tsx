import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LocationSearch } from "./LocationSearch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";

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

  // Fonction de recherche simplifiée
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    try {
      // Construction des paramètres de recherche
      const searchParams: SearchParams = {};
      
      if (location?.trim()) {
        searchParams.location = location.trim();
      }
      
      if (propertyType) {
        searchParams.propertyType = propertyType;
      }
      
      if (rooms) {
        searchParams.rooms = rooms;
      }
      
      if (priceRange[0] > 0) {
        searchParams.minPrice = priceRange[0];
      }
      
      if (priceRange[1] < 1000000) {
        searchParams.maxPrice = priceRange[1];
      }
      
      if (selectedTransactionType || transactionType) {
        searchParams.transactionType = selectedTransactionType || transactionType;
      }

      console.log('Recherche avec les paramètres:', searchParams);
      
      // Mise à jour du cache et déclenchement de la recherche
      queryClient.setQueryData(['searchParams'], searchParams);
      
      if (onSearch) {
        onSearch(searchParams);
      } else {
        // Invalider la requête actuelle et forcer un nouveau fetch
        await queryClient.invalidateQueries({ 
          queryKey: ['/api/properties']
        });
        
        // Attendre que la nouvelle requête soit terminée
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await queryClient.refetchQueries({
          queryKey: ['/api/properties', searchParams],
          exact: true
        });
      }

      toast({
        title: "Recherche effectuée",
        description: "Les résultats ont été mis à jour",
      });
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

  const FilterForm = useCallback(() => (
    <form onSubmit={handleSearch}>
      <div className="space-y-8">
        {/* Section Localisation avec auto-complétion */}
        <LocationSearch
          value={location}
          onChange={setLocation}
          className="w-full"
        />

          {/* Type de transaction - Plus visible si activé */}
          {showTransactionTypeFilter && (
            <div className="space-y-2">
              <Label htmlFor="transactionType" className="text-lg font-semibold">
                Type de transaction
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={selectedTransactionType === 'sale' ? 'default' : 'outline'}
                  className="w-full h-12 text-lg"
                  onClick={() => setSelectedTransactionType('sale')}
                >
                  Acheter
                </Button>
                <Button
                  type="button"
                  variant={selectedTransactionType === 'rent' ? 'default' : 'outline'}
                  className="w-full h-12 text-lg"
                  onClick={() => setSelectedTransactionType('rent')}
                >
                  Louer
                </Button>
              </div>
            </div>
          )}

          {/* Filtres principaux - Réorganisés et simplifiés */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Type de bien */}
            <div className="space-y-2">
              <Label htmlFor="propertyType" className="text-base font-medium">
                Type de bien
              </Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger id="propertyType" className="h-12">
                  <SelectValue placeholder="Tous types de biens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Appartement</SelectItem>
                  <SelectItem value="house">Maison</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nombre de pièces */}
            <div className="space-y-2">
              <Label htmlFor="rooms" className="text-base font-medium">
                Nombre de pièces
              </Label>
              <Select value={rooms} onValueChange={setRooms}>
                <SelectTrigger id="rooms" className="h-12">
                  <SelectValue placeholder="Toutes tailles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Studio/T1</SelectItem>
                  <SelectItem value="2">2 pièces</SelectItem>
                  <SelectItem value="3">3 pièces</SelectItem>
                  <SelectItem value="4">4 pièces</SelectItem>
                  <SelectItem value="5">5 pièces et +</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Budget - Interface améliorée */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Budget</Label>
              <span className="text-base font-medium text-primary">
                {priceRange[0].toLocaleString()}€ - {priceRange[1].toLocaleString()}€
              </span>
            </div>
            <Slider
              defaultValue={[0, 1000000]}
              max={1000000}
              step={10000}
              value={priceRange}
              onValueChange={setPriceRange}
              className="mt-6"
            />
          </div>

          {/* Bouton de recherche - Plus visible et réactif */}
          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-semibold mt-6" 
            disabled={isSearching}
          >
            {isSearching ? (
              <div className="flex items-center justify-center">
                <span className="mr-2">Recherche en cours</span>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            ) : (
              "Rechercher"
            )}
          </Button>
        </div>
      </form>
  ), [
    handleSearch,
    isSearching,
    location,
    setLocation,
    priceRange,
    setPriceRange,
    propertyType,
    setPropertyType,
    rooms,
    setRooms,
    selectedTransactionType,
    setSelectedTransactionType,
    showTransactionTypeFilter,
  ]);

  return (
    <>
      {/* Version Desktop */}
      <form onSubmit={handleSearch} className="hidden md:block bg-white p-6 rounded-lg shadow-md">
        <FilterForm />
      </form>

      {/* Version Mobile */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh]">
            <SheetHeader>
              <SheetTitle>Filtrer les biens</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSearch} className="mt-6">
              <FilterForm />
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}