import { useQuery } from "@tanstack/react-query";
import { Users, BookOpen, ClipboardList, TrendingUp, Plus, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavigationHeader } from "@/components/navigation-header";
import { Sidebar } from "@/components/sidebar";
import { ContentCreationModal } from "@/components/content-creation-modal";
import { AssignmentModal } from "@/components/assignment-modal";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [showContentModal, setShowContentModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });

  const popularCourses = courses.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationHeader />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Dashboard Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Welcome back, {user?.name}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Here's what's happening with your courses today
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <Button variant="outline" className="inline-flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                  <Button 
                    onClick={() => setShowContentModal(true)}
                    className="inline-flex items-center"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Content
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-md flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Total Students
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                        {stats?.totalStudents || 0}
                      </dd>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-md flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Active Courses
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                        {stats?.activeCourses || 0}
                      </dd>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-md flex items-center justify-center">
                        <ClipboardList className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Pending Reviews
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                        {stats?.pendingReviews || 0}
                      </dd>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-md flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Completion Rate
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                        {stats?.completionRate || 0}%
                      </dd>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flow-root">
                      <ul className="-mb-8">
                        <li>
                          <div className="relative pb-8">
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center ring-8 ring-white dark:ring-gray-900">
                                  <ClipboardList className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    New assignment submission received
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Introduction to Machine Learning
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                  2 hours ago
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                        
                        <li>
                          <div className="relative pb-8">
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center ring-8 ring-white dark:ring-gray-900">
                                  <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    15 new students enrolled in Advanced Python Programming
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                  4 hours ago
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                        
                        <li>
                          <div className="relative">
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center ring-8 ring-white dark:ring-gray-900">
                                  <ClipboardList className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    Assignment deadline approaching for Data Structures Final Project
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                  1 day ago
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Course Management */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline"
                      className="w-full justify-between bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 border-primary-200 dark:border-primary-800"
                      onClick={() => setShowContentModal(true)}
                    >
                      <div className="flex items-center">
                        <Plus className="mr-3 h-4 w-4 text-primary-600 dark:text-primary-400" />
                        <span className="text-sm font-medium text-primary-900 dark:text-primary-100">Create New Course</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="w-full justify-between bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800"
                      onClick={() => setShowAssignmentModal(true)}
                    >
                      <div className="flex items-center">
                        <ClipboardList className="mr-3 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Create Assignment</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="w-full justify-between bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex items-center">
                        <ClipboardList className="mr-3 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Review Submissions</span>
                      </div>
                    </Button>
                  </CardContent>
                </Card>

                {/* Popular Courses */}
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Courses</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {popularCourses.map((course) => (
                      <div key={course.id} className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {course.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {course.enrollmentCount || 0} students
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge 
                            variant={course.status === "active" ? "default" : "secondary"}
                            className={course.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400" : ""}
                          >
                            {course.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {popularCourses.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No courses created yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <ContentCreationModal 
        isOpen={showContentModal} 
        onClose={() => setShowContentModal(false)} 
      />
      <AssignmentModal 
        isOpen={showAssignmentModal} 
        onClose={() => setShowAssignmentModal(false)} 
      />
    </div>
  );
}
