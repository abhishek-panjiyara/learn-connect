import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple auth routes without session for now
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", async (req: any, res) => {
    // For demo purposes, return teacher1 user
    const user = await storage.getUserByUsername("teacher1");
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Basic routes for demo
  app.get("/api/courses", async (req: any, res) => {
    const courses = await storage.getAllCourses();
    res.json(courses);
  });

  app.get("/api/assignments", async (req: any, res) => {
    res.json([]);
  });

  app.get("/api/dashboard/stats", async (req: any, res) => {
    res.json({
      totalStudents: 25,
      activeCourses: 3,
      pendingReviews: 8,
      completionRate: 89
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}