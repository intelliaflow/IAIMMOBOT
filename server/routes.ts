import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { properties, documents } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Get properties by transaction type (sale/rent)
  app.get("/api/properties/transaction/:type", async (req, res) => {
    try {
      const transactionType = req.params.type;
      
      // Validate transaction type
      if (transactionType !== 'sale' && transactionType !== 'rent') {
        return res.status(400).json({ 
          message: "Invalid transaction type. Must be either 'sale' or 'rent'." 
        });
      }

      const filteredProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.transactionType, transactionType))
        .orderBy(properties.createdAt);

      console.log(`Properties fetched (${transactionType}):`, filteredProperties.length);
      return res.json(filteredProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      return res.status(500).json({ 
        message: `Failed to fetch properties for ${req.params.type}` 
      });
    }
  });

  // Get property by ID
  app.get("/api/properties/detail/:id", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ 
          message: "Invalid property ID. Must be a number." 
        });
      }

      const property = await db.query.properties.findFirst({
        where: eq(properties.id, propertyId),
      });
      
      if (!property) {
        return res.status(404).json({ 
          message: "Property not found" 
        });
      }
      
      return res.json(property);
    } catch (error) {
      console.error("Error fetching property details:", error);
      return res.status(500).json({ 
        message: "Failed to fetch property details" 
      });
    }
  });

  // Get agency properties
  app.get("/api/properties/agency", async (req, res) => {
    try {
      // TODO: Get actual agency ID from session
      const agencyId = 1;
      
      const agencyProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.agencyId, agencyId))
        .orderBy(properties.createdAt);
      
      return res.json(agencyProperties);
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
      const newProperty = await db.insert(properties).values(req.body).returning();
      return res.status(201).json(newProperty[0]);
    } catch (error) {
      console.error("Error creating property:", error);
      return res.status(500).json({ 
        message: "Failed to create property" 
      });
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

  return httpServer;
}
