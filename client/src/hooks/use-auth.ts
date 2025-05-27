import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { authApi, type User } from "@/lib/auth";
import { useToast } from "./use-toast";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Query to get current user
  const {
    data: user,
    isLoading,
    error,
    refetch: refetchUser,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        return await authApi.getCurrentUser();
      } catch (error: any) {
        // If unauthorized, return null instead of throwing
        if (error.message?.includes("401")) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/auth/me"], userData);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${userData.name}`,
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message?.includes("401") 
          ? "Invalid username or password" 
          : "An error occurred during login",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
      setLocation("/login");
    },
    onError: () => {
      // Even if logout fails on server, clear local state
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      setLocation("/login");
      toast({
        title: "Logged out",
        description: "Session ended",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast({
        title: "Account created!",
        description: "You can now log in with your credentials",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message?.includes("400") 
          ? "Username might already exist or invalid data provided" 
          : "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const login = (credentials: { username: string; password: string }) => {
    loginMutation.mutate(credentials);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const register = (data: { username: string; password: string; name: string; role: string }) => {
    registerMutation.mutate(data);
  };

  return {
    // User state
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isTeacher: user?.role === "teacher",
    isStudent: user?.role === "student",

    // Actions
    login,
    logout,
    register,
    refetchUser,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRegistering: registerMutation.isPending,

    // Errors
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
    registerError: registerMutation.error,
  };
}
