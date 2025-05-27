import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus, Edit, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NavigationHeader } from "@/components/navigation-header";
import { Sidebar } from "@/components/sidebar";
import { ContentCreationModal } from "@/components/content-creation-modal";

export default function ContentManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });

  const filteredCourses = courses.filter((course: any) =>
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
                    Content Management
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Create and manage your course content and materials
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
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Content
                  </Button>
                </div>
              </div>
            </div>

            {/* Course List */}
            {filteredCourses.length > 0 ? (
              <div className="space-y-6">
                {filteredCourses.map((course: any) => (
                  <CourseContentCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {searchTerm ? "No courses found" : "No courses created"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm 
                      ? "Try adjusting your search criteria." 
                      : "Create your first course to start adding content."
                    }
                  </p>
                  {!searchTerm && (
                    <div className="mt-6">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Course
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      <ContentCreationModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
}

function CourseContentCard({ course }: { course: any }) {
  const { data: content = [] } = useQuery({
    queryKey: [`/api/courses/${course.id}/content`],
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{course.title}</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {course.description || "No description available"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={course.status === "active" ? "default" : "secondary"}
              className={course.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400" : ""}
            >
              {course.status}
            </Badge>
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Content
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {content.length > 0 ? (
          <div className="space-y-3">
            {content.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-md flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No content added yet
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              <Plus className="mr-2 h-4 w-4" />
              Add First Content
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
