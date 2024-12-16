import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export function SearchFilters() {
  const [priceRange, setPriceRange] = useState([0, 1000000]);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Input placeholder="Où ? Ville, code postal..." />
        </div>
        <div>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Type de bien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">Appartement</SelectItem>
              <SelectItem value="house">Maison</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Nombre de pièces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Studio</SelectItem>
              <SelectItem value="2">2 pièces</SelectItem>
              <SelectItem value="3">3 pièces</SelectItem>
              <SelectItem value="4">4 pièces</SelectItem>
              <SelectItem value="5">5+ pièces</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button className="w-full">Rechercher</Button>
        </div>
      </div>
      <div className="mt-4">
        <label className="text-sm text-gray-600 mb-2 block">
          Budget : {priceRange[0].toLocaleString()}€ - {priceRange[1].toLocaleString()}€
        </label>
        <Slider
          defaultValue={[0, 1000000]}
          max={1000000}
          step={10000}
          value={priceRange}
          onValueChange={setPriceRange}
        />
      </div>
    </div>
  );
}
