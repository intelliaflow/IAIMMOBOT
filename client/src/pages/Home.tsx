import { useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PropertyCard } from "@/components/PropertyCard";
import { PriceMap } from "@/components/PriceMap";
import { SearchFilters } from "@/components/SearchFilters";
import type { Property } from "@db/schema";
import type { SearchParams } from "@/components/SearchFilters";

export function Home() {
  const queryClient = useQueryClient();
  const searchParams = queryClient.getQueryData<SearchParams>(['searchParams']) || {};

  useEffect(() => {
    queryClient.setQueryData(['searchParams'], {});
  }, []); // Se déclenche uniquement au montage

  const queryKey = useMemo(() => ["/api/properties", searchParams], [searchParams]);

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey,
    queryFn: async () => {
      const urlParams = new URLSearchParams();

      if (searchParams.location) urlParams.append('location', searchParams.location);
      if (searchParams.propertyType) urlParams.append('type', searchParams.propertyType);
      if (searchParams.rooms) urlParams.append('rooms', searchParams.rooms);
      if (searchParams.minPrice) urlParams.append('minPrice', searchParams.minPrice.toString());
      if (searchParams.maxPrice) urlParams.append('maxPrice', searchParams.maxPrice.toString());
      if (searchParams.transactionType) urlParams.append('transactionType', searchParams.transactionType);
      if (searchParams.minSurface) urlParams.append('minSurface', searchParams.minSurface.toString());
      if (searchParams.maxSurface) urlParams.append('maxSurface', searchParams.maxSurface.toString());

      const queryString = urlParams.toString();
      const url = `/api/properties${queryString ? `?${queryString}` : ''}`;

      console.log('Fetching properties with URL:', url); // Debug log

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      return response.json();
    },
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const maxPropertyPrice = useMemo(() => {
    if (!properties.length) return undefined;
    return Math.max(...properties.map(p => p.price));
  }, [properties]);

  const handleSearch = useCallback((params: SearchParams) => {
    console.log('Search params:', params); // Debug log
    queryClient.setQueryData(['searchParams'], params);
  }, [queryClient]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/10 to-primary/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Trouvez votre bien immobilier idéal
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Des milliers de biens à vendre et à louer partout en France
            </p>
          </div>
          <div className="mt-10">
            <SearchFilters 
              showTransactionTypeFilter={true}
              maxPropertyPrice={maxPropertyPrice}
              onSearch={handleSearch}
            />
          </div>
        </div>
      </section>

      {/* Latest Properties Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {properties.length > 0 ? 'Résultats de votre recherche' : 'Dernières annonces'}
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
              {properties.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-12">
                  <p className="text-lg text-gray-500">
                    Aucun bien ne correspond à vos critères de recherche
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}