// src/components/modal/ConfirmationModal.tsx

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react'; // Icon for confirmation

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string; // Optional: "Confirm" button text
    cancelText?: string;  // Optional: "Cancel" button text
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
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null; // Do not render the modal if it's not open

    return (
        <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-[#5d4037] w-[90%] border-2 border-[#3e2723] text-white font-[Georgia, serif] p-6 rounded-lg shadow-lg  sm:w-[500px]">
                <div className="flex justify-center items-center mb-4">
                    <LogOut className="text-red-400" size={48} />
                </div>
                <h2 className="text-2xl !text-white text-center mb-4">{title}</h2>
                <p className="text-white text-center mb-6">{description}</p>

                {/* Buttons for Cancel and Confirm */}
                <div className="flex justify-center space-x-4">
                    <Button onClick={onClose} variant="outline" className="cursor-pointer"> {cancelText} </Button> <Button onClick={onConfirm} disabled={isLoading} className="cursor-pointer border-white bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" > {isLoading ? "Logging out..." : confirmText} </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
