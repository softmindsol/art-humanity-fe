import { useState } from "react";

export const useOpenAuth = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return { isAuthModalOpen, setIsAuthModalOpen };
}