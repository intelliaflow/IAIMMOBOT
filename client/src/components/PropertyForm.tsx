import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Property } from "@db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

const propertySchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  location: z.string().min(1, "La localisation est requise"),
  bedrooms: z.coerce.number().min(0, "Le nombre de chambres doit être positif"),
  bathrooms: z.coerce.number().min(0, "Le nombre de salles de bain doit être positif"),
  area: z.coerce.number().min(0, "La surface doit être positive"),
  type: z.string().min(1, "Le type de bien est requis"),
  transactionType: z.string().min(1, "Le type de transaction est requis"),
  features: z.array(z.string()).default([]),
  images: z.array(z.string()).nullable().default(null),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  property?: Partial<Property>;
  onSuccess?: () => void;
}

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const defaultFeatures = [
    "Parking",
    "Balcon",
    "Terrasse",
    "Cave",
    "Ascenseur",
    "Gardien",
    "Interphone",
    "Fibre optique",
    "Double vitrage",
    "Climatisation"
  ];

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: property ? {
      ...property,
      price: property.price || 0,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      area: property.area || 0,
      features: property.features || [],
      images: property.images || null,
    } : {
      features: [],
      images: null,
    },
  });

  const createProperty = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création du bien");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/agency"] });
      toast({
        title: "Succès",
        description: "Le bien a été créé avec succès",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du bien",
        variant: "destructive",
      });
    },
  });

  const updateProperty = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      const response = await fetch(`/api/properties/${property?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification du bien");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/agency"] });
      toast({
        title: "Succès",
        description: "Le bien a été modifié avec succès",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification du bien",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    const newFiles = Array.from(files);
    setSelectedImages(prev => [...prev, ...newFiles]);

    try {
      // Convert images to base64
      const base64Images = await Promise.all(
        newFiles.map(file => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }))
      );

      const response = await fetch('/api/properties/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: base64Images }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload images');
      }

      const { urls } = await response.json();
      setUploadedImageUrls(prev => [...prev, ...urls]);
      
      // Update form with new image URLs
      const currentImages = form.getValues('images') || [];
      form.setValue('images', [...currentImages, ...urls]);

      // Create object URLs for preview
      const objectUrls = newFiles.map(file => URL.createObjectURL(file));
      setUploadedImageUrls(prev => [...prev, ...objectUrls]);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger les images",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const currentImages = form.getValues('images') || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    form.setValue('images', newImages);
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(data: PropertyFormValues) {
    if (property) {
      updateProperty.mutate(data);
    } else {
      createProperty.mutate(data);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input placeholder="Titre du bien" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description du bien" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Prix" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localisation</FormLabel>
                <FormControl>
                  <Input placeholder="Ville, code postal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chambres</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Nombre de chambres" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salles de bain</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Nombre de salles de bain" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Surface (m²)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Surface" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de bien</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="apartment">Appartement</SelectItem>
                    <SelectItem value="house">Maison</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transactionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de transaction</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sale">Vente</SelectItem>
                    <SelectItem value="rent">Location</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Caractéristiques</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {defaultFeatures.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={feature}
                        checked={field.value.includes(feature)}
                        onChange={(e) => {
                          const updatedFeatures = e.target.checked
                            ? [...field.value, feature]
                            : field.value.filter((f) => f !== feature);
                          field.onChange(updatedFeatures);
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor={feature} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {feature}
                      </label>
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormItem>
            <FormLabel>Images</FormLabel>
            <FormControl>
              <div className="space-y-4">
                {(form.getValues('images') || []).length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {form.getValues('images')?.map((url, index) => (
                      <div key={url} className="relative group">
                        <img
                          src={url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>

          <Button 
            type="submit" 
            disabled={createProperty.isPending || updateProperty.isPending || isUploading}
            className="w-full"
          >
            {isUploading ? "Téléchargement des images..." : property ? "Modifier le bien" : "Créer le bien"}
          </Button>
        </div>
      </form>
    </Form>
  );
}