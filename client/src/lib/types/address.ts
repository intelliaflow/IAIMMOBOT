export interface AddressFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    label: string;
    score: number;
    housenumber?: string;
    postcode: string;
    citycode: string;
    city: string;
    context: string;
    street?: string;
    type: string;
  };
}

export interface AddressResponse {
  type: string;
  version: string;
  features: AddressFeature[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
}

export interface AddressSuggestion {
  label: string;
  postcode: string;
  city: string;
  coordinates: [number, number];
}
