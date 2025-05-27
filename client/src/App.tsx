import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import TeacherDashboard from "@/pages/teacher-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import Courses from "@/pages/courses";
import ContentManagement from "@/pages/content-management";
import Assignments from "@/pages/assignments";
import CourseContentPage from "@/pages/course-content";
import NotFound from "@/pages/not-found";
import ProfilePage from "@/pages/profile";
import SubmitAssignmentPage from "@/pages/submit-assignment"; // Import the SubmitAssignmentPage component
import { useAuth } from "@/hooks/use-auth";

/**
 * Renders a component only if the user is authenticated and, optionally, has an allowed role.
 *
 * If authentication is loading, displays a loading spinner. If the user is not authenticated, renders the login page. If the user's role is not permitted, renders a not found page. Otherwise, renders the specified component.
 *
 * @param component - The component to render if access is granted.
 * @param allowedRoles - Optional list of user roles permitted to access the component.
 */
function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <NotFound />;
  }

  return <Component />;
}

/**
 * Defines the application's route structure and access control.
 *
 * Configures routes for authentication, dashboard, courses, assignments, profile, and dynamic course content and assignment submission pages. Most routes are protected by authentication and, where specified, role-based access using the {@link ProtectedRoute} component. Unmatched routes render the {@link NotFound} page.
 */
function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/courses" component={() => <ProtectedRoute component={Courses} />} />
      <Route path="/content" component={() => <ProtectedRoute component={ContentManagement} allowedRoles={["teacher"]} />} />
      <Route path="/assignments" component={() => <ProtectedRoute component={Assignments} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/courses/:courseId/content" component={() => <ProtectedRoute component={CourseContentPage} />} />
      <Route path="/courses/:courseId/assignments/:assignmentId/submit" component={() => <ProtectedRoute component={SubmitAssignmentPage} />} /> {/* Add assignment submission route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function Dashboard() {
  const { user } = useAuth();
  
  if (user?.role === "teacher") {
    return <TeacherDashboard />;
  } else {
    return <StudentDashboard />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
