import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, Assignment, Submission } from '@/lib/queryClient'; // Assuming these types exist
import { AlertTriangle, ArrowLeft, Send, CheckCircle, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NavigationHeader } from '@/components/navigation-header';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// Define a more detailed Submission type if it includes assignment, student, course
type SubmissionDetails = Submission & {
  assignment?: Assignment; 
  // student?: User; // User type needed if we want to display student details
  course?: { id: number; title: string }; // Simplified course type
};


const SubmitAssignmentPage: React.FC = () => {
  const [, params] = useRoute<{ courseId: string; assignmentId: string }>("/courses/:courseId/assignments/:assignmentId/submit");
  const courseId = params?.courseId;
  const assignmentId = params?.assignmentId;
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [submissionContent, setSubmissionContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // 1. Fetch Assignment Details (even if we get it from submission, good for standalone view)
  const { 
    data: assignment, 
    isLoading: isLoadingAssignment, 
    error: assignmentError 
  } = useQuery<Assignment, Error>({
    queryKey: ['assignmentDetails', assignmentId],
    queryFn: async () => {
      if (!assignmentId) throw new Error("Assignment ID is missing");
      // Assuming a general /api/assignments/:id endpoint exists or modify as needed
      // For now, this might be redundant if submissionDetails includes assignment info.
      // Let's assume we need to fetch assignment details separately if not part of submission details.
      // This is a placeholder. The actual assignment details might come from the submission query.
      const response = await apiRequest('GET', `/api/assignments/${assignmentId}`); // This endpoint might not exist, adjust if needed
      if (!response.ok) throw new Error('Failed to fetch assignment details.');
      return response.json();
    },
    enabled: !!assignmentId,
  });

  // 2. Fetch Existing Submission Details
  // We need an endpoint that gets a submission by assignmentId AND studentId,
  // OR the getSubmissionDetails endpoint needs to be adapted if we don't know submissionId beforehand.
  // For now, using the logic from getAssignmentsForCourse which provided submissionId.
  // This query will be more robust if we can get a submission by (assignmentId, studentId).
  // Let's assume for now the student navigates here WITH a submissionId if one exists,
  // or we modify this to fetch submission by assignmentId + userId.
  // Using a placeholder query key, actual submissionId might be passed or determined.
  // This part is tricky without knowing the exact previous navigation flow or available endpoints.
  // Let's assume we try to find a submission by assignmentId for the current user.
  // This is a conceptual query. `getSubmissionByAssignmentAndStudent` from storage is not directly exposed.
  // The `GET /api/courses/:courseId/assignments` already provides submissionId and status.
  // We can use that submissionId if available.
  
  // Simplified: We will rely on user navigating with a submissionId if they have one from the previous page.
  // Or, more practically, the previous page (course-content) should pass submissionId if it exists.
  // For this example, let's assume `assignment.submissionId` is passed from previous state or fetched.
  // This part requires more context on how `submissionId` is obtained when navigating to this page.
  // For now, let's assume we fetch submission by assignmentId and studentId (conceptual endpoint).
  
  const { 
    data: submission, 
    isLoading: isLoadingSubmission, 
    error: submissionError,
    refetch: refetchSubmission,
  } = useQuery<SubmissionDetails, Error>({
    // Try to get submission details if a submissionId is known (e.g. from `assignment.submissionId`)
    // This is a simplified approach. A real app might need a dedicated endpoint:
    // `GET /api/assignments/:assignmentId/mysubmission`
    // For now, we'll assume this query is smart enough or the submissionId is known.
    // This query will need to be adjusted based on actual API capabilities for fetching current user's submission for an assignment.
    // A common pattern is to fetch assignments for a course, and that data includes submission status/ID for the current user.
    // Then, if submissionId exists, fetch its details.
    queryKey: ['submissionForAssignment', assignmentId, user?.id],
    queryFn: async () => {
      if (!assignmentId || !user?.id) throw new Error("Missing IDs for submission query");
      // This is a conceptual call. The backend might need a specific endpoint like:
      // GET /api/assignments/:assignmentId/submission (for current user)
      // Or, if the submissionId is known from the assignments list:
      // GET /api/submissions/:submissionId
      // For now, let's simulate trying to find if a submission exists by assignmentId for the user
      const assignmentsListResponse = await apiRequest('GET', `/api/courses/${courseId}/assignments`);
      if (!assignmentsListResponse.ok) throw new Error('Failed to check existing submissions.');
      const assignmentsWithStatus: AssignmentWithSubmissionStatus[] = await assignmentsListResponse.json();
      const currentAssignment = assignmentsWithStatus.find(a => a.id.toString() === assignmentId);
      if (currentAssignment?.submissionId) {
        const subResponse = await apiRequest('GET', `/api/submissions/${currentAssignment.submissionId}`);
        if (!subResponse.ok) {
          const errData = await subResponse.json();
          // If submission not found (e.g., 404), it means no submission yet. Don't throw error.
          if (subResponse.status === 404) return null as any; // Treat as no submission
          throw new Error(errData.message || 'Failed to fetch submission details');
        }
        return subResponse.json();
      }
      return null as any; // No submission ID found, so no submission yet
    },
    enabled: !!assignmentId && !!user?.id && !!courseId,
    retry: 1, // Retry once if it fails
  });


  useEffect(() => {
    if (submission) {
      setSubmissionContent(submission.content || '');
      setIsEditing(false); // Default to view mode if submission exists
    } else {
      setIsEditing(true); // Default to edit mode if no submission
    }
  }, [submission]);

  const submitMutation = useMutation({
    mutationFn: async (newContent: string) => {
      if (!assignmentId) throw new Error("Assignment ID is missing for submission");
      const payload: { content: string; submissionId?: number } = { content: newContent };
      if (submission && submission.id) {
        payload.submissionId = submission.id; // Pass submissionId if updating
      }
      const response = await apiRequest('POST', `/api/assignments/${assignmentId}/submit`, payload);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit assignment");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: `Assignment ${submission?.id ? 'updated' : 'submitted'} successfully.` });
      queryClient.invalidateQueries({ queryKey: ['courseAssignments', courseId] }); // Refresh assignments list on course page
      queryClient.invalidateQueries({ queryKey: ['submissionForAssignment', assignmentId, user?.id] }); // Refresh current submission
      refetchSubmission(); // Refetch to get latest submission state (e.g. new submission ID)
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionContent.trim()) {
      toast({ title: "Cannot Submit", description: "Submission content cannot be empty.", variant: "destructive" });
      return;
    }
    submitMutation.mutate(submissionContent);
  };
  
  const pageTitle = assignment ? `Submission: ${assignment.title}` : "Submit Assignment";

  if (isLoadingAssignment || (isLoadingSubmission && !submission)) { // Show loading if either assignment or initial submission check is happening
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationHeader />
        <div className="flex"> <Sidebar /> <main className="flex-1 p-8 text-center"> <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div> <p className="mt-4">Loading submission interface...</p> </main> </div>
      </div>
    );
  }

  if (assignmentError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationHeader />
        <div className="flex"> <Sidebar /> <main className="flex-1 p-8 text-center"> <AlertTriangle className="mx-auto h-12 w-12 text-red-500" /> <h1 className="mt-4 text-xl font-semibold text-destructive">Error Loading Assignment</h1> <p>{assignmentError.message}</p> </main> </div>
      </div>
    );
  }
  
  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationHeader />
        <div className="flex"> <Sidebar /> <main className="flex-1 p-8 text-center"> <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" /> <h1 className="mt-4 text-xl font-semibold">Assignment Not Found</h1> </main> </div>
      </div>
    );
  }
  
  // Due date logic (simplified)
  const isPastDue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Link href={`/courses/${courseId}/content`} className="inline-flex items-center text-sm text-primary hover:underline mb-4">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Course Content
          </Link>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-primary">{assignment.title}</CardTitle>
              <CardDescription className="text-md text-gray-600 dark:text-gray-400 mt-1">
                {assignment.description || "No description provided."}
              </CardDescription>
              {assignment.dueDate && (
                <p className={`text-sm mt-2 ${isPastDue ? 'text-red-500' : 'text-gray-500'}`}>
                  Due: {new Date(assignment.dueDate).toLocaleDateString()} {new Date(assignment.dueDate).toLocaleTimeString()}
                  {isPastDue && <Badge variant="destructive" className="ml-2">Past Due</Badge>}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {submissionError && !isLoadingSubmission && ( // Show submission-specific error if it occurs after initial load
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  Error loading submission details: {submissionError.message}
                </div>
              )}

              {submission && !isEditing ? (
                // View existing submission
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Your Submission:</h3>
                    <Badge className={submission.status === 'graded' ? 'bg-green-500' : 'bg-blue-500'}>
                      Status: {submission.status} {submission.status === 'graded' && submission.grade ? `(${submission.grade}%)` : ''}
                    </Badge>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Submitted on: {new Date(submission.submittedAt || '').toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-700 whitespace-pre-wrap">
                    {submission.content}
                  </div>
                  {submission.feedback && (
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Feedback:</h3>
                      <div className="p-4 border rounded-md bg-yellow-50 dark:bg-yellow-700/20 whitespace-pre-wrap">
                        {submission.feedback}
                      </div>
                    </div>
                  )}
                  {!isPastDue && ( // Allow editing only if not past due (basic logic)
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      <Edit3 className="mr-2 h-4 w-4" /> Edit Submission
                    </Button>
                  )}
                </div>
              ) : (
                // Submission form
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="submissionContent" className="text-lg font-semibold">
                      {submission?.id ? "Edit Your Submission:" : "Your Submission:"}
                    </Label>
                    <Textarea
                      id="submissionContent"
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      rows={10}
                      className="mt-2"
                      placeholder="Type your submission here..."
                      disabled={submitMutation.isPending || (isPastDue && !submission?.id)} // Disable if past due and no existing submission to edit
                    />
                    {isPastDue && !submission?.id && <p className="text-sm text-red-500 mt-1">Cannot submit, assignment is past due.</p>}
                  </div>
                  <Button type="submit" disabled={submitMutation.isPending || (isPastDue && !submission?.id)}>
                    {submitMutation.isPending ? <Send className="mr-2 h-4 w-4 animate-pulse" /> : <Send className="mr-2 h-4 w-4" />}
                    {submission?.id ? 'Update Submission' : 'Submit Assignment'}
                  </Button>
                  {submission?.id && isEditing && (
                     <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={submitMutation.isPending}>Cancel</Button>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default SubmitAssignmentPage;
