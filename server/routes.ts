import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { properties, documents } from "@db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { geocodeAddress, batchGeocodeAddresses } from "../client/src/lib/geocoding";

// Helper function to handle rooms filter
function handleRoomsFilter(rooms: string | undefined) {
  if (!rooms) return null;
  
  const roomNumber = parseInt(rooms);
  if (isNaN(roomNumber)) return null;
  
  if (roomNumber >= 5) {
    return sql`${properties.bedrooms} >= 5`;
  } else {
    return eq(properties.bedrooms, roomNumber);
  }
}

export function registerRoutes(app: Express): Server {
  // Get all properties with filters
  app.get("/api/properties", async (req, res) => {
    try {
      const { location, type: propertyType, rooms, minPrice, maxPrice, transactionType } = req.query;

      // Build conditions array
      let conditions: any[] = [];
      
      if (transactionType && (transactionType === 'sale' || transactionType === 'rent')) {
        conditions.push(eq(properties.transactionType, transactionType));
      }
      
      if (location && typeof location === 'string') {
        conditions.push(sql`LOWER(${properties.location}) LIKE LOWER(${'%' + location + '%'})`);
      }
      
      if (propertyType && typeof propertyType === 'string') {
        conditions.push(eq(properties.type, propertyType));
      }
      
      const roomsCondition = handleRoomsFilter(rooms as string);
      if (roomsCondition) {
        conditions.push(roomsCondition);
      }
      
      if (minPrice && !isNaN(parseInt(minPrice as string))) {
        const minPriceValue = parseInt(minPrice as string);
        conditions.push(sql`${properties.price} >= ${minPriceValue}`);
      }
      
      if (maxPrice && !isNaN(parseInt(maxPrice as string))) {
        const maxPriceValue = parseInt(maxPrice as string);
        conditions.push(sql`${properties.price} <= ${maxPriceValue}`);
      }

      const filteredProperties = await db
        .select()
        .from(properties)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(properties.createdAt));
      
      return res.json(filteredProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      return res.status(500).json({ 
        message: "Failed to fetch properties" 
      });
    }
  });

  // Get properties by transaction type with filters
  app.get("/api/properties/transaction/:type", async (req, res) => {
    try {
      const transactionType = req.params.type;
      if (transactionType !== 'sale' && transactionType !== 'rent') {
        return res.status(400).json({ message: "Invalid transaction type" });
      }

      const { location, type: propertyType, rooms, minPrice, maxPrice } = req.query;

      // Build conditions array
      let conditions: any[] = [eq(properties.transactionType, transactionType)];
      
      if (location && typeof location === 'string') {
        conditions.push(sql`LOWER(${properties.location}) LIKE LOWER(${'%' + location + '%'})`);
      }
      
      if (propertyType && typeof propertyType === 'string') {
        conditions.push(eq(properties.type, propertyType));
      }
      
      const roomsCondition = handleRoomsFilter(rooms as string);
      if (roomsCondition) {
        conditions.push(roomsCondition);
      }
      
      if (minPrice && !isNaN(parseInt(minPrice as string))) {
        const minPriceValue = parseInt(minPrice as string);
        conditions.push(sql`${properties.price} >= ${minPriceValue}`);
      }
      
      if (maxPrice && !isNaN(parseInt(maxPrice as string))) {
        const maxPriceValue = parseInt(maxPrice as string);
        conditions.push(sql`${properties.price} <= ${maxPriceValue}`);
      }

      const filteredProperties = await db
        .select()
        .from(properties)
        .where(and(...conditions))
        .orderBy(desc(properties.createdAt));
      
      return res.json(filteredProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      return res.status(500).json({ 
        message: "Failed to fetch properties" 
      });
    }
  });

  // Get agency properties with filters
  app.get("/api/properties/agency", async (req, res) => {
    try {
      // TODO: Get actual agency ID from session
      const agencyId = 1;
      const { location, type: propertyType, rooms, minPrice, maxPrice, transactionType } = req.query;

      // Build conditions array
      let conditions: any[] = [eq(properties.agencyId, agencyId)];

      if (transactionType && (transactionType === 'sale' || transactionType === 'rent')) {
        conditions.push(eq(properties.transactionType, transactionType));
      }
      
      if (location && typeof location === 'string') {
        conditions.push(sql`LOWER(${properties.location}) LIKE LOWER(${'%' + location + '%'})`);
      }
      
      if (propertyType && typeof propertyType === 'string') {
        conditions.push(eq(properties.type, propertyType));
      }
      
      const roomsCondition = handleRoomsFilter(rooms as string);
      if (roomsCondition) {
        conditions.push(roomsCondition);
      }
      
      if (minPrice && !isNaN(parseInt(minPrice as string))) {
        const minPriceValue = parseInt(minPrice as string);
        conditions.push(sql`${properties.price} >= ${minPriceValue}`);
      }
      
      if (maxPrice && !isNaN(parseInt(maxPrice as string))) {
        const maxPriceValue = parseInt(maxPrice as string);
        conditions.push(sql`${properties.price} <= ${maxPriceValue}`);
      }

      const filteredProperties = await db
        .select()
        .from(properties)
        .where(and(...conditions))
        .orderBy(desc(properties.createdAt));
      
      return res.json(filteredProperties);
    } catch (error) {
      console.error("Error fetching agency properties:", error);
      return res.status(500).json({ 
        message: "Failed to fetch agency properties" 
      });
    }
  });

  // Get property by ID
  app.get("/api/properties/:id", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      const property = await db.query.properties.findFirst({
        where: eq(properties.id, propertyId),
      });

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      return res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      return res.status(500).json({ 
        message: "Failed to fetch property details" 
      });
    }
  });

  // Create property
  app.post("/api/properties", async (req, res) => {
    try {
      // TODO: Get actual agency ID from session
      const agencyId = 1;
      const propertyData = {
        ...req.body,
        agencyId,
        createdAt: new Date(),
      };

      // Géocode l'adresse avec plusieurs tentatives
      let coordinates = null;
      let attempts = 0;
      const maxAttempts = 3;

      console.log("Début de la géolocalisation pour l'adresse:", propertyData.location);

      // Vérification du format de l'adresse
      if (!propertyData.location.toLowerCase().includes('france')) {
        propertyData.location = `${propertyData.location.trim()}, France`;
        console.log("Adresse formatée avec 'France':", propertyData.location);
      }

      while (!coordinates && attempts < maxAttempts) {
        try {
          console.log(`Tentative ${attempts + 1}/${maxAttempts} de géocodage...`);
          coordinates = await geocodeAddress(propertyData.location);
          
          if (coordinates) {
            console.log("Coordonnées obtenues:", coordinates);
          } else {
            console.warn(`Tentative ${attempts + 1}/${maxAttempts} échouée`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`Erreur lors du géocodage (tentative ${attempts + 1}):`, error);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        attempts++;
      }

      if (!coordinates) {
        console.error(`Échec du géocodage après ${maxAttempts} tentatives pour:`, propertyData.location);
        return res.status(400).json({
          message: "Impossible de géolocaliser cette adresse. Veuillez vérifier que l'adresse est correcte et complète (numéro, rue, code postal, ville, France)."
        });
      }

      console.log(`Géocodage réussi pour ${propertyData.location}:`, coordinates);
      
      const propertyWithCoordinates = {
        ...propertyData,
        latitude: coordinates.lat,
        longitude: coordinates.lon
      };
      
      const newProperty = await db.insert(properties).values(propertyWithCoordinates).returning();
      return res.status(201).json(newProperty[0]);
    } catch (error) {
      console.error("Error creating property:", error);
      return res.status(500).json({ 
        message: "Failed to create property" 
      });
    }
  });

  // Update property
  app.put("/api/properties/:id", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      // TODO: Get actual agency ID from session and verify ownership
      const agencyId = 1;
      
      const property = await db.query.properties.findFirst({
        where: and(
          eq(properties.id, propertyId),
          eq(properties.agencyId, agencyId)
        ),
      });

      if (!property) {
        return res.status(404).json({ message: "Property not found or unauthorized" });
      }

      const updatedProperty = await db
        .update(properties)
        .set({
          ...req.body,
        })
        .where(eq(properties.id, propertyId))
        .returning();

      return res.json(updatedProperty[0]);
    } catch (error) {
      console.error("Error updating property:", error);
      return res.status(500).json({ message: "Failed to update property" });
    }
  });

  // Upload document
  app.post("/api/documents", async (req, res) => {
    try {
      const newDocument = await db.insert(documents).values(req.body).returning();
      return res.status(201).json(newDocument[0]);
    } catch (error) {
      console.error("Error uploading document:", error);
      return res.status(500).json({ 
        message: "Failed to upload document" 
      });
    }
  });

  // Upload property images
  app.post("/api/properties/images", async (req, res) => {
    try {
      const { images } = req.body;

      if (!images || !Array.isArray(images)) {
        return res.status(400).json({ message: "No images provided" });
      }

      // Store images and generate URLs
      const imageUrls = images.map((base64Image) => {
        // For now, we'll store the base64 image directly
        // In production, you would want to store these in a proper storage service
        return base64Image;
      });

      return res.json({ urls: imageUrls });
    } catch (error) {
      console.error("Error uploading images:", error);
      return res.status(500).json({ 
        message: "Failed to upload images" 
      });
    }
  });
  // Geocode all properties without coordinates
  app.post("/api/properties/geocode-all", async (req, res) => {
    try {
      // Get all properties without coordinates
      const propertiesWithoutCoords = await db
        .select()
        .from(properties)
        .where(sql`${properties.latitude} IS NULL OR ${properties.longitude} IS NULL`);

      if (propertiesWithoutCoords.length === 0) {
        return res.json({ message: "No properties need geocoding" });
      }

      console.log(`Found ${propertiesWithoutCoords.length} properties to geocode`);

      // Geocode all addresses
      const addresses = propertiesWithoutCoords.map(p => p.location);
      const geocodedResults = await batchGeocodeAddresses(addresses);

      // Update each property with its coordinates
      let updatedCount = 0;
      for (const property of propertiesWithoutCoords) {
        const coordinates = geocodedResults.get(property.location);
        if (coordinates) {
          await db
            .update(properties)
            .set({
              latitude: coordinates.lat,
              longitude: coordinates.lon,
            })
            .where(eq(properties.id, property.id));
          updatedCount++;
        }
      }

      return res.json({ 
        message: `Successfully geocoded ${updatedCount} properties`,
        total: propertiesWithoutCoords.length,
        updated: updatedCount
      });
    } catch (error) {
      console.error("Error geocoding properties:", error);
      return res.status(500).json({ 
        message: "Failed to geocode properties" 
      });
    }
  });

  // Endpoint pour regéocoder toutes les propriétés
  app.get("/api/properties/geocode-missing", async (req, res) => {
    try {
      // Récupérer les propriétés sans coordonnées valides
      const propertiesWithoutCoords = await db
        .select()
        .from(properties)
        .where(
          sql`${properties.latitude} IS NULL OR 
              ${properties.longitude} IS NULL OR
              ${properties.latitude} = '' OR 
              ${properties.longitude} = ''`
        );

      if (!propertiesWithoutCoords || propertiesWithoutCoords.length === 0) {
        return res.json({
          message: "No properties need geocoding",
          total: 0,
          success: 0,
          errors: 0
        });
      }

      console.log(`Found ${propertiesWithoutCoords.length} properties needing geocoding`);

      let updatedCount = 0;
      let errorCount = 0;

      for (const property of propertiesWithoutCoords) {
        if (!property.location) {
          console.warn(`Property ${property.id} has no location, skipping`);
          errorCount++;
          continue;
        }

        // Format address for better geocoding results
        let formattedAddress = property.location.trim();
        if (!formattedAddress.toLowerCase().includes('france')) {
          formattedAddress = `${formattedAddress}, France`;
        }

        console.log(`Geocoding property ${property.id}: ${formattedAddress}`);
        
        try {
          // Wait between requests to respect API limits
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const coordinates = await geocodeAddress(formattedAddress);
          
          if (coordinates && coordinates.lat && coordinates.lon) {
            await db
              .update(properties)
              .set({
                latitude: coordinates.lat,
                longitude: coordinates.lon
              })
              .where(eq(properties.id, property.id));
            
            console.log(`Updated property ${property.id} with coordinates:`, coordinates);
            updatedCount++;
          } else {
            console.warn(`No coordinates found for property ${property.id}`);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error geocoding property ${property.id}:`, error);
          errorCount++;
        }
      }

      return res.json({
        message: `Geocoding completed`,
        total: propertiesWithoutCoords.length,
        success: updatedCount,
        errors: errorCount
      });
    } catch (error) {
      console.error("Error during geocoding process:", error);
      return res.status(500).json({
        message: "An error occurred during the geocoding process"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}