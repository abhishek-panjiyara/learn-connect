import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, UserProfile } from '@/lib/queryClient'; // Assuming UserProfile type is defined here or in a shared types file

const ProfilePage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const { data: user, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users/profile');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch profile');
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatar || '');
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: { name?: string; avatar?: string }) => {
      const response = await apiRequest('PUT', '/api/users/profile', updatedProfile);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: (updatedUserData) => {
      queryClient.setQueryData(['userProfile'], updatedUserData); // Update cache with new data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }); // Corrected queryKey to match useAuth
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: { name?: string; avatar?: string } = {};
    if (name !== user?.name) updates.name = name;
    if (avatarUrl !== user?.avatar) updates.avatar = avatarUrl;

    if (Object.keys(updates).length > 0) {
      updateProfileMutation.mutate(updates);
    } else {
      toast({
        title: 'No Changes',
        description: 'You haven\'t made any changes to your profile.',
      });
    }
  };

  if (isLoading) return <div className="container mx-auto p-4">Loading profile...</div>;
  if (error) return <div className="container mx-auto p-4 text-red-500">Error: {error.message}</div>;
  if (!user) return <div className="container mx-auto p-4">Could not load user profile.</div>;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">User Profile</h1>
      <div className="flex flex-col items-center space-y-6 mb-8">
        <Avatar className="h-32 w-32 border-4 border-primary">
          <AvatarImage src={avatarUrl || user.avatar} alt={user.username} />
          <AvatarFallback className="text-4xl">
            {user.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-semibold text-center">{user.username}</h2>
          {user.name && <p className="text-gray-600 dark:text-gray-400 text-center">{user.name}</p>}
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6 bg-card p-6 rounded-lg shadow-md">
        <div>
          <Label htmlFor="username" className="text-sm font-medium">Username</Label>
          <Input
            id="username"
            type="text"
            value={user.username}
            disabled // Username is typically not editable
            className="mt-1 block w-full bg-muted border-muted-foreground/20"
          />
        </div>
        <div>
          <Label htmlFor="name" className="text-sm font-medium">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="mt-1 block w-full border-input"
          />
        </div>
        <div>
          <Label htmlFor="avatarUrl" className="text-sm font-medium">Avatar URL</Label>
          <Input
            id="avatarUrl"
            type="text"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            className="mt-1 block w-full border-input"
          />
        </div>
        <Button type="submit" className="w-full" disabled={updateProfileMutation.isPending}>
          {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
        </Button>
      </form>
    </div>
  );
};

export default ProfilePage;
