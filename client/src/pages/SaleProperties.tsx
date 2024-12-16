import { PropertiesList } from "@/components/PropertiesList";

export function SaleProperties() {
  return (
    <div>
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Biens à vendre</h1>
          <SearchFilters />
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        <PropertiesList transactionType="sale" />
      </div>
    </div>
  );
}
