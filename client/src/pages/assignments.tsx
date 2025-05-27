import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Plus, Calendar, Users, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NavigationHeader } from "@/components/navigation-header";
import { Sidebar } from "@/components/sidebar";
import { AssignmentModal } from "@/components/assignment-modal";
import { useAuth } from "@/hooks/use-auth";

export default function Assignments() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: assignments = [] } = useQuery({
    queryKey: ["/api/assignments"],
  });

  const isTeacher = user?.role === "teacher";

  const filteredAssignments = assignments.filter((assignment: any) =>
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase())
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
                    {isTeacher ? "Assignment Management" : "My Assignments"}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isTeacher 
                      ? "Create and manage assignments for your courses" 
                      : "View and submit your assignments"
                    }
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search assignments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  {isTeacher && (
                    <Button 
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Assignment
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Assignments Grid */}
            {filteredAssignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssignments.map((assignment: any) => (
                  <AssignmentCard 
                    key={assignment.id} 
                    assignment={assignment} 
                    isTeacher={isTeacher} 
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {searchTerm ? "No assignments found" : "No assignments"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm 
                      ? "Try adjusting your search criteria." 
                      : isTeacher 
                        ? "Create your first assignment to get started."
                        : "No assignments available at the moment."
                    }
                  </p>
                  {!searchTerm && isTeacher && (
                    <div className="mt-6">
                      <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Assignment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {isTeacher && (
        <AssignmentModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
        />
      )}
    </div>
  );
}

function AssignmentCard({ assignment, isTeacher }: { assignment: any; isTeacher: boolean }) {
  const { data: submissions = [] } = useQuery({
    queryKey: [`/api/assignments/${assignment.id}/submissions`],
  });

  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date();
  const submissionCount = submissions.length;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {assignment.description || "No description available"}
            </p>
          </div>
          <Badge 
            variant={isOverdue ? "destructive" : "default"}
            className={!isOverdue ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400" : ""}
          >
            {isOverdue ? "Overdue" : "Active"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dueDate && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Due: {dueDate.toLocaleDateString()}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <ClipboardList className="mr-2 h-4 w-4" />
            <span>Max Points: {assignment.maxPoints}</span>
          </div>

          {isTeacher && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Users className="mr-2 h-4 w-4" />
              <span>{submissionCount} submissions</span>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" size="sm">
              {isTeacher ? "View Submissions" : "View Details"}
            </Button>
            
            {!isTeacher && (
              <Button size="sm">
                {submissionCount > 0 ? "View Submission" : "Submit"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
