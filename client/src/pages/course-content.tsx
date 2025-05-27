import React, { useState } from 'react'; // Added useState
import { useRoute, Link } from 'wouter'; // Added Link
import { useQuery } from '@tanstack/react-query';
import { apiRequest, CourseWithContent, AssignmentWithSubmissionStatus } from '@/lib/queryClient'; // Added AssignmentWithSubmissionStatus
import { AlertTriangle, BookOpen, Video, FileText, ExternalLink, Edit3, CheckCircle, Clock } from 'lucide-react'; // Added more icons
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Added Button
import { NavigationHeader } from '@/components/navigation-header';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/hooks/use-auth';

// Helper to get icon based on content type
const ContentIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'lesson': return <BookOpen className="mr-2 h-5 w-5 text-blue-500" />;
    case 'video': return <Video className="mr-2 h-5 w-5 text-red-500" />;
    case 'document': return <FileText className="mr-2 h-5 w-5 text-green-500" />;
    default: return <BookOpen className="mr-2 h-5 w-5 text-gray-500" />;
  }
};

const CourseContentPage: React.FC = () => {
  const [, params] = useRoute<{ courseId: string }>("/courses/:courseId/content");
  const courseId = params?.courseId;
  const { user } = useAuth(); // To ensure sidebar and nav header render correctly

  const { data: courseData, isLoading: isLoadingCourse, error: courseError } = useQuery<CourseWithContent, Error>({ // Renamed isLoading and error
    queryKey: ['courseContent', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error("Course ID is missing");
      const response = await apiRequest('GET', `/api/courses/${courseId}/content`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch course content (status: ${response.status})`);
      }
      return response.json();
    },
    enabled: !!courseId, // Only run query if courseId is available
  });

  if (!user) { // Should be handled by ProtectedRoute, but good for robustness
    return <div className="p-4">Please log in to view course content.</div>;
  }
  
  if (!courseId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <h1 className="mt-4 text-xl font-semibold">Invalid Course ID</h1>
            <p className="text-gray-600 dark:text-gray-400">The course ID is missing from the URL.</p>
          </main>
        </div>
      </div>
    );
  }

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course content...</p>
          </main>
        </div>
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="mt-4 text-xl font-semibold text-destructive">Error Loading Course</h1>
            <p className="text-gray-600 dark:text-gray-400">{error.message}</p>
            <p className="mt-2 text-sm text-gray-500">
              This could be because the course does not exist, or you are not enrolled.
            </p>
          </main>
        </div>
      </div>
    );
  }

  if (!courseData) {
     return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <h1 className="mt-4 text-xl font-semibold">Course Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400">The requested course data could not be loaded.</p>
          </main>
        </div>
      </div>
    );
  }
  
  const { title, description, content: courseContentItems } = courseData; // Renamed content to courseContentItems

  // Fetch assignments for the course
  const { 
    data: assignmentsData, 
    isLoading: isLoadingAssignments, 
    error: assignmentsError 
  } = useQuery<(AssignmentWithSubmissionStatus[]), Error>({
    queryKey: ['courseAssignments', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error("Course ID is missing for assignments");
      const response = await apiRequest('GET', `/api/courses/${courseId}/assignments`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch assignments (status: ${response.status})`);
      }
      return response.json();
    },
    enabled: !!courseId && !!user, // Only run if courseId and user are available
  });

  const getSubmissionStatusBadge = (status?: string, grade?: number | null) => {
    if (grade !== null && grade !== undefined) {
      return <Badge className="bg-green-600 hover:bg-green-700 text-white">Graded: {grade}%</Badge>;
    }
    switch (status) {
      case 'submitted':
      case 'resubmitted':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Submitted</Badge>;
      case 'pending': // If there's a pending review status
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending Review</Badge>;
      case 'not-submitted':
      default:
        return <Badge variant="outline">Not Submitted</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Course Info Card */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-primary">{title}</CardTitle>
              <CardDescription className="text-md text-gray-600 dark:text-gray-400 mt-1">
                {description || "No description available for this course."}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Course Content Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Course Content</h2>
            <div className="space-y-6">
              {courseContentItems && courseContentItems.length > 0 ? (
                courseContentItems.map((item, index) => (
                  <Card key={item.id || index} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center">
                        <ContentIcon type={item.type || 'lesson'} />
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                      </div>
                      <Badge variant="outline" className="capitalize">{item.type || 'N/A'}</Badge>
                    </CardHeader>
                    <CardContent>
                      {item.description && <p className="text-gray-700 dark:text-gray-300 mb-3">{item.description}</p>}
                      {item.content && (item.type === 'lesson' || item.type === 'text') && (
                         <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
                      )}
                      {item.content && (item.type === 'video' || item.type === 'document' || item.type === 'link') && (
                        item.content.startsWith('http://') || item.content.startsWith('https://') ? (
                          <a
                            href={item.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View Resource <ExternalLink className="ml-1 h-4 w-4" />
                          </a>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">Resource path: {item.content} (Not a valid link)</p>
                        )
                      )}
                      {!item.content && <p className="text-sm text-gray-500 dark:text-gray-400">No content provided for this item.</p>}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card><CardContent className="text-center py-12"><BookOpen className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-lg font-medium">No content available</h3><p className="mt-1 text-sm text-gray-500">This course does not have any content items yet.</p></CardContent></Card>
              )}
            </div>
          </section>

          {/* Assignments Section */}
          {user?.role === 'student' && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Assignments</h2>
              {isLoadingAssignments && <p className="text-gray-600 dark:text-gray-400">Loading assignments...</p>}
              {assignmentsError && <p className="text-red-500">Error loading assignments: {assignmentsError.message}</p>}
              
              {!isLoadingAssignments && !assignmentsError && assignmentsData && assignmentsData.length > 0 ? (
                <div className="space-y-6">
                  {assignmentsData.map((assignment) => (
                    <Card key={assignment.id} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                          <CardTitle className="text-xl mb-2 sm:mb-0">{assignment.title}</CardTitle>
                          {getSubmissionStatusBadge(assignment.submissionStatus, assignment.grade)}
                        </div>
                        {assignment.dueDate && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        {assignment.description && <p className="text-gray-700 dark:text-gray-300 mb-4">{assignment.description}</p>}
                        <Link href={`/courses/${courseId}/assignments/${assignment.id}/submit`}>
                          <Button variant="default">
                            {assignment.submissionStatus === 'not-submitted' ? <Edit3 className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            {assignment.submissionStatus === 'not-submitted' ? 'Submit Assignment' : 'View/Edit Submission'}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                !isLoadingAssignments && !assignmentsError && (
                  <Card><CardContent className="text-center py-12"><BookOpen className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-lg font-medium">No assignments</h3><p className="mt-1 text-sm text-gray-500">There are no assignments for this course yet.</p></CardContent></Card>
                )
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default CourseContentPage;
