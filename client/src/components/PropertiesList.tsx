import { useEffect } from "react";
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
      const urlParams = new URLSearchParams();
      const currentParams = queryClient.getQueryData<SearchParams>(['searchParams']) || {};
      
      if (currentParams.location) urlParams.append('location', currentParams.location);
      if (currentParams.propertyType) urlParams.append('type', currentParams.propertyType);
      if (currentParams.rooms) urlParams.append('rooms', currentParams.rooms);
      if (currentParams.minPrice) urlParams.append('minPrice', currentParams.minPrice.toString());
      if (currentParams.maxPrice) urlParams.append('maxPrice', currentParams.maxPrice.toString());

      const queryString = urlParams.toString();
      const url = `/api/properties/transaction/${transactionType}${queryString ? `?${queryString}` : ''}`;
      
      console.log(`Fetching properties with URL: ${url}`);
      console.log('Search params:', currentParams);
      
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
    staleTime: 0, // Toujours refetch quand les paramètres changent
  });

  // Réinitialiser les paramètres de recherche lors du montage du composant
  useEffect(() => {
    queryClient.setQueryData(['searchParams'], {});
  }, [transactionType]); // Se déclenche quand on change de page

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
