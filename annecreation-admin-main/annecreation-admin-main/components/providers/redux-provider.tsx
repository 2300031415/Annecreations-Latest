"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/redux/store";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ProfileProvider } from "@/contexts/profile-context";
import { Toaster } from "sonner";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ProfileProvider>
          {children}
          <Toaster position="top-right" richColors />
        </ProfileProvider>
      </AuthProvider>
    </Provider>
  );
}
