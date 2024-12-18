import { PropertiesList } from "@/components/PropertiesList";
import { SearchFilters, type SearchParams } from "@/components/SearchFilters";
import { useQueryClient } from "@tanstack/react-query";

export function SaleProperties() {
  const queryClient = useQueryClient();

  const handleSearch = (params: SearchParams) => {
    console.log('Search triggered in SaleProperties with params:', params);
    // Force React Query to refetch with new parameters
    queryClient.setQueryData(['searchParams'], params);
    queryClient.invalidateQueries({ 
      queryKey: [`/api/properties/transaction/sale`, params]
    });
    // Forcer un rafraîchissement immédiat
    queryClient.refetchQueries({
      queryKey: [`/api/properties/transaction/sale`, params]
    });
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Biens à vendre</h1>
          <SearchFilters 
            transactionType="sale" 
            onSearch={handleSearch}
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        <PropertiesList transactionType="sale" />
      </div>
    </div>
  );
}
