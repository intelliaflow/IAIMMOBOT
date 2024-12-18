import { useState, useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import type { AddressFeature, AddressResponse } from "@/lib/types/address";
import { cn } from "@/lib/utils";

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
  const [inputValue, setInputValue] = useState(value || "");
  const [debouncedValue] = useDebounce(inputValue, 500);
  const [suggestions, setSuggestions] = useState<AddressFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedValue || debouncedValue.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      console.log("Recherche d'adresses pour:", debouncedValue);
      
      try {
        const encodedValue = encodeURIComponent(debouncedValue);
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodedValue}&limit=5&type=housenumber,street`;
        console.log("URL de l'API:", url);
        
        const response = await fetch(url);
        console.log("Statut de la réponse:", response.status);

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Données reçues:", data);
        
        if (data && Array.isArray(data)) {
          console.log("Format ancien - tableau direct");
          setSuggestions(data);
          setShowSuggestions(true);
        } else if (data.features && Array.isArray(data.features)) {
          console.log("Format nouveau - avec features");
          setSuggestions(data.features);
          setShowSuggestions(true);
        } else {
          console.warn("Format de données inattendu:", data);
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Erreur lors de la recherche d'adresses:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedValue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (feature: AddressFeature) => {
    const selectedValue = feature.properties.label;
    setInputValue(selectedValue);
    onChange(selectedValue);
    if (onLocationSelect) {
      onLocationSelect(feature);
    }
    setShowSuggestions(false);
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
    <div className={cn("flex gap-2", className)} ref={wrapperRef}>
      <div className="relative flex-1">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Rechercher une adresse..."
          className="w-full pr-8"
        />
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
            <ul className="py-1">
              {suggestions.map((feature, index) => {
                console.log("Affichage suggestion:", feature);
                const label = feature.properties?.label || feature.label || "Adresse inconnue";
                const postcode = feature.properties?.postcode || feature.postcode;
                const city = feature.properties?.city || feature.city;
                
                return (
                  <li
                    key={label + index}
                    onClick={() => handleSelect(feature)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  >
                    <MapPin className="mr-2 h-4 w-4 shrink-0 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      {(postcode || city) && (
                        <div className="text-xs text-gray-500">
                          {[postcode, city].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
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
