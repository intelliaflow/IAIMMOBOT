import { PropertiesList } from "@/components/PropertiesList";

export function RentProperties() {
  return (
    <div>
      <h1 className="text-2xl font-bold p-6">Biens à louer</h1>
      <PropertiesList transactionType="rent" />
    </div>
  );
}
