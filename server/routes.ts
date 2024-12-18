import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { properties, documents } from "@db/schema";
import { eq, and, sql, gte } from "drizzle-orm";

function handleRoomsFilter(rooms: string | undefined) {
  if (!rooms) return null;
  
  console.log('Processing rooms filter value:', rooms);
  const roomsValue = parseInt(rooms);
  
  if (isNaN(roomsValue)) {
    console.log('Invalid rooms value:', rooms);
    return null;
  }

  // Gestion spéciale pour 5+ pièces
  if (roomsValue === 5) {
    console.log('Filtering for 5+ pieces');
    return gte(properties.bedrooms, 5);
  }
  
  // Pour tous les autres cas, utiliser l'égalité exacte
  console.log('Filtering for exact number of rooms:', roomsValue);
  return eq(properties.bedrooms, roomsValue);
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Get properties by transaction type (sale/rent) with filters
  app.get("/api/properties/transaction/:type", async (req, res) => {
    try {
      const transactionType = req.params.type;
      const { location, type: propertyType, rooms, minPrice, maxPrice } = req.query;
      
      // Validate transaction type
      if (transactionType !== 'sale' && transactionType !== 'rent') {
        return res.status(400).json({ 
          message: "Invalid transaction type. Must be either 'sale' or 'rent'." 
        });
      }

      console.log(`Fetching properties with filters:`, {
        transactionType,
        location,
        propertyType,
        rooms,
        minPrice,
        maxPrice
      });

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
        .orderBy(properties.createdAt);
      
      console.log(`Found ${filteredProperties.length} properties matching criteria`);
      return res.json(filteredProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      return res.status(500).json({ 
        message: `Failed to fetch properties for ${req.params.type}` 
      });
    }
  });

  // Get properties with filters (used by home page)
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
        .orderBy(properties.createdAt);
      
      console.log(`Found ${filteredProperties.length} properties matching criteria`);
      return res.json(filteredProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      return res.status(500).json({ 
        message: "Failed to fetch properties" 
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
        .orderBy(properties.createdAt);
      
      return res.json(filteredProperties);
    } catch (error) {
      console.error("Error fetching agency properties:", error);
      return res.status(500).json({ 
        message: "Failed to fetch agency properties" 
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
        updatedAt: new Date()
      };

      const newProperty = await db.insert(properties).values(propertyData).returning();
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
          updatedAt: new Date()
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

  return httpServer;
}
