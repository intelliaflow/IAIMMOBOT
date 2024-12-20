
import { useState, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import debounce from 'lodash/debounce';
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

const FilterButton = memo<FilterButtonProps>(({ icon: Icon, label, value, onClick }) => (
  <Button
    variant="outline"
    className="h-10 px-4 py-2 flex items-center gap-2 bg-white hover:bg-gray-50"
    onClick={onClick}
  >
    <Icon className="h-4 w-4" />
    <span className="font-medium">{label}</span>
    {value && <span className="text-muted-foreground">: {value}</span>}
    <ChevronDown className="h-4 w-4 ml-1" />
  </Button>
));

FilterButton.displayName = 'FilterButton';

export function SearchFilters({ transactionType, showTransactionTypeFilter = false, maxPropertyPrice = 1000000, onSearch }: SearchFiltersProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // État local pour les filtres
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState<string>();
  const [rooms, setRooms] = useState<string>();
  const [selectedTransactionType, setSelectedTransactionType] = useState<'sale' | 'rent' | undefined>(transactionType);
  const [minSurface, setMinSurface] = useState("");
  const [maxSurface, setMaxSurface] = useState("");
  const [priceRange, setPriceRange] = useState([0, maxPropertyPrice]);
  
  // États temporaires pour le mode édition
  const [tempMinSurface, setTempMinSurface] = useState("");
  const [tempMaxSurface, setTempMaxSurface] = useState("");
  const [tempPriceRange, setTempPriceRange] = useState(priceRange);

  const handleSearch = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
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

    if (selectedTransactionType || transactionType) {
      searchParams.transactionType = selectedTransactionType || transactionType;
    }

    // Validation des surfaces
    if (minSurface) {
      const minSurfaceNum = parseInt(minSurface);
      if (!isNaN(minSurfaceNum) && minSurfaceNum > 0) {
        searchParams.minSurface = minSurfaceNum;
      }
    }

    if (maxSurface) {
      const maxSurfaceNum = parseInt(maxSurface);
      if (!isNaN(maxSurfaceNum) && maxSurfaceNum > 0) {
        searchParams.maxSurface = maxSurfaceNum;
      }
    }

    // Validation des prix
    if (priceRange[0] > 0) {
      searchParams.minPrice = priceRange[0];
    }
    if (priceRange[1] < maxPropertyPrice) {
      searchParams.maxPrice = priceRange[1];
    }

    try {
      if (onSearch) {
        await onSearch(searchParams);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la recherche",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [location, propertyType, rooms, selectedTransactionType, minSurface, maxSurface, priceRange, transactionType, maxPropertyPrice, onSearch, isLoading, toast]);

  // Gestion de la surface
  const handleSurfaceChange = (value: string, type: 'min' | 'max') => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (type === 'min') {
      setTempMinSurface(numericValue);
    } else {
      setTempMaxSurface(numericValue);
    }
  };

  const handleSurfaceApply = () => {
    setMinSurface(tempMinSurface);
    setMaxSurface(tempMaxSurface);
  };

  // Reset des filtres
  const handleReset = useCallback(() => {
    // Réinitialisation des valeurs principales
    setLocation("");
    setPropertyType(undefined);
    setRooms(undefined);
    setPriceRange([0, maxPropertyPrice]);
    setSelectedTransactionType(transactionType);
    
    // Réinitialisation des surfaces
    setMinSurface("");
    setMaxSurface("");
    setTempMinSurface("");
    setTempMaxSurface("");
    
    // Réinitialisation des prix
    setTempPriceRange([0, maxPropertyPrice]);
    setPriceRange([0, maxPropertyPrice]);
    
    // Force la mise à jour de l'interface
    queryClient.setQueryData(['searchParams'], {});
  }, [maxPropertyPrice, transactionType, queryClient]);

  const debouncedSearch = useCallback(
    debounce(() => {
      handleSearch();
    }, 500),
    [handleSearch]
  );

  return (
    <div className="w-full space-y-4">
      <div className="hidden md:flex gap-2 items-center flex-wrap">
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

        {showTransactionTypeFilter && (
          <Select value={selectedTransactionType} onValueChange={(value: 'sale' | 'rent') => setSelectedTransactionType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type de transaction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">Vente</SelectItem>
              <SelectItem value="rent">Location</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type de bien" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="house">Maison</SelectItem>
            <SelectItem value="apartment">Appartement</SelectItem>
            <SelectItem value="land">Terrain</SelectItem>
            <SelectItem value="commercial">Local commercial</SelectItem>
          </SelectContent>
        </Select>

        <Select value={rooms} onValueChange={setRooms}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Nombre de pièces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 pièce</SelectItem>
            <SelectItem value="2">2 pièces</SelectItem>
            <SelectItem value="3">3 pièces</SelectItem>
            <SelectItem value="4">4 pièces</SelectItem>
            <SelectItem value="5">5 pièces et +</SelectItem>
          </SelectContent>
        </Select>

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
                defaultValue={[0, maxPropertyPrice]}
                max={maxPropertyPrice}
                step={1000}
                value={tempPriceRange}
                onValueChange={setTempPriceRange}
                className="mt-6"
                minStepsBetweenThumbs={1000}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(tempPriceRange[0])}</span>
                <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(tempPriceRange[1])}</span>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setTempPriceRange([0, maxPropertyPrice])}>
                  Annuler
                </Button>
                <Button onClick={() => {
                  setPriceRange(tempPriceRange);
                  handleSearch();
                }}>
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
                <Button variant="outline" onClick={() => {
                  setTempMinSurface(minSurface);
                  setTempMaxSurface(maxSurface);
                }}>
                  Annuler
                </Button>
                <Button onClick={() => {
                  handleSurfaceApply();
                  handleSearch();
                }}>
                  Appliquer
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button 
          onClick={handleSearch}
          className="px-8"
          disabled={isLoading}
        >
          {isLoading ? "Recherche..." : "Rechercher"}
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            handleReset();
            handleSearch();
          }}
          className="px-8"
        >
          Réinitialiser
        </Button>
      </div>

      {/* Version mobile */}
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
            <div className="mt-6 space-y-6 overflow-y-auto">
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

              <div className="grid grid-cols-2 gap-4 sticky bottom-0 bg-white p-4">
                <Button 
                  onClick={() => {
                    handleSearch();
                  }}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Recherche..." : "Rechercher"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleReset();
                    handleSearch();
                  }}
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
