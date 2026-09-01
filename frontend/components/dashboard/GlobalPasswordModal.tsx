"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import SetPasswordModal from "./SetPasswordModal";

export default function GlobalPasswordModal() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    // Do not show on public routes
    if (pathname === "/login" || pathname === "/register" || pathname === "/" || pathname === "/how-it-works") {
      return;
    }
    
    if (user && user.has_password === false) {
      const dismissed = sessionStorage.getItem("dismissedPasswordModal");
      if (!dismissed) {
        setShowPasswordModal(true);
      }
    }
  }, [user, pathname]);

  if (!showPasswordModal) return null;

  const handleDismissModal = () => {
    sessionStorage.setItem("dismissedPasswordModal", "true");
    setShowPasswordModal(false);
  };

  return (
    <SetPasswordModal 
      onSuccess={handleDismissModal} 
      defaultUsername={user?.username || ""} 
    />
  );
}
