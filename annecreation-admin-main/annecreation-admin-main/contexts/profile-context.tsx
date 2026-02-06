"use client"

import React, { createContext, useContext, useEffect, useMemo } from "react"
import { useGetAdminProfileQuery } from "@/lib/redux/api/authApi"
import { AdminProfile } from "@/lib/redux/api/authApi"
import { isAuthenticated } from "@/lib/auth"

interface ProfileContextType {
  profile: AdminProfile | null
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // Only fetch profile if user is authenticated
  const isAuth = typeof window !== 'undefined' ? isAuthenticated() : false
  
  const { 
    data: profileData, 
    isLoading, 
    isError,
    refetch 
  } = useGetAdminProfileQuery(undefined, {
    skip: !isAuth, // Skip query if not authenticated
    refetchOnMountOrArgChange: true, // Refetch on every mount
  })

  // The API transformResponse already handles the structure transformation
  // profileData should already be in AdminProfile format
  const profile = useMemo(() => {
    if (!profileData) return null
    
    // The transformResponse in authApi already transforms the response
    // So profileData should already match AdminProfile interface
    // Just ensure all required fields are present
    return {
      id: profileData.id || '',
      username: profileData.username || '',
      name: profileData.name || '',
      email: profileData.email || '',
      image: profileData.image || '',
      status: profileData.status ?? true,
      isSuperAdmin: profileData.isSuperAdmin || false,
      role: profileData.role ? {
        _id: profileData.role._id || '', // May be empty if not in API response
        name: profileData.role.name || '',
        permissions: profileData.role.permissions || [],
      } : undefined,
      createdAt: profileData.createdAt || '',
      updatedAt: profileData.updatedAt || '',
    } as AdminProfile
  }, [profileData])

  const value = useMemo(() => ({
    profile,
    isLoading,
    isError,
    refetch,
  }), [profile, isLoading, isError, refetch])

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

