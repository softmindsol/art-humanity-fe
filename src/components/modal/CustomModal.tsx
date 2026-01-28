import React, { useEffect } from 'react';
import { X } from 'lucide-react'; // Using Lucide's X icon for close functionality

interface CustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    handleSupportClick?: () => void;
    children: React.ReactNode; // The modal content
}

const CustomModal: React.FC<CustomModalProps> = ({ isOpen, onClose, children }) => {
    // Disable body scroll when the modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'; // Disable scroll when modal is open
        } else {
            document.body.style.overflow = 'auto'; // Enable scroll when modal is closed
        }

        return () => {
            document.body.style.overflow = 'auto'; // Clean up on unmount
        };
    }, [isOpen]);

    if (!isOpen) return null; // Don't render the modal if it's not open

    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif] p-6 rounded-lg shadow-lg w-[90%] sm:w-[500px] relative">
                {/* Close Icon in the top right corner */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors"
                >
                    <X size={24} />
                </button>

                {children} {/* Render the content inside the modal */}
            </div>
        </div>
    );
};

export default CustomModal;
