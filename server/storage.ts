import {
  users,
  courses,
  content,
  assignments,
  submissions,
  enrollments,
  type User,
  type InsertUser,
  type Course,
  type InsertCourse,
  type Content,
  type InsertContent,
  type Assignment,
  type InsertAssignment,
  type Submission,
  type InsertSubmission,
  type Enrollment,
  type InsertEnrollment,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<Pick<User, 'name' | 'avatar'>>): Promise<User | undefined>; // Added updateUser
  
  // Courses
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByTeacher(teacherId: number): Promise<Course[]>;
  getCoursesByStudent(studentId: number): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined>;
  
  // Content
  getContent(id: number): Promise<Content | undefined>;
  getContentByCourse(courseId: number): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: number, updates: Partial<Content>): Promise<Content | undefined>;
  deleteContent(id: number): Promise<boolean>;
  
  // Assignments
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByCourse(courseId: number): Promise<Assignment[]>;
  getAssignmentsByTeacher(teacherId: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, updates: Partial<Assignment>): Promise<Assignment | undefined>;
  
  // Submissions
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: number): Promise<Submission[]>;
  getSubmissionByAssignmentAndStudent(assignmentId: number, studentId: number): Promise<Submission | undefined>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: number, updates: Partial<Submission>): Promise<Submission | undefined>;
  
  // Enrollments
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, updates: Partial<Enrollment>): Promise<Enrollment | undefined>;

  // Course Discovery & Enrollment
  getAvailableCoursesForStudent(studentId: number): Promise<Course[]>;
  enrollStudentInCourse(studentId: number, courseId: number): Promise<Enrollment | { error: string }>;

  // Course Content Access
  getCourseWithContentForStudent(courseId: number, studentId: number): Promise<(Course & { content: Content[] }) | { error: string }>;

  // Assignments & Submissions
  getAssignmentsForCourse(courseId: number, userId: number, userRole: string): Promise<(Assignment & { submissionStatus?: string, submissionId?: number, grade?: number | null })[] | { error: string }>;
  createOrUpdateSubmission(assignmentId: number, studentId: number, content: string, submissionId?: number): Promise<Submission | { error: string }>;
  getSubmissionDetails(submissionId: number, userId: number, userRole: string): Promise<(Submission & { assignment: Assignment, student?: User, course?: Course }) | { error: string }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<Pick<User, 'name' | 'avatar'>>): Promise<User | undefined> {
    if (Object.keys(updates).length === 0) {
      return this.getUser(id); // No updates, return current user
    }
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async getCoursesByTeacher(teacherId: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.teacherId, teacherId));
  }

  async getCoursesByStudent(studentId: number): Promise<Course[]> {
    const studentEnrollments = await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
    const courseIds = studentEnrollments.map(enrollment => enrollment.courseId);
    
    if (courseIds.length === 0) return [];
    
    return await db.select().from(courses);
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values(insertCourse)
      .returning();
    return course;
  }

  async updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined> {
    const [course] = await db
      .update(courses)
      .set(updates)
      .where(eq(courses.id, id))
      .returning();
    return course || undefined;
  }

  async getContent(id: number): Promise<Content | undefined> {
    const [contentItem] = await db.select().from(content).where(eq(content.id, id));
    return contentItem || undefined;
  }

  async getContentByCourse(courseId: number): Promise<Content[]> {
    return await db.select().from(content).where(eq(content.courseId, courseId));
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const [contentItem] = await db
      .insert(content)
      .values(insertContent)
      .returning();
    return contentItem;
  }

  async updateContent(id: number, updates: Partial<Content>): Promise<Content | undefined> {
    const [contentItem] = await db
      .update(content)
      .set(updates)
      .where(eq(content.id, id))
      .returning();
    return contentItem || undefined;
  }

  async deleteContent(id: number): Promise<boolean> {
    const result = await db.delete(content).where(eq(content.id, id));
    return result.rowCount > 0;
  }

  async getAssignment(id: number): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment || undefined;
  }

  async getAssignmentsByCourse(courseId: number): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.courseId, courseId));
  }

  async getAssignmentsByTeacher(teacherId: number): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.teacherId, teacherId));
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const [assignment] = await db
      .insert(assignments)
      .values(insertAssignment)
      .returning();
    return assignment;
  }

  async updateAssignment(id: number, updates: Partial<Assignment>): Promise<Assignment | undefined> {
    const [assignment] = await db
      .update(assignments)
      .set(updates)
      .where(eq(assignments.id, id))
      .returning();
    return assignment || undefined;
  }

  async getSubmission(id: number): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission || undefined;
  }

  async getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId));
  }

  async getSubmissionsByStudent(studentId: number): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.studentId, studentId));
  }

  async getSubmissionByAssignmentAndStudent(assignmentId: number, studentId: number): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions)
      .where(eq(submissions.assignmentId, assignmentId));
    return submission || undefined;
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db
      .insert(submissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async updateSubmission(id: number, updates: Partial<Submission>): Promise<Submission | undefined> {
    const [submission] = await db
      .update(submissions)
      .set(updates)
      .where(eq(submissions.id, id))
      .returning();
    return submission || undefined;
  }

  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment || undefined;
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db
      .insert(enrollments)
      .values(insertEnrollment)
      .returning();
    return enrollment;
  }

  async updateEnrollment(id: number, updates: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .update(enrollments)
      .set(updates)
      .where(eq(enrollments.id, id))
      .returning();
    return enrollment || undefined;
  }

  async getAvailableCoursesForStudent(studentId: number): Promise<Course[]> {
    // Get all active courses
    // (moved filtering of enrolled courses into the DB layer)

    // Get all courses the student is already enrolled in
    const studentEnrollments = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId));
    const enrolledCourseIds = studentEnrollments.map(e => e.courseId);

    if (enrolledCourseIds.length === 0) {
      return await db
        .select()
        .from(courses)
        .where(eq(courses.status, "active"));
    }

    return await db
      .select()
      .from(courses)
      .where(and(
        eq(courses.status, "active"),
        notInArray(courses.id, enrolledCourseIds)   // drizzle `inArray` helper
      ));
  }

  async enrollStudentInCourse(studentId: number, courseId: number): Promise<Enrollment | { error: string }> {
    try {
      const result = await db.transaction(async (tx) => {
        // 1. Check if course exists and is active
        const [course] = await tx.select().from(courses).where(eq(courses.id, courseId));
        if (!course) {
          return { error: "Course not found." };
        }
        if (course.status !== "active") {
          return { error: "Course is not active and cannot be enrolled in." };
        }

        // 2. Check if student is already enrolled
        const [existingEnrollment] = await tx.select().from(enrollments)
          .where(eq(enrollments.studentId, studentId))
          .where(eq(enrollments.courseId, courseId));
        
        if (existingEnrollment) {
          return { error: "Student is already enrolled in this course." };
        }

        // 3. Create new enrollment
        const [newEnrollment] = await tx.insert(enrollments).values({
          studentId,
          courseId,
          enrolledAt: new Date(),
          progress: 0,
        }).returning();

        // 4. Increment enrollmentCount on the course
        const [updatedCourse] = await tx.update(courses)
          .set({ enrollmentCount: (course.enrollmentCount || 0) + 1 })
          .where(eq(courses.id, courseId))
          .returning();

        if (!updatedCourse) {
          // This should ideally not happen if the course was found earlier
          await tx.rollback(); // Manually trigger rollback if Drizzle version doesn't automatically
          return { error: "Failed to update course enrollment count." };
        }
        
        return newEnrollment;
      });
      return result;
    } catch (error) {
      console.error("Error in enrollStudentInCourse transaction:", error);
      return { error: "An unexpected error occurred during enrollment." };
    }
  }

  async getCourseWithContentForStudent(courseId: number, studentId: number): Promise<(Course & { content: Content[] }) | { error: string }> {
    // 1. Verify enrollment
    const [enrollment] = await db.select().from(enrollments)
      .where(eq(enrollments.studentId, studentId))
      .where(eq(enrollments.courseId, courseId));

    if (!enrollment) {
      return { error: "Student is not enrolled in this course." };
    }

    // 2. Fetch course details
    const [courseDetails] = await db.select().from(courses).where(eq(courses.id, courseId));
    if (!courseDetails) {
      return { error: "Course not found." };
    }

    // 3. Fetch course content, ordered by 'order'
    // Assuming 'content' table has an 'order' column. If not, Drizzle might not have 'asc' directly on column.
    // For now, let's assume 'content.order' exists and 'asc' can be applied.
    // If 'content.order' is not directly sortable this way, this might need adjustment or schema change.
    const courseContentItems = await db.select().from(content)
      .where(eq(content.courseId, courseId))
      .orderBy(content.order); // Drizzle ORM typically handles .orderBy(schema.table.column) or .orderBy(asc(schema.table.column))

    return {
      ...courseDetails,
      content: courseContentItems,
    };
  }

  async getAssignmentsForCourse(courseId: number, userId: number, userRole: string): Promise<(Assignment & { submissionStatus?: string, submissionId?: number, grade?: number | null })[] | { error: string }> {
    // Verify user has access to the course (either enrolled student or teacher)
    const course = await this.getCourse(courseId);
    if (!course) return { error: "Course not found." };

    let isEnrolled = false;
    if (userRole === 'student') {
      const enrollment = await db.select().from(enrollments)
        .where(eq(enrollments.studentId, userId))
        .where(eq(enrollments.courseId, courseId));
      if (enrollment.length > 0) isEnrolled = true;
    }

    if (userRole === 'teacher' && course.teacherId !== userId) {
      return { error: "Teacher not authorized for this course." };
    }
    if (userRole === 'student' && !isEnrolled) {
      return { error: "Student not enrolled in this course." };
    }

    const courseAssignments = await db.select().from(assignments).where(eq(assignments.courseId, courseId)).orderBy(assignments.dueDate);

    if (userRole === 'student') {
      const assignmentsWithSubmissions = await Promise.all(
        courseAssignments.map(async (assignment) => {
          const [submission] = await db.select().from(submissions)
            .where(eq(submissions.assignmentId, assignment.id))
            .where(eq(submissions.studentId, userId));
          return {
            ...assignment,
            submissionStatus: submission?.status || 'not-submitted',
            submissionId: submission?.id,
            grade: submission?.grade,
          };
        })
      );
      return assignmentsWithSubmissions;
    }
    
    // For teachers, just return the assignments
    return courseAssignments.map(a => ({...a, submissionStatus: undefined, submissionId: undefined, grade: undefined }));
  }

  async createOrUpdateSubmission(assignmentId: number, studentId: number, submissionContent: string, submissionIdToUpdate?: number): Promise<Submission | { error: string }> {
    // 1. Verify assignment exists
    const assignment = await this.getAssignment(assignmentId);
    if (!assignment) return { error: "Assignment not found." };

    // 2. Verify student is enrolled in the course associated with the assignment
    const course = await this.getCourse(assignment.courseId);
    if (!course) return { error: "Course not found for this assignment."} // Should not happen if DB is consistent

    const [enrollment] = await db.select().from(enrollments)
      .where(eq(enrollments.studentId, studentId))
      .where(eq(enrollments.courseId, assignment.courseId));
    if (!enrollment) return { error: "Student not enrolled in the course for this assignment." };
    
    // 3. Check if it's an update or new submission
    let existingSubmission: Submission | undefined = undefined;
    if (submissionIdToUpdate) {
        [existingSubmission] = await db.select().from(submissions).where(eq(submissions.id, submissionIdToUpdate)).where(eq(submissions.studentId, studentId));
        if (!existingSubmission) return { error: "Submission to update not found or access denied." };
    } else {
        // For new submissions, or if ID not provided, check if one already exists for this assignment by this student
        [existingSubmission] = await db.select().from(submissions)
            .where(eq(submissions.assignmentId, assignmentId))
            .where(eq(submissions.studentId, studentId));
    }


    if (existingSubmission) {
      // Update existing submission
      const [updatedSubmission] = await db.update(submissions)
        .set({
          content: submissionContent,
          submittedAt: new Date(),
          status: 'resubmitted', // Or 'pending' if resubmissions are treated as initial
        })
        .where(eq(submissions.id, existingSubmission.id))
        .returning();
      return updatedSubmission || { error: "Failed to update submission." };
    } else {
      // Create new submission
      const [newSubmission] = await db.insert(submissions).values({
        assignmentId,
        studentId,
        content: submissionContent,
        submittedAt: new Date(),
        status: 'submitted', // Or 'pending'
      }).returning();
      return newSubmission || { error: "Failed to create submission." };
    }
  }

  async getSubmissionDetails(submissionId: number, userId: number, userRole: string): Promise<(Submission & { assignment: Assignment, student?: User, course?: Course }) | { error: string }> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, submissionId));
    if (!submission) return { error: "Submission not found." };

    const assignment = await this.getAssignment(submission.assignmentId);
    if (!assignment) return { error: "Assignment not found for this submission." }; // Should not happen

    const course = await this.getCourse(assignment.courseId);
    if (!course) return { error: "Course not found for this assignment." }; // Should not happen

    // Authorization check
    if (userRole === 'student' && submission.studentId !== userId) {
      return { error: "Access denied. You are not the owner of this submission." };
    }
    if (userRole === 'teacher' && course.teacherId !== userId) {
      return { error: "Access denied. You are not the teacher of this course." };
    }
    
    let studentData: User | undefined = undefined;
    if (userRole === 'teacher') { // Teacher might want to see student details
        studentData = await this.getUser(submission.studentId);
    }

    return {
      ...submission,
      assignment,
      student: studentData, // Only populated for teacher
      course, // Added course for context
    };
  }
}

export const storage = new DatabaseStorage();