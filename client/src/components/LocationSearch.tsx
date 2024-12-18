import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface LocationSuggestion {
  city: string;
  postcode: string;
  country: string;
}

export function LocationSearch({ value, onChange, className }: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [debouncedValue] = useDebounce(inputValue, 500);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);

  useEffect(() => {
    if (debouncedValue.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        // Simulation d'appel API - À remplacer par une vraie API de géocodage
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockSuggestions: LocationSuggestion[] = [
          { city: `${debouncedValue} - Centre`, postcode: "75001", country: "France" },
          { city: `${debouncedValue} - Nord`, postcode: "75002", country: "France" },
          { city: `${debouncedValue} - Sud`, postcode: "75003", country: "France" },
        ];
        setSuggestions(mockSuggestions);
      } catch (error) {
        console.error("Erreur lors de la recherche de suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedValue]);

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position);
          // Ici, vous pouvez faire un appel à une API de géocodage inverse
          // pour obtenir l'adresse à partir des coordonnées
          setInputValue("Ma position actuelle");
          onChange("Ma position actuelle");
          setOpen(false);
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
        }
      );
    }
  };

  return (
    <div className="w-full space-y-2">
      <Label htmlFor="location" className="text-lg font-semibold">
        Où souhaitez-vous chercher ?
      </Label>
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                id="location"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setOpen(true);
                }}
                className={`w-full h-12 text-lg pl-4 pr-10 border-2 focus:border-primary ${className}`}
                placeholder="Ville, code postal ou quartier"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={getCurrentLocation}
              >
                <MapPin className="h-5 w-5" />
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandList>
                {loading ? (
                  <CommandEmpty>
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    <span className="text-sm text-muted-foreground">
                      Recherche en cours...
                    </span>
                  </CommandEmpty>
                ) : suggestions.length === 0 ? (
                  <CommandEmpty>Aucune suggestion trouvée</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {suggestions.map((suggestion, index) => (
                      <CommandItem
                        key={index}
                        value={suggestion.city}
                        onSelect={(value) => {
                          setInputValue(value);
                          onChange(value);
                          setOpen(false);
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        <div className="flex flex-col">
                          <span>{suggestion.city}</span>
                          <span className="text-sm text-muted-foreground">
                            {suggestion.postcode}, {suggestion.country}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}