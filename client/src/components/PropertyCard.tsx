import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square } from "lucide-react";
import { Link } from "wouter";
import type { Property } from "@db/schema";
import { formatAddress } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link href={`/property/${property.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <div className="aspect-[16/9] relative overflow-hidden rounded-t-lg">
          {property.images && property.images[0] ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">Aucune image</span>
            </div>
          )}
          <Badge className="absolute top-2 right-2">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(property.price)}
          </Badge>
        </div>
        <CardContent className="pt-4">
          <h3 className="text-lg font-semibold mb-2">{property.title}</h3>
          <p className="text-sm text-gray-500 mb-2">
            {formatAddress(property.location, false)}
          </p>
          <div className="flex gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              <span>{property.area} m²</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-gray-500">
          {property.createdAt ? new Date(property.createdAt).toLocaleDateString('fr-FR') : 'Date non disponible'}
        </CardFooter>
      </Card>
    </Link>
  );
}
