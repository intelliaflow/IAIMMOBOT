import { PropertiesList } from "@/components/PropertiesList";
import { SearchFilters, type SearchParams } from "@/components/SearchFilters";
import { useQueryClient } from "@tanstack/react-query";

export function RentProperties() {
  const queryClient = useQueryClient();

  const handleSearch = (params: SearchParams) => {
    console.log('Search triggered in RentProperties with params:', params);
    queryClient.setQueryData(['searchParams'], params);
    queryClient.invalidateQueries({ 
      queryKey: [`/api/properties/transaction/rent`, params],
      exact: true
    });
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Biens à louer</h1>
          <SearchFilters 
            transactionType="rent" 
            onSearch={handleSearch}
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        <PropertiesList transactionType="rent" />
      </div>
    </div>
  );
}
