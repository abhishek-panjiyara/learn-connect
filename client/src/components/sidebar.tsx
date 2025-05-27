import { Home, Plus, BookOpen, ClipboardList, Users, BarChart3, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const isTeacher = user?.role === "teacher";

  const teacherMenuItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Plus, label: "Create Content", href: "/content" },
    { icon: BookOpen, label: "My Courses", href: "/courses" },
    { icon: ClipboardList, label: "Assignments", href: "/assignments" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
  ];

  const studentMenuItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: BookOpen, label: "My Courses", href: "/courses" },
    { icon: ClipboardList, label: "Assignments", href: "/assignments" },
    { icon: GraduationCap, label: "Progress", href: "/progress" },
  ];

  const menuItems = isTeacher ? teacherMenuItems : studentMenuItems;

  return (
    <aside className="hidden lg:flex lg:flex-shrink-0 lg:w-64">
      <div className="flex flex-col w-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-6">
            <div className="w-full">
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 border border-primary-200 dark:border-primary-800">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {isTeacher ? (
                      <GraduationCap className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                      {isTeacher ? "Teacher Mode" : "Student Mode"}
                    </p>
                    <p className="text-xs text-primary-600 dark:text-primary-400">
                      {isTeacher ? "Content Creator" : "Learner"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {menuItems.map((item) => {
              const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-l-4 border-primary-600 dark:border-primary-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <item.icon 
                    className={`mr-3 h-5 w-5 ${
                      isActive 
                        ? "text-primary-500 dark:text-primary-400" 
                        : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                    }`} 
                  />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
