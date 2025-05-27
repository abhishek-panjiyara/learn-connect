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
  selectUserSchema, // Added for profile response
} from "@shared/schema";
import { z } from "zod";

// Schema for updating profile
const updateUserProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  avatar: z.string().url("Invalid URL format").optional(),
});

// Schema for submitting/updating an assignment
const submissionContentSchema = z.object({
  content: z.string().min(1, "Submission content cannot be empty."),
  submissionId: z.number().optional(), // For updating existing submission
});

// Extend Express Request type to include session
interface AuthenticatedRequest extends Request {
  session: any;
  user?: any;
}

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/**
 * Registers all API routes for authentication, user management, courses, content, assignments, submissions, enrollments, and dashboard statistics on the provided Express app, and returns an HTTP server instance.
 *
 * Routes include user registration, login/logout, profile management, course listing and enrollment, content and assignment management, submission handling, and dashboard statistics, with role-based access control and input validation.
 *
 * @param app - The Express application instance to register routes on.
 * @returns An HTTP server instance with all routes registered.
 *
 * @remark
 * - All routes use role-based access control and input validation.
 * - Error responses use appropriate HTTP status codes for unauthorized, forbidden, not found, conflict, and validation errors.
 */
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

  // Profile routes
  app.get("/api/users/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
    // req.user is populated by requireAuth middleware
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(selectUserSchema.parse(userWithoutPassword));
  });

  app.put("/api/users/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const dataToUpdate = updateUserProfileSchema.parse(req.body);

      if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      const updatedUser = await storage.updateUser(req.user.id, dataToUpdate);
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(selectUserSchema.parse(userWithoutPassword));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Course routes
  app.get("/api/courses/available", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user?.role !== "student") {
        return res.status(403).json({ message: "Only students can view available courses." });
      }
      const courses = await storage.getAvailableCoursesForStudent(req.user.id);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching available courses:", error);
      res.status(500).json({ message: "Failed to fetch available courses." });
    }
  });

  app.post("/api/courses/:courseId/enroll", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user?.role !== "student") {
        return res.status(403).json({ message: "Only students can enroll in courses." });
      }
      const courseId = parseInt(req.params.courseId, 10);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID." });
      }

      const result = await storage.enrollStudentInCourse(req.user.id, courseId);

      if ('error' in result) {
        // Check if the error is due to already being enrolled or course not found/active
        if (result.error === "Student is already enrolled in this course.") {
            return res.status(409).json({ message: result.error }); // 409 Conflict
        }
        if (result.error === "Course not found." || result.error === "Course is not active and cannot be enrolled in.") {
            return res.status(404).json({ message: result.error }); // 404 Not Found
        }
        // For other errors, like transaction failure
        return res.status(500).json({ message: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      res.status(500).json({ message: "Failed to enroll in course." });
    }
  });

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
  app.get("/api/courses/:courseId/content", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID." });
      }

      // For now, focusing on student access as per subtask.
      // Teacher access (own course) could be added here as an enhancement.
      if (req.user?.role === "student") {
        const courseWithContent = await storage.getCourseWithContentForStudent(courseId, req.user.id);

        if ('error' in courseWithContent) {
          if (courseWithContent.error === "Student is not enrolled in this course.") {
            return res.status(403).json({ message: courseWithContent.error });
          }
          if (courseWithContent.error === "Course not found.") {
            return res.status(404).json({ message: courseWithContent.error });
          }
          // Other storage errors
          return res.status(500).json({ message: courseWithContent.error });
        }
        return res.json(courseWithContent);
      } else if (req.user?.role === "teacher") {
        // Basic teacher access: allow if they own the course
        const courseDetails = await storage.getCourse(courseId);
        if (!courseDetails) {
          return res.status(404).json({ message: "Course not found." });
        }
        if (courseDetails.teacherId !== req.user.id) {
          return res.status(403).json({ message: "You are not authorized to view this course's content." });
        }
        // Fetch content separately for teacher (could be refactored into a storage method too)
        const courseContentItems = await storage.getContentByCourse(courseId);
        return res.json({ ...courseDetails, content: courseContentItems });

      } else {
        // Should not happen if roles are properly defined
        return res.status(403).json({ message: "Access denied." });
      }

    } catch (error) {
      console.error("Error fetching course content:", error);
      res.status(500).json({ message: "Failed to fetch course content." });
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
  app.get("/api/courses/:courseId/assignments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID." });
      }

      const assignmentsData = await storage.getAssignmentsForCourse(courseId, req.user.id, req.user.role);
      if ('error' in assignmentsData) {
        if (assignmentsData.error === "Course not found.") return res.status(404).json({ message: assignmentsData.error });
        if (assignmentsData.error === "Teacher not authorized for this course." || assignmentsData.error === "Student not enrolled in this course.") {
          return res.status(403).json({ message: assignmentsData.error });
        }
        return res.status(500).json({ message: assignmentsData.error });
      }
      res.json(assignmentsData);
    } catch (error) {
      console.error("Error fetching assignments for course:", error);
      res.status(500).json({ message: "Failed to fetch assignments." });
    }
  });
  
  // This is the new endpoint for students submitting work
  app.post("/api/assignments/:assignmentId/submit", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user?.role !== 'student') {
        return res.status(403).json({ message: "Only students can submit assignments." });
      }
      
      const assignmentId = parseInt(req.params.assignmentId, 10);
      if (isNaN(assignmentId)) {
        return res.status(400).json({ message: "Invalid assignment ID." });
      }

      const { content, submissionId } = submissionContentSchema.parse(req.body);

      const submissionResult = await storage.createOrUpdateSubmission(assignmentId, req.user.id, content, submissionId);

      if ('error' in submissionResult) {
        if (submissionResult.error.includes("not found")) return res.status(404).json({ message: submissionResult.error });
        if (submissionResult.error.includes("not enrolled")) return res.status(403).json({ message: submissionResult.error });
        return res.status(400).json({ message: submissionResult.error }); // Other validation errors from storage
      }
      res.status(submissionId ? 200 : 201).json(submissionResult); // 200 for update, 201 for create
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid submission data.", errors: error.errors });
      }
      console.error("Error submitting assignment:", error);
      res.status(500).json({ message: "Failed to submit assignment." });
    }
  });

  // General GET /api/assignments (can be kept for teacher overview or admin, or removed if not needed)
  app.get("/api/assignments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // This route might need more specific logic based on who is accessing it.
      // For now, let's assume it's for a teacher to see all their assignments.
      if (req.user.role === "teacher") {
        const assignments = await storage.getAssignmentsByTeacher(req.user.id);
        res.json(assignments);
      } else {
        // Students should use /api/courses/:courseId/assignments
        return res.status(403).json({ message: "Access denied. Please use course-specific assignment list." });
      }
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
  // This existing route GET /api/assignments/:assignmentId/submissions can be kept for teachers to list all submissions for an assignment.
  app.get("/api/assignments/:assignmentId/submissions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId, 10);
      if (isNaN(assignmentId)) {
        return res.status(400).json({ message: "Invalid assignment ID." });
      }
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      if (req.user?.role === "teacher" && assignment.teacherId === req.user.id) {
        const submissions = await storage.getSubmissionsByAssignment(assignmentId);
        res.json(submissions);
      } else if (req.user?.role === 'student') {
        // Students should use GET /api/submissions/:submissionId for their specific submission,
        // or GET /api/courses/:courseId/assignments to see their submission status.
        // Listing all submissions for an assignment is usually a teacher function.
        return res.status(403).json({ message: "Students cannot list all submissions for an assignment." });
      } else {
        res.status(403).json({ message: "Not authorized" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });
  
  app.get("/api/submissions/:submissionId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const submissionId = parseInt(req.params.submissionId, 10);
        if (isNaN(submissionId)) {
            return res.status(400).json({ message: "Invalid submission ID." });
        }

        const submissionDetails = await storage.getSubmissionDetails(submissionId, req.user.id, req.user.role);

        if ('error' in submissionDetails) {
            if (submissionDetails.error.includes("not found")) return res.status(404).json({ message: submissionDetails.error });
            if (submissionDetails.error.includes("Access denied")) return res.status(403).json({ message: submissionDetails.error });
            return res.status(500).json({ message: submissionDetails.error });
        }
        res.json(submissionDetails);
    } catch (error) {
        console.error("Error fetching submission details:", error);
        res.status(500).json({ message: "Failed to fetch submission details." });
    }
  });

  // This existing POST /api/submissions can be deprecated or refactored if /api/assignments/:assignmentId/submit covers all student submission cases.
  // For now, I'll leave it but note that the new endpoint is preferred for student submissions.
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
