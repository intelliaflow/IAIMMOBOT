import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, Pencil } from "lucide-react";
import { SearchFilters } from "@/components/SearchFilters";
import { PropertyForm } from "@/components/PropertyForm";
import { GeocodeButton } from "@/components/GeocodeButton";
import type { Property } from "@db/schema";
import type { SearchParams } from "@/components/SearchFilters";

interface ExtendedSearchParams extends SearchParams {
  location?: string;
  propertyType?: string;
  rooms?: string;
  minPrice?: number;
  maxPrice?: number;
  transactionType?: 'sale' | 'rent';
}

export function AgencyDashboard() {
  const queryClient = useQueryClient();
  const [currentSearchParams, setCurrentSearchParams] = useState<ExtendedSearchParams>({
    location: undefined,
    propertyType: undefined,
    rooms: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    transactionType: undefined
  });
  
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties/agency", currentSearchParams],
    queryFn: async ({ queryKey }) => {
      const [_, searchParams] = queryKey;
      const params = new URLSearchParams();
      
      if (searchParams?.location) params.append('location', searchParams.location);
      if (searchParams?.propertyType) params.append('type', searchParams.propertyType);
      if (searchParams?.rooms) params.append('rooms', searchParams.rooms);
      if (searchParams?.minPrice) params.append('minPrice', searchParams.minPrice.toString());
      if (searchParams?.maxPrice) params.append('maxPrice', searchParams.maxPrice.toString());
      if (searchParams?.transactionType) params.append('transactionType', searchParams.transactionType);

      const queryString = params.toString();
      const url = `/api/properties/agency${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching agency properties with URL:', url);
      console.log('Current search params:', searchParams);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      console.log('Received agency properties:', data);
      return data;
    },
    enabled: true,
    staleTime: 1000,
    gcTime: 5 * 60 * 1000,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setIsPropertyFormOpen(true);
  };

  const handleCreateProperty = () => {
    setSelectedProperty(null);
    setIsPropertyFormOpen(true);
  };

  const handlePropertyFormSuccess = () => {
    setIsPropertyFormOpen(false);
    setSelectedProperty(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <div className="flex gap-4">
          <GeocodeButton />
          <Dialog open={isPropertyFormOpen} onOpenChange={setIsPropertyFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateProperty}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle annonce
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedProperty ? "Modifier l'annonce" : "Créer une nouvelle annonce"}
                </DialogTitle>
              </DialogHeader>
              <PropertyForm 
                property={selectedProperty} 
                onSuccess={handlePropertyFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="properties">
        <TabsList className="mb-8">
          <TabsTrigger value="properties">Annonces</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="properties">
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <SearchFilters 
                showTransactionTypeFilter={true}
                onSearch={(params) => {
                  console.log('Search filters updated:', params);
                  setCurrentSearchParams(params as ExtendedSearchParams);
                  queryClient.invalidateQueries({ 
                    queryKey: ["/api/properties/agency", params],
                    exact: true
                  });
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties?.map((property) => (
                <Card key={property.id}>
                  <div className="aspect-[16/9] relative overflow-hidden">
                    {property.images && property.images[0] && (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="object-cover w-full h-full rounded-t-lg"
                      />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{property.title}</h3>
                      <span className="text-sm font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                        {property.transactionType === 'sale' ? 'Vente' : 'Location'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{property.location}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(property.price)}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditProperty(property)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="document">Ajouter un document</Label>
                  <div className="mt-2">
                    <Input
                      id="document"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                
                <Button disabled={!selectedFile}>
                  <Upload className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Documents récents</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      Aucun document téléchargé
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
