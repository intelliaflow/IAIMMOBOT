import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "@/components/PropertyCard";

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: string;
  transactionType: string;
  features: string[] | null;
  images: string[] | null;
  agencyId: number | null;
  createdAt: Date | null;
}

interface PropertiesListProps {
  transactionType: 'sale' | 'rent';
}

export function PropertiesList({ transactionType }: PropertiesListProps) {
  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: [`/api/properties/transaction/${transactionType}`],
    queryFn: async () => {
      console.log(`Fetching properties for transaction type: ${transactionType}`);
      const response = await fetch(`/api/properties/transaction/${transactionType}`);
      if (!response.ok) {
        console.error('Failed to fetch properties:', response.status, response.statusText);
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      console.log(`Received properties:`, data);
      return data;
    }
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
