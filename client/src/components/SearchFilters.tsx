import { useState, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LocationSearch } from "./LocationSearch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { 
  Home,
  Euro,
  MapPin,
  Grid2X2,
  SlidersHorizontal,
  ChevronDown,
  Square
} from "lucide-react";

export interface SearchParams {
  location?: string;
  propertyType?: string;
  rooms?: string;
  minPrice?: number;
  maxPrice?: number;
  transactionType?: 'sale' | 'rent';
  surface?: number;
}

interface FilterButtonProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
}

interface SearchFiltersProps {
  transactionType?: 'sale' | 'rent';
  showTransactionTypeFilter?: boolean;
  maxPropertyPrice?: number;
  onSearch?: (params: SearchParams) => void;
}

const FilterButton = memo<FilterButtonProps>(({ icon: Icon, label, value, onClick }) => {
  return (
    <Button
      variant="outline"
      className="h-10 px-4 py-2 flex items-center gap-2 bg-white"
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
      {value && <span className="text-muted-foreground">: {value}</span>}
      <ChevronDown className="h-4 w-4 ml-1" />
    </Button>
  );
});

FilterButton.displayName = 'FilterButton';

export function SearchFilters({ 
  transactionType, 
  showTransactionTypeFilter = false, 
  maxPropertyPrice = 1000000,
  onSearch 
}: SearchFiltersProps) {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState<string>();
  const [rooms, setRooms] = useState<string>();
  const [selectedTransactionType, setSelectedTransactionType] = useState<'sale' | 'rent' | undefined>(transactionType);
  const [surface, setSurface] = useState<number>(); // Corrected type

  const getDefaultMaxPrice = useCallback(() => {
    if (maxPropertyPrice && maxPropertyPrice > 0) {
      return maxPropertyPrice;
    }
    return selectedTransactionType === 'rent' ? 5000 : 1000000;
  }, [selectedTransactionType, maxPropertyPrice]);

  const [priceRange, setPriceRange] = useState([0, getDefaultMaxPrice()]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const newMaxPrice = getDefaultMaxPrice();
    setPriceRange([0, newMaxPrice]);
  }, [selectedTransactionType, maxPropertyPrice, getDefaultMaxPrice]);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

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

    if (priceRange[1] < getDefaultMaxPrice()) {
      searchParams.maxPrice = priceRange[1];
    }

    if (selectedTransactionType || transactionType) {
      searchParams.transactionType = selectedTransactionType || transactionType;
    }

    if (surface !== undefined) { // Check if surface is defined
      searchParams.surface = surface;
    }

    if (onSearch) {
      setIsSearching(true);
      try {
        await Promise.all([
          queryClient.setQueryData(['searchParams'], searchParams),
          onSearch(searchParams)
        ]);

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
    }
  }, [location, propertyType, rooms, priceRange, selectedTransactionType, surface, transactionType, getDefaultMaxPrice, onSearch, queryClient, toast]);

  const handleReset = useCallback(() => {
    setLocation("");
    setPropertyType(undefined);
    setRooms(undefined);
    setPriceRange([0, getDefaultMaxPrice()]);
    setSelectedTransactionType(transactionType);
    setSurface(undefined);

    if (onSearch) {
      const resetParams: SearchParams = {};
      if (transactionType) {
        resetParams.transactionType = transactionType;
      }
      onSearch(resetParams);
    }
  }, [getDefaultMaxPrice, onSearch, transactionType]);

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="hidden md:flex gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <div>
              <FilterButton
                icon={MapPin}
                label="Localisation"
                value={location || "Toutes"}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-4">
            <LocationSearch
              value={location}
              onChange={setLocation}
              className="w-full"
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <div>
              <FilterButton
                icon={Euro}
                label="Budget"
                value={`${new Intl.NumberFormat('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  maximumFractionDigits: 0 
                }).format(priceRange[0])} - ${new Intl.NumberFormat('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  maximumFractionDigits: 0 
                }).format(priceRange[1])}`}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-4">
            <div className="space-y-4">
              <Slider
                defaultValue={[0, getDefaultMaxPrice()]}
                max={getDefaultMaxPrice()}
                step={100}
                value={priceRange}
                onValueChange={setPriceRange}
                className="mt-6"
                minStepsBetweenThumbs={5000}
              />
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <div>
              <FilterButton
                icon={Square}
                label="Surface"
                value={surface ? `${surface} m²` : undefined}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2">
            <Select value={surface} onValueChange={setSurface}>
              <SelectTrigger>
                <SelectValue placeholder="Surface" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={20}>20 m²</SelectItem>
                <SelectItem value={30}>30 m²</SelectItem>
                <SelectItem value={40}>40 m²</SelectItem>
                <SelectItem value={50}>50 m²</SelectItem>
                <SelectItem value={60}>60 m²</SelectItem>
                <SelectItem value={70}>70 m²</SelectItem>
                <SelectItem value={80}>80 m²</SelectItem>
                <SelectItem value={90}>90 m²</SelectItem>
                <SelectItem value={100}>100 m²</SelectItem>
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <div>
              <FilterButton
                icon={Home}
                label="Type de bien"
                value={propertyType === 'apartment' ? 'Appartement' : propertyType === 'house' ? 'Maison' : propertyType === 'villa' ? 'Villa' : undefined}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2">
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger>
                <SelectValue placeholder="Tous types de biens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Appartement</SelectItem>
                <SelectItem value="house">Maison</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <div>
              <FilterButton
                icon={Grid2X2}
                label="Pièces"
                value={rooms}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2">
            <Select value={rooms} onValueChange={setRooms}>
              <SelectTrigger>
                <SelectValue placeholder="Nombre de pièces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Studio/T1</SelectItem>
                <SelectItem value="2">2 pièces</SelectItem>
                <SelectItem value="3">3 pièces</SelectItem>
                <SelectItem value="4">4 pièces</SelectItem>
                <SelectItem value="5">5 pièces et +</SelectItem>
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <div>
              <FilterButton
                icon={SlidersHorizontal}
                label="+ de critères"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type de transaction</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={selectedTransactionType === 'sale' ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setSelectedTransactionType('sale')}
                  >
                    Vente
                  </Button>
                  <Button
                    type="button"
                    variant={selectedTransactionType === 'rent' ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setSelectedTransactionType('rent')}
                  >
                    Location
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button 
          type="submit"
          className="ml-2"
          disabled={isSearching}
        >
          {isSearching ? "Recherche..." : "Rechercher"}
        </Button>
      </form>

      {/* Version Mobile */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh]">
            <SheetHeader>
              <SheetTitle>Filtrer les biens</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSearch} className="mt-6 space-y-6">
              <LocationSearch
                value={location}
                onChange={setLocation}
                className="w-full"
              />

              <div className="space-y-4">
                <Label>Type de transaction</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={selectedTransactionType === 'sale' ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setSelectedTransactionType('sale')}
                  >
                    Vente
                  </Button>
                  <Button
                    type="button"
                    variant={selectedTransactionType === 'rent' ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setSelectedTransactionType('rent')}
                  >
                    Location
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Surface</Label>
                <Select value={surface} onValueChange={setSurface}>
                  <SelectTrigger>
                    <SelectValue placeholder="Surface" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={20}>20 m²</SelectItem>
                    <SelectItem value={30}>30 m²</SelectItem>
                    <SelectItem value={40}>40 m²</SelectItem>
                    <SelectItem value={50}>50 m²</SelectItem>
                    <SelectItem value={60}>60 m²</SelectItem>
                    <SelectItem value={70}>70 m²</SelectItem>
                    <SelectItem value={80}>80 m²</SelectItem>
                    <SelectItem value={90}>90 m²</SelectItem>
                    <SelectItem value={100}>100 m²</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSearching}
                >
                  {isSearching ? "Recherche..." : "Rechercher"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleReset}
                >
                  Réinitialiser
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}