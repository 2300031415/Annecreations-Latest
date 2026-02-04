import { useEffect } from "react";
import { useAuthStore } from '@/Store/authStore';

const useFetchUserProfile = () => {
  const { user, getProfile, isLoading, error } = useAuthStore();

  // Fetch profile on mount if user data is not already present
  useEffect(() => {
    getProfile();
  },[getProfile]);

  return {
    data: user,
    isLoading,
    error,
   
  };
};

export default useFetchUserProfile;
