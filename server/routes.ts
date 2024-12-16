import type { Express } from "express";
import { createServer } from "http";
import { db } from "@db";
import { properties, documents } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Get all properties with optional transaction type filter
  app.get("/api/properties", async (req, res) => {
    try {
      const transactionType = req.query.transactionType as string;
      let query = db.select().from(properties);
      
      if (transactionType) {
        query = query.where(eq(properties.transactionType, transactionType));
      }
      
      const filteredProperties = await query.orderBy(properties.createdAt);
      console.log(`Properties fetched (${transactionType || 'all'}):`);
      res.json(filteredProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Get properties for sale
  app.get("/api/properties/sale", async (req, res) => {
    try {
      const propertiesForSale = await db
        .select()
        .from(properties)
        .where(eq(properties.transactionType, 'sale'))
        .orderBy(properties.createdAt);
      res.json(propertiesForSale);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties for sale" });
    }
  });

  // Get properties for rent
  app.get("/api/properties/rent", async (req, res) => {
    try {
      const propertiesForRent = await db
        .select()
        .from(properties)
        .where(eq(properties.transactionType, 'rent'))
        .orderBy(properties.createdAt);
      res.json(propertiesForRent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties for rent" });
    }
  });

  // Get property by ID
  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await db.query.properties.findFirst({
        where: eq(properties.id, parseInt(req.params.id)),
      });
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  // Get agency properties
  app.get("/api/properties/agency", async (req, res) => {
    try {
      // TODO: Get actual agency ID from session
      const agencyId = 1;
      
      const agencyProperties = await db.query.properties.findMany({
        where: eq(properties.agencyId, agencyId),
        orderBy: (properties, { desc }) => [desc(properties.createdAt)],
      });
      
      res.json(agencyProperties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agency properties" });
    }
  });

  // Create property
  app.post("/api/properties", async (req, res) => {
    try {
      const newProperty = await db.insert(properties).values(req.body);
      res.status(201).json(newProperty);
    } catch (error) {
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  // Upload document
  app.post("/api/documents", async (req, res) => {
    try {
      const newDocument = await db.insert(documents).values(req.body);
      res.status(201).json(newDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  return httpServer;
}
