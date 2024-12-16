import type { Express } from "express";
import { createServer } from "http";
import { db } from "@db";
import { properties, documents } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Get properties by transaction type
  app.get("/api/properties/:type", async (req, res) => {
    try {
      const transactionType = req.params.type;
      if (transactionType !== 'sale' && transactionType !== 'rent') {
        return res.status(400).json({ message: "Invalid transaction type" });
      }

      const filteredProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.transactionType, transactionType))
        .orderBy(properties.createdAt);

      console.log(`Properties fetched (${transactionType}):`, filteredProperties.length);
      res.json(filteredProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: `Failed to fetch properties for ${req.params.type}` });
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
