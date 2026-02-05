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
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-[2000]">
      <div className="relative bg-[#0F0D0D] w-[90%] sm:w-[500px] border border-white/20 rounded-[12px]  xl:p-8 md:p-6 p-4 font-montserrat animation-fade-in transform transition-all scale-100">
        {/* Decorative Gradient Glow */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center md:mb-6 !mb-3 border border-red-500/30 ">
            <LogOut className="text-red-500 lg:size-6 size-5 ml-1" />
          </div>

          <h2 className="lg:text-2xl md:text-xl text-lg font-bold !text-white md:!mb-3 !mb-1.5">
            {title}
          </h2>
          <p className="text-[#AAB2C7] text-sm leading-relaxed md:mb-8 !mb-5 max-w-[90%]">
            {description}
          </p>

          <div className="flex md:gap-3.5 gap-3 w-full">
            <div className="p-[1.5px] flex-1 rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133]">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 h-10 w-full rounded-full bg-black text-white 
               hover:bg-white/5 transition-all font-medium border-0"
              >
                {cancelText}
              </Button>
            </div>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 h-11 rounded-full border-none bg-[#BE0000] text-white hover:bg-[#d70f0f] transition-all font-medium hover:shadow-lg hover:shadow-red-500/30 cursor-pointer"
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
