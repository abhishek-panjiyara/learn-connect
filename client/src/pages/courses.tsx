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

export default function Courses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: userCourses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: allCourses = [] } = useQuery({
    queryKey: ["/api/courses/all"],
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await apiRequest("POST", "/api/enrollments", { courseId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Enrolled successfully!",
        description: "You can now access the course content.",
      });
    },
    onError: () => {
      toast({
        title: "Enrollment failed",
        description: "Unable to enroll in the course.",
        variant: "destructive",
      });
    },
  });

  const isTeacher = user?.role === "teacher";
  const enrolledCourseIds = new Set(userCourses.map((course: any) => course.id));
  
  const availableCourses = allCourses.filter((course: any) => 
    !enrolledCourseIds.has(course.id) && 
    course.teacherId !== user?.id &&
    course.status === "active"
  );

  const filteredUserCourses = userCourses.filter((course: any) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAvailableCourses = availableCourses.filter((course: any) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
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
                          <Button variant="outline" size="sm">
                            View Course
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
                  Available Courses
                </h2>
                
                {filteredAvailableCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAvailableCourses.map((course: any) => (
                      <Card key={course.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{course.title}</CardTitle>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {course.description || "No description available"}
                              </p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
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
                              disabled={enrollMutation.isPending}
                            >
                              {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
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
                        No available courses
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {searchTerm 
                          ? "No courses match your search criteria." 
                          : "There are no new courses available for enrollment at the moment."
                        }
                      </p>
                    </CardContent>
                  </Card>
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
