// src/components/modal/ConfirmationModal.tsx

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react'; // Ek munasib icon

// Props ke liye interface
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string; // Optional: "Confirm" button ka text
    cancelText?: string;  // Optional: "Cancel" button ka text
    isLoading?: boolean; // Optional: Loading state ke liye
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
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif]">
                <DialogHeader>
                    <div className="flex justify-center items-center mb-4">
                        <LogOut className="text-red-400" size={48} />
                    </div>
                    <DialogTitle className="text-2xl !text-white text-center">{title}</DialogTitle>
                    <DialogDescription className="pt-4 text-base text-gray-300 text-center">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex sm:justify-center">
                    <Button onClick={onClose} variant="outline" className="cursor-pointer">
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="cursor-pointer border-white bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {isLoading ? "Logging out..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmationModal;