// src/components/modal/ConfirmationModal.tsx

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react"; // Icon for confirmation

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string; // Optional: "Confirm" button text
  cancelText?: string; // Optional: "Cancel" button text
  isLoading?: boolean; // Optional: Loading state for confirmation
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}) => {
  // Disable body scroll when the modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null; // Do not render the modal if it's not open

  return (
    <div className="fixed inset-0  backdrop-blur-sm flex justify-center items-center z-[2000]">
      <div className="relative bg-[#0F0D0D] w-[90%] sm:w-[450px] border border-white/20 rounded-[12px]  p-8 font-montserrat animation-fade-in transform transition-all scale-100">
        {/* Decorative Gradient Glow */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full  flex items-center justify-center mb-6 border border-red-500/20 ">
            <LogOut className="text-red-500" size={32} />
          </div>

          <h2 className="text-2xl font-bold !text-white mb-3">{title}</h2>
          <p className="text-[#AAB2C7] text-sm leading-relaxed mb-8 max-w-[90%]">
            {description}
          </p>

          <div className="flex gap-4 w-full">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-11 rounded-full border border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white transition-all font-medium"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 h-11 rounded-full border-none bg-gradient-to-r from-red-600 to-red-500 text-white hover:opacity-90 transition-all font-medium shadow-lg shadow-red-500/20"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
