import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PropertyCard } from "@/components/PropertyCard";
import { SearchFilters } from "@/components/SearchFilters";
import type { Property } from "@db/schema";
import type { SearchParams } from "@/components/SearchFilters";

export function Home() {
  const queryClient = useQueryClient();
  const searchParams = queryClient.getQueryData<SearchParams>(['searchParams']) || {};

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties", searchParams],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const urlParams = new URLSearchParams();
      
      if (params?.location) urlParams.append('location', params.location);
      if (params?.propertyType) urlParams.append('type', params.propertyType);
      if (params?.rooms) urlParams.append('rooms', params.rooms);
      if (params?.minPrice) urlParams.append('minPrice', params.minPrice.toString());
      if (params?.maxPrice) urlParams.append('maxPrice', params.maxPrice.toString());
      if (params?.transactionType) urlParams.append('transactionType', params.transactionType);

      const queryString = urlParams.toString();
      const url = `/api/properties${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching properties with URL:', url);
      console.log('Search params:', params);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      
      const data = await response.json();
      console.log('Received properties:', data);
      return data;
    },
    enabled: true,
    staleTime: 0, // Always refetch when params change
  });

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
              onSearch={(params) => {
                queryClient.setQueryData(['searchParams'], params);
                queryClient.invalidateQueries({ 
                  queryKey: ['/api/properties', params]
                });
              }}
            />
          </div>
        </div>
      </section>

      {/* Latest Properties Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Dernières annonces
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties?.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
