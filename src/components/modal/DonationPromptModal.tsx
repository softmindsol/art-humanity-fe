// src/components/modal/DonationPromptModal.tsx

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

// Props ke liye interface
interface DonationPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDonateClick: () => void;
}

const DonationPromptModal: React.FC<DonationPromptModalProps> = ({ isOpen, onClose, onDonateClick }) => {

    const handleDonate = () => {
        onClose(); // Pehle is modal ko band karo
        onDonateClick(); // Phir donation form wala process shuru karo
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif]">
                <DialogHeader>
                    <div className="flex justify-center items-center mb-4">
                        <Heart className="text-red-400" size={48} />
                    </div>
                    <DialogTitle className="text-2xl !text-white text-center">Support Collaborative Art</DialogTitle>
                    <DialogDescription className="pt-4 text-base text-gray-300 text-center">
                        Our platform is a community-driven space for creativity. Your donation helps us maintain the servers, develop new features, and keep the art alive.
                        <br /><br />
                        Every contribution, big or small, makes a difference.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex sm:justify-center">
                    <Button onClick={onClose} variant="outline" className="cursor-pointer">
                        Maybe Later
                    </Button>
                    <Button
                        onClick={handleDonate}
                        className="cursor-pointer border-white bg-green-600 text-white hover:bg-green-700"
                    >
                        Donate Now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DonationPromptModal;