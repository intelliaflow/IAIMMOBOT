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
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchParams.location) params.append('location', searchParams.location);
      if (searchParams.propertyType) params.append('type', searchParams.propertyType);
      if (searchParams.rooms) params.append('rooms', searchParams.rooms);
      if (searchParams.minPrice) params.append('minPrice', searchParams.minPrice.toString());
      if (searchParams.maxPrice) params.append('maxPrice', searchParams.maxPrice.toString());

      const queryString = params.toString();
      const url = `/api/properties/transaction/${transactionType}${queryString ? `?${queryString}` : ''}`;
      
      console.log(`Fetching properties with URL: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Failed to fetch properties:', response.status, response.statusText);
        throw new Error('Failed to fetch properties');
      }
      
      const data = await response.json();
      console.log(`Received properties:`, data);
      return data;
    },
    staleTime: 0, // Always consider the data stale
    refetchOnMount: true // Refetch when the component mounts
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
