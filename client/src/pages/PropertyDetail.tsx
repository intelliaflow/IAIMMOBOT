import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bed, Bath, Square, MapPin, Phone, Mail } from "lucide-react";
import type { Property } from "@db/schema";

export function PropertyDetail() {
  const { id } = useParams();
  const { data: property, isLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${id}`],
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="aspect-[16/9] relative overflow-hidden rounded-lg mb-8">
            {property.images && property.images[0] ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Aucune image disponible</span>
              </div>
            )}
          </div>
          
          <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
          <div className="flex items-center text-gray-600 mb-6">
            <MapPin className="h-5 w-5 mr-2" />
            <span>{property.location}</span>
          </div>

          <div className="flex gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              <span>{property.bedrooms} chambres</span>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="h-5 w-5" />
              <span>{property.bathrooms} sdb</span>
            </div>
            <div className="flex items-center gap-2">
              <Square className="h-5 w-5" />
              <span>{property.area} m²</span>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-4">Description</h2>
          <p className="text-gray-600 whitespace-pre-line mb-8">
            {property.description}
          </p>

          {property.features && property.features.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold mb-4">Caractéristiques</h2>
              <ul className="grid grid-cols-2 gap-4 mb-8">
                {property.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-600">
                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold mb-6">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(property.price)}
              </div>
              
              <div className="space-y-4">
                <Button className="w-full" size="lg">
                  <Phone className="h-4 w-4 mr-2" />
                  Appeler
                </Button>
                <Button className="w-full" variant="outline" size="lg">
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer un message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
