import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AddressFeature, AddressResponse } from "@/lib/types/address";

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  onLocationSelect?: (feature: AddressFeature) => void;
}

export function LocationSearch({ 
  value, 
  onChange, 
  className,
  onLocationSelect 
}: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [debouncedValue] = useDebounce(inputValue, 500);
  const [suggestions, setSuggestions] = useState<AddressFeature[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedValue || debouncedValue.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const encodedValue = encodeURIComponent(debouncedValue);
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodedValue}&limit=5&type=housenumber,street`
        );

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data: AddressResponse = await response.json();
        setSuggestions(data.features || []);
      } catch (error) {
        console.error("Erreur lors de la recherche d'adresses:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedValue]);

  const handleSelect = (feature: AddressFeature) => {
    const selectedValue = feature.properties.label;
    setInputValue(selectedValue);
    onChange(selectedValue);
    if (onLocationSelect) {
      onLocationSelect(feature);
    }
    setOpen(false);
  };

  const handleGeolocation = () => {
    if (!("geolocation" in navigator)) {
      console.warn("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}`
          );

          if (!response.ok) {
            throw new Error("Erreur lors de la géolocalisation inverse");
          }

          const data: AddressResponse = await response.json();
          if (data.features && data.features.length > 0) {
            handleSelect(data.features[0]);
          }
        } catch (error) {
          console.error("Erreur lors de la géolocalisation:", error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error);
        setLoading(false);
      }
    );
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover 
        open={open} 
        onOpenChange={(isOpen) => {
          // Ne pas fermer le Popover si l'input a le focus
          if (!isOpen && document.activeElement === document.querySelector('input')) {
            return;
          }
          setOpen(isOpen);
        }}
      >
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Rechercher une adresse..."
              className="w-full pr-8"
            />
            {loading && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandList>
              {suggestions.length === 0 ? (
                <CommandEmpty>Aucune suggestion trouvée</CommandEmpty>
              ) : (
                <CommandGroup>
                  {suggestions.map((feature) => (
                    <CommandItem
                      key={feature.properties.label}
                      value={feature.properties.label}
                      onSelect={() => handleSelect(feature)}
                    >
                      <MapPin className="mr-2 h-4 w-4 shrink-0" />
                      <div className="flex flex-col">
                        <span>{feature.properties.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {feature.properties.postcode}, {feature.properties.city}
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
      <Button
        variant="outline"
        size="icon"
        onClick={handleGeolocation}
        disabled={loading}
        title="Utiliser ma position"
      >
        <MapPin className="h-4 w-4" />
      </Button>
    </div>
  );
}
