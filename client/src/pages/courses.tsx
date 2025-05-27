import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Users, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NavigationHeader } from "@/components/navigation-header";
import { Sidebar } from "@/components/sidebar";
import { CourseCreationModal } from "@/components/course-creation-modal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

/**
 * Displays and manages courses for authenticated users, providing role-based functionality for teachers and students.
 *
 * Teachers can view, search, and manage their courses, as well as create new ones. Students can view enrolled courses, search available courses, and enroll in new courses. The component handles loading, error, and empty states for both enrolled and available courses, and updates the UI reactively based on user actions and API responses.
 *
 * @remark
 * The available courses section and enrollment actions are only accessible to students. Teachers see management options and course creation controls.
 */
export default function Courses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: userCourses = [] } = useQuery({
    queryKey: ["/api/courses"], // Fetches courses user is enrolled in or teaches
    enabled: !!user, // Only run if user is loaded
  });

  const isTeacher = user?.role === "teacher";

  // Fetch available courses for students
  const { 
    data: availableCourses = [], 
    isLoading: isLoadingAvailableCourses,
    error: availableCoursesError 
  } = useQuery<any[]>({ // Replace 'any' with a Course type if available
    queryKey: ["/api/courses/available"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/courses/available");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch available courses");
      }
      return res.json();
    },
    enabled: !!user && !isTeacher, // Only run if user is loaded and is a student
  });
  
  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await apiRequest("POST", `/api/courses/${courseId}/enroll`); // Corrected endpoint
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to enroll in course ${courseId}`);
      }
      return res.json();
    },
    onSuccess: (data, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] }); // Refreshes enrolled courses
      queryClient.invalidateQueries({ queryKey: ["/api/courses/available"] }); // Refreshes available courses
      toast({
        title: "Enrolled successfully!",
        description: "You can now access the course content.",
      });
    },
    onError: (error: Error, courseId) => { // Added courseId to parameters for more specific error
      toast({
        title: "Enrollment failed",
        description: error.message || `An error occurred while enrolling in course ${courseId}.`,
        variant: "destructive",
      });
    },
  });
  
  const enrolledCourseIds = new Set(userCourses.map((course: any) => course.id));

  const filteredUserCourses = userCourses.filter((course: any) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Students see courses from /api/courses/available, teachers don't need this section filtered this way
  const filteredAvailableCourses = isTeacher 
    ? [] 
    : availableCourses.filter((course: any) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !enrolledCourseIds.has(course.id) // Ensure it's not already in their enrolled list (client-side check for immediate UI update)
      );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationHeader />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {isTeacher ? "My Courses" : "Courses"}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isTeacher 
                      ? "Manage your courses and content" 
                      : "Explore and enroll in available courses"
                    }
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  {isTeacher && (
                    <Button 
                      className="inline-flex items-center"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Course
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* User's Courses */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {isTeacher ? "Your Courses" : "Enrolled Courses"}
              </h2>
              
              {filteredUserCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUserCourses.map((course: any) => (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{course.title}</CardTitle>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {course.description || "No description available"}
                            </p>
                          </div>
                          <Badge 
                            variant={course.status === "active" ? "default" : "secondary"}
                            className={course.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400" : ""}
                          >
                            {course.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Users className="mr-1 h-4 w-4" />
                            <span>{course.enrollmentCount || 0} students</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setLocation(`/courses/${course.id}/content`)} // Navigate to content page
                          >
                            {isTeacher ? "Manage Content" : "View Content"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      {isTeacher ? "No courses created" : "No courses enrolled"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {isTeacher 
                        ? "Get started by creating your first course." 
                        : "Browse available courses below to get started."
                      }
                    </p>
                    {isTeacher && (
                      <div className="mt-6">
                        <Button onClick={() => setShowCreateModal(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Course
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Available Courses (for students) */}
            {!isTeacher && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Available Courses to Enroll
                </h2>
                {isLoadingAvailableCourses && <p>Loading available courses...</p>}
                {availableCoursesError && <p className="text-red-500">Error: {availableCoursesError.message}</p>}
                {!isLoadingAvailableCourses && !availableCoursesError && filteredAvailableCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAvailableCourses.map((course: any) => (
                      <Card key={course.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{course.title}</CardTitle>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                                {course.description || "No description available"}
                              </p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 shrink-0">
                              {course.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Users className="mr-1 h-4 w-4" />
                              <span>{course.enrollmentCount || 0} students</span>
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => enrollMutation.mutate(course.id)}
                              disabled={enrollMutation.isPending && enrollMutation.variables === course.id}
                            >
                              {enrollMutation.isPending && enrollMutation.variables === course.id ? "Enrolling..." : "Enroll"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  !isLoadingAvailableCourses && !availableCoursesError && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                          No available courses
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {searchTerm 
                            ? "No courses match your search criteria." 
                            : "There are no new courses available for enrollment at the moment, or you are already enrolled in all active courses."
                          }
                        </p>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Course Creation Modal */}
      <CourseCreationModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
}
