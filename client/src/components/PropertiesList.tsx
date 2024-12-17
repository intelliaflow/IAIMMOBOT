import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PropertyCard } from "@/components/PropertyCard";
import type { SearchParams } from "@/components/SearchFilters";

import type { Property } from "@db/schema";

interface PropertiesListProps {
  transactionType: 'sale' | 'rent';
}

export function PropertiesList({ transactionType }: PropertiesListProps) {
  const queryClient = useQueryClient();
  const searchParams = queryClient.getQueryData<SearchParams>(['searchParams']) || {};

  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: [`/api/properties/transaction/${transactionType}`, searchParams],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const urlParams = new URLSearchParams();
      
      if (params.location) urlParams.append('location', params.location);
      if (params.propertyType) urlParams.append('type', params.propertyType);
      if (params.rooms) urlParams.append('rooms', params.rooms);
      if (params.minPrice) urlParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice) urlParams.append('maxPrice', params.maxPrice.toString());

      const queryString = urlParams.toString();
      const url = `/api/properties/transaction/${transactionType}${queryString ? `?${queryString}` : ''}`;
      
      console.log(`Fetching properties with URL: ${url}`);
      console.log('Search params:', params);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Failed to fetch properties:', response.status, response.statusText);
        throw new Error('Failed to fetch properties');
      }
      
      const data = await response.json();
      console.log(`Received properties:`, data);
      return data;
    },
    enabled: true,
  });

  if (isLoading) {
    return <div className="text-center p-4">Chargement...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Une erreur est survenue lors du chargement des biens.</div>;
  }

  if (!properties?.length) {
    return <div className="text-center p-4">Aucun bien trouvé.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
