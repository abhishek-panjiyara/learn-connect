import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertCourseSchema,
  insertContentSchema,
  insertAssignmentSchema,
  insertSubmissionSchema,
  insertEnrollmentSchema,
} from "@shared/schema";
import { z } from "zod";

// Extend Express Request type to include session
interface AuthenticatedRequest extends Request {
  session: any;
  user?: any;
}

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req: AuthenticatedRequest, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/auth/logout", (req: AuthenticatedRequest, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req: AuthenticatedRequest, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Middleware to check authentication
  const requireAuth = async (req: AuthenticatedRequest, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    req.user = user;
    next();
  };

  // User routes
  app.post("/api/users/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Course routes
  app.get("/api/courses", requireAuth, async (req: any, res) => {
    try {
      let courses;
      if (req.user.role === "teacher") {
        courses = await storage.getCoursesByTeacher(req.user.id);
      } else {
        courses = await storage.getCoursesByStudent(req.user.id);
      }
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/all", requireAuth, async (req: any, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/courses", requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can create courses" });
      }

      const courseData = insertCourseSchema.parse({
        ...req.body,
        teacherId: req.user.id,
      });

      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      res.status(400).json({ message: "Invalid course data" });
    }
  });

  app.put("/api/courses/:id", requireAuth, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (req.user.role !== "teacher" || course.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this course" });
      }

      const updatedCourse = await storage.updateCourse(courseId, req.body);
      res.json(updatedCourse);
    } catch (error) {
      res.status(400).json({ message: "Failed to update course" });
    }
  });

  // Content routes
  app.get("/api/courses/:courseId/content", requireAuth, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const content = await storage.getContentByCourse(courseId);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post("/api/content", requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can create content" });
      }

      const contentData = insertContentSchema.parse({
        ...req.body,
        teacherId: req.user.id,
      });

      const content = await storage.createContent(contentData);
      res.status(201).json(content);
    } catch (error) {
      res.status(400).json({ message: "Invalid content data" });
    }
  });

  app.put("/api/content/:id", requireAuth, async (req: any, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const content = await storage.getContent(contentId);
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      if (req.user.role !== "teacher" || content.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this content" });
      }

      const updatedContent = await storage.updateContent(contentId, req.body);
      res.json(updatedContent);
    } catch (error) {
      res.status(400).json({ message: "Failed to update content" });
    }
  });

  app.delete("/api/content/:id", requireAuth, async (req: any, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const content = await storage.getContent(contentId);
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      if (req.user.role !== "teacher" || content.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this content" });
      }

      await storage.deleteContent(contentId);
      res.json({ message: "Content deleted" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete content" });
    }
  });

  // Assignment routes
  app.get("/api/assignments", requireAuth, async (req: any, res) => {
    try {
      let assignments;
      if (req.user.role === "teacher") {
        assignments = await storage.getAssignmentsByTeacher(req.user.id);
      } else {
        // For students, get assignments from enrolled courses
        const enrollments = await storage.getEnrollmentsByStudent(req.user.id);
        const courseIds = enrollments.map(e => e.courseId);
        assignments = [];
        for (const courseId of courseIds) {
          const courseAssignments = await storage.getAssignmentsByCourse(courseId);
          assignments.push(...courseAssignments);
        }
      }
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post("/api/assignments", requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can create assignments" });
      }

      const assignmentData = insertAssignmentSchema.parse({
        ...req.body,
        teacherId: req.user.id,
      });

      const assignment = await storage.createAssignment(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Invalid assignment data" });
    }
  });

  // Submission routes
  app.get("/api/assignments/:assignmentId/submissions", requireAuth, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      if (req.user.role === "teacher" && assignment.teacherId === req.user.id) {
        // Teacher can see all submissions for their assignment
        const submissions = await storage.getSubmissionsByAssignment(assignmentId);
        res.json(submissions);
      } else if (req.user.role === "student") {
        // Student can only see their own submission
        const submission = await storage.getSubmissionByAssignmentAndStudent(assignmentId, req.user.id);
        res.json(submission ? [submission] : []);
      } else {
        res.status(403).json({ message: "Not authorized" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post("/api/submissions", requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Only students can submit assignments" });
      }

      const submissionData = insertSubmissionSchema.parse({
        ...req.body,
        studentId: req.user.id,
      });

      // Check if student already submitted
      const existing = await storage.getSubmissionByAssignmentAndStudent(
        submissionData.assignmentId,
        req.user.id
      );

      if (existing) {
        return res.status(400).json({ message: "Assignment already submitted" });
      }

      const submission = await storage.createSubmission(submissionData);
      res.status(201).json(submission);
    } catch (error) {
      res.status(400).json({ message: "Invalid submission data" });
    }
  });

  // Enrollment routes
  app.post("/api/enrollments", requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Only students can enroll in courses" });
      }

      const enrollmentData = insertEnrollmentSchema.parse({
        ...req.body,
        studentId: req.user.id,
      });

      const enrollment = await storage.createEnrollment(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(400).json({ message: "Failed to enroll in course" });
    }
  });

  // Enrollments
  app.post("/api/enrollments", requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({ error: "Only students can enroll in courses" });
      }

      const { courseId } = req.body;
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Check if already enrolled
      const existingEnrollments = await storage.getEnrollmentsByStudent(req.user.id);
      const alreadyEnrolled = existingEnrollments.some(e => e.courseId === courseId);
      
      if (alreadyEnrolled) {
        return res.status(400).json({ error: "Already enrolled in this course" });
      }

      // Create enrollment
      const enrollment = await storage.createEnrollment({
        courseId,
        studentId: req.user.id,
        progress: 0
      });

      res.json(enrollment);
    } catch (error) {
      console.error("Enrollment error:", error);
      res.status(500).json({ error: "Failed to enroll in course" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req: any, res) => {
    try {
      if (req.user.role === "teacher") {
        const courses = await storage.getCoursesByTeacher(req.user.id);
        const assignments = await storage.getAssignmentsByTeacher(req.user.id);
        
        let totalStudents = 0;
        let pendingReviews = 0;
        
        for (const course of courses) {
          totalStudents += course.enrollmentCount || 0;
        }

        for (const assignment of assignments) {
          const submissions = await storage.getSubmissionsByAssignment(assignment.id);
          pendingReviews += submissions.filter(s => s.status === "pending").length;
        }

        const activeCourses = courses.filter(c => c.status === "active").length;

        res.json({
          totalStudents,
          activeCourses,
          pendingReviews,
          completionRate: 89, // Mock completion rate
        });
      } else {
        const enrollments = await storage.getEnrollmentsByStudent(req.user.id);
        const submissions = await storage.getSubmissionsByStudent(req.user.id);
        
        res.json({
          enrolledCourses: enrollments.length,
          completedAssignments: submissions.filter(s => s.status === "graded").length,
          pendingAssignments: submissions.filter(s => s.status === "pending").length,
          averageGrade: 85, // Mock average grade
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
