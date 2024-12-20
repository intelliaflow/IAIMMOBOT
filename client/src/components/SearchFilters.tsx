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
import { MapPin, Euro, Home, Grid2X2, Square, ChevronDown } from "lucide-react";

export interface SearchParams {
  location?: string;
  propertyType?: string;
  rooms?: string;
  minPrice?: number;
  maxPrice?: number;
  transactionType?: 'sale' | 'rent';
  minSurface?: number;
  maxSurface?: number;
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
  const { toast } = useToast();

  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState<string>();
  const [rooms, setRooms] = useState<string>();
  const [selectedTransactionType, setSelectedTransactionType] = useState<'sale' | 'rent' | undefined>(transactionType);
  const [minSurface, setMinSurface] = useState("");
  const [maxSurface, setMaxSurface] = useState("");
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [isSearching, setIsSearching] = useState(false);

  const getDefaultMaxPrice = useCallback(() => {
    if (maxPropertyPrice && maxPropertyPrice > 0) {
      return maxPropertyPrice;
    }
    return selectedTransactionType === 'rent' ? 5000 : 1000000;
  }, [selectedTransactionType, maxPropertyPrice]);

  useEffect(() => {
    const newMaxPrice = getDefaultMaxPrice();
    setPriceRange([0, newMaxPrice]);
  }, [selectedTransactionType, maxPropertyPrice, getDefaultMaxPrice]);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const searchParams: SearchParams = {};

    // Ensure surface values are properly included
    if (minSurface) {
      const minSurfaceValue = parseInt(minSurface);
      if (!isNaN(minSurfaceValue)) {
        searchParams.minSurface = minSurfaceValue;
      }
    }

    if (maxSurface) {
      const maxSurfaceValue = parseInt(maxSurface);
      if (!isNaN(maxSurfaceValue)) {
        searchParams.maxSurface = maxSurfaceValue;
      }
    }

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

    if (minSurface) {
      const minSurfaceValue = parseInt(minSurface);
      if (!isNaN(minSurfaceValue)) {
        searchParams.minSurface = minSurfaceValue;
      }
    }

    if (maxSurface) {
      const maxSurfaceValue = parseInt(maxSurface);
      if (!isNaN(maxSurfaceValue)) {
        searchParams.maxSurface = maxSurfaceValue;
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
  }, [location, propertyType, rooms, priceRange, selectedTransactionType, minSurface, maxSurface, transactionType, getDefaultMaxPrice, onSearch, queryClient, toast]);

  const handleReset = useCallback(() => {
    setLocation("");
    setPropertyType(undefined);
    setRooms(undefined);
    setPriceRange([0, getDefaultMaxPrice()]);
    setSelectedTransactionType(transactionType);
    setMinSurface("");
    setMaxSurface("");

    if (onSearch) {
      const resetParams: SearchParams = {};
      if (transactionType) {
        resetParams.transactionType = transactionType;
      }
      onSearch(resetParams);
    }
  }, [getDefaultMaxPrice, onSearch, transactionType]);

  const [tempMinSurface, setTempMinSurface] = useState("");
  const [tempMaxSurface, setTempMaxSurface] = useState("");

  const handleSurfaceChange = (value: string, type: 'min' | 'max') => {
    if (type === 'min') {
      setTempMinSurface(value);
      setMinSurface(value);
    } else {
      setTempMaxSurface(value);
      setMaxSurface(value);
    }
  };

  const handleSurfaceApply = () => {
    closePopover();
  };

  const handleSurfaceCancel = () => {
    setTempMinSurface(minSurface);
    setTempMaxSurface(maxSurface);
    closePopover();
  };

  const closePopover = () => {
    const popover = document.querySelector('[data-state="open"]');
    if (popover) {
      const closeButton = popover.querySelector('[aria-label="Close"]');
      if (closeButton) {
        (closeButton as HTMLElement).click();
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* First row - Main filters */}
      <div className="hidden md:flex gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <div>
              <FilterButton
                icon={MapPin}
                label="Localisation"
                value={location || undefined}
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
              <Label>Budget</Label>
              <Slider
                defaultValue={[0, getDefaultMaxPrice()]}
                max={getDefaultMaxPrice()}
                step={100}
                value={priceRange}
                onValueChange={setPriceRange}
                className="mt-6"
                minStepsBetweenThumbs={5000}
              />
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setPriceRange([0, getDefaultMaxPrice()])}>
                  Annuler
                </Button>
                <Button onClick={() => { handleSearch(); }}>
                  Appliquer
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <div>
              <FilterButton
                icon={Square}
                label="Surface"
                value={minSurface || maxSurface ? `${minSurface || 0} - ${maxSurface || "∞"} m²` : undefined}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-4">
            <div className="space-y-4">
              <Label>Surface habitable</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={tempMinSurface}
                      onChange={(e) => handleSurfaceChange(e.target.value, 'min')}
                      placeholder="0"
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground">m²</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={tempMaxSurface}
                      onChange={(e) => handleSurfaceChange(e.target.value, 'max')}
                      placeholder="0"
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground">m²</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={handleSurfaceCancel}>
                  Annuler
                </Button>
                <Button onClick={handleSurfaceApply}>
                  Appliquer
                </Button>
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

        <Popover>
          <PopoverTrigger asChild>
            <div>
              <Button variant="outline" className="h-10 px-4 py-2 flex items-center gap-2 bg-white">
                Plus de critères
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-4">
            <div className="space-y-4">
              {showTransactionTypeFilter && (
                <div className="space-y-2">
                  <Label>Type de transaction</Label>
                  <Select value={selectedTransactionType} onValueChange={setSelectedTransactionType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type de transaction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Vente</SelectItem>
                      <SelectItem value="rent">Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Second row - Action buttons */}
      <div className="hidden md:flex justify-center gap-4 items-center">
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

      {/* Mobile version */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <span>Filtrer</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh]">
            <SheetHeader>
              <SheetTitle>Filtres</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <LocationSearch
                value={location}
                onChange={setLocation}
                className="w-full"
              />

              <div className="space-y-4">
                <Label>Surface minimale</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={minSurface}
                    onChange={(e) => handleSurfaceChange(e.target.value, 'min')}
                    placeholder="0"
                    className="w-full"
                  />
                  <span className="text-sm text-muted-foreground">m²</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Surface maximale</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={maxSurface}
                    onChange={(e) => handleSurfaceChange(e.target.value, 'max')}
                    placeholder="0"
                    className="w-full"
                  />
                  <span className="text-sm text-muted-foreground">m²</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={handleSearch}
                  className="w-full"
                  disabled={isSearching}
                >
                  {isSearching ? "Recherche..." : "Rechercher"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-full"
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}