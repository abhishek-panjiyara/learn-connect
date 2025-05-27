import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssignmentModal({ isOpen, onClose }: AssignmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    dueDate: "",
    maxPoints: 100,
    instructions: "",
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/assignments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Assignment created successfully!",
        description: "Your new assignment has been added to the course.",
      });
      resetForm();
      onClose();
    },
    onError: () => {
      toast({
        title: "Failed to create assignment",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      courseId: "",
      dueDate: "",
      maxPoints: 100,
      instructions: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Assignment title is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.courseId) {
      toast({
        title: "Validation Error",
        description: "Please select a course.",
        variant: "destructive",
      });
      return;
    }

    if (formData.maxPoints <= 0) {
      toast({
        title: "Validation Error",
        description: "Max points must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    createAssignmentMutation.mutate({
      ...formData,
      courseId: parseInt(formData.courseId),
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Create New Assignment
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="assignmentTitle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Assignment Title
            </Label>
            <Input
              id="assignmentTitle"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter assignment title"
              className="w-full"
              disabled={createAssignmentMutation.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseSelect" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Course
            </Label>
            <Select
              value={formData.courseId}
              onValueChange={(value) => setFormData({ ...formData, courseId: value })}
              disabled={createAssignmentMutation.isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course: any) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date
              </Label>
              <div className="relative">
                <Input
                  id="dueDate"
                  type="date"
                  value={formatDateForInput(formData.dueDate)}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full"
                  disabled={createAssignmentMutation.isPending}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPoints" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Points
              </Label>
              <Input
                id="maxPoints"
                type="number"
                value={formData.maxPoints}
                onChange={(e) => setFormData({ ...formData, maxPoints: parseInt(e.target.value) || 0 })}
                placeholder="100"
                min="1"
                className="w-full"
                disabled={createAssignmentMutation.isPending}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignmentDescription" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </Label>
            <Textarea
              id="assignmentDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the assignment..."
              rows={3}
              className="w-full"
              disabled={createAssignmentMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Instructions
            </Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Detailed instructions for students..."
              rows={6}
              className="w-full"
              disabled={createAssignmentMutation.isPending}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createAssignmentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAssignmentMutation.isPending}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
