import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string, showFull: boolean = false): string {
  if (!address) return '';
  
  // Si on veut l'adresse complète, on la retourne telle quelle
  if (showFull) return address;
  
  // Sinon, on ne retourne que la ville (première partie avant la virgule)
  return address.split(',')[0].trim();
}
