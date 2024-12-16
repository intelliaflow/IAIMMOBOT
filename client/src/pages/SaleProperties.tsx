import { PropertiesList } from "@/components/PropertiesList";

export function SaleProperties() {
  return (
    <div>
      <h1 className="text-2xl font-bold p-6">Biens à vendre</h1>
      <PropertiesList transactionType="sale" />
    </div>
  );
}
