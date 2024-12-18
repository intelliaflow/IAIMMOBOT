import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function GeocodeButton() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const geocodeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/properties/geocode-missing');
      if (!response.ok) {
        throw new Error('Failed to geocode properties');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Géocodage terminé",
        description: `${data.success} propriétés mises à jour sur ${data.total}`,
      });
      // Refresh properties data
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du géocodage",
        variant: "destructive",
      });
    },
  });

  return (
    <Button 
      onClick={() => geocodeMutation.mutate()}
      disabled={geocodeMutation.isPending}
    >
      {geocodeMutation.isPending ? "Géocodage en cours..." : "Mettre à jour les coordonnées"}
    </Button>
  );
}
