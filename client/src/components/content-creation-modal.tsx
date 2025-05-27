import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
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

interface ContentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContentCreationModal({ isOpen, onClose }: ContentCreationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    courseId: "",
    content: "",
    order: 0,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });

  const createContentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/content", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Content created successfully!",
        description: "Your new content has been added to the course.",
      });
      resetForm();
      onClose();
    },
    onError: () => {
      toast({
        title: "Failed to create content",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "",
      courseId: "",
      content: "",
      order: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Content title is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.type) {
      toast({
        title: "Validation Error",
        description: "Content type is required.",
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

    createContentMutation.mutate({
      ...formData,
      courseId: parseInt(formData.courseId),
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Create New Content
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
            <Label htmlFor="contentTitle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Content Title
            </Label>
            <Input
              id="contentTitle"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter content title"
              className="w-full"
              disabled={createContentMutation.isPending}
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
              disabled={createContentMutation.isPending}
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

          <div className="space-y-2">
            <Label htmlFor="contentType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Content Type
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              disabled={createContentMutation.isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lesson">Lesson</SelectItem>
                <SelectItem value="resource">Resource</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentDescription" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </Label>
            <Textarea
              id="contentDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your content..."
              rows={3}
              className="w-full"
              disabled={createContentMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentBody" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Content
            </Label>
            <Textarea
              id="contentBody"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter your content here..."
              rows={6}
              className="w-full"
              disabled={createContentMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentOrder" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Order
            </Label>
            <Input
              id="contentOrder"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              placeholder="Content order (0 for first)"
              min="0"
              className="w-full"
              disabled={createContentMutation.isPending}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createContentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createContentMutation.isPending}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {createContentMutation.isPending ? "Creating..." : "Create Content"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
