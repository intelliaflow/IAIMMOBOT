import { useState, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LocationSearch } from "./LocationSearch";
import { SlidersHorizontal, MapPin, Euro, Home, Grid2X2, Square, ChevronDown } from "lucide-react";

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

export function SearchFilters({ transactionType, showTransactionTypeFilter = false, maxPropertyPrice = 1000000, onSearch }: SearchFiltersProps) {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState<string>();
  const [rooms, setRooms] = useState<string>();
  const [selectedTransactionType, setSelectedTransactionType] = useState<'sale' | 'rent' | undefined>(transactionType);
  const [surface, setSurface] = useState<string>("");

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

    if (surface) {
      const surfaceValue = parseInt(surface, 10);
      if (!isNaN(surfaceValue) && surfaceValue > 0) {
        searchParams.surface = surfaceValue;
      }
    }

    if (onSearch) {
      setIsSearching(true);
      try {
        await Promise.all([
          queryClient.setQueryData(['searchParams'], searchParams),
          onSearch(searchParams)
        ]);

        toast({
          title: "Succès",
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
    setSurface("");

    if (onSearch) {
      const resetParams: SearchParams = {};
      if (transactionType) {
        resetParams.transactionType = transactionType;
      }
      onSearch(resetParams);
    }
  }, [getDefaultMaxPrice, onSearch, transactionType]);

  const handleSurfaceChange = (value: string) => {
    // N'accepte que les chiffres
    const numericValue = value.replace(/[^0-9]/g, '');
    setSurface(numericValue);
  };

  return (
    <div className="w-full space-y-4">
      {/* First row - Main filters */}
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
          <PopoverContent className="w-[200px] p-4">
            <div className="space-y-2">
              <Label>Surface minimale</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={surface}
                  onChange={(e) => handleSurfaceChange(e.target.value)}
                  placeholder="0"
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground">m²</span>
              </div>
            </div>
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
      </form>

      {/* Second row - Action buttons and more criteria */}
      <div className="hidden md:flex justify-center gap-4 items-center">
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
          onClick={handleSearch}
          className="px-8"
          disabled={isSearching}
        >
          {isSearching ? "Recherche..." : "Rechercher"}
        </Button>

        <Button
          variant="outline"
          onClick={handleReset}
          className="px-8"
        >
          Réinitialiser
        </Button>
      </div>

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
                <Label>Surface minimale</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={surface}
                    onChange={(e) => handleSurfaceChange(e.target.value)}
                    placeholder="0"
                    className="w-full"
                  />
                  <span className="text-sm text-muted-foreground">m²</span>
                </div>
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