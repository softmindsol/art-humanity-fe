import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

interface CustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDonateClick: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({ isOpen, onClose, onDonateClick }) => {
    if (!isOpen) return null; 

    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center  z-50">
            <div className="bg-[#5d4037] border-2 border-[#3e2723] text-white w-[90%]  sm:w-[500px] font-[Georgia, serif] p-6 rounded-lg shadow-lg">
                <div className="flex justify-center items-center mb-4">
                    <Heart className="text-red-400" size={48} />
                </div>
                <h2 className="text-2xl !text-white text-center">Support Collaborative Art</h2>
                <p className="pt-4 text-base text-gray-300 text-center">
                    Our platform is a community-driven space for creativity. Your donation helps us maintain the servers, develop new features, and keep the art alive.
                    <br /><br />
                    Every contribution, big or small, makes a difference.
                </p>
                <div className="mt-4 flex justify-center">
                    <Button onClick={onClose} variant="outline" className="cursor-pointer">
                        Maybe Later
                    </Button>
                    {/* <Button
                        onClick={onDonateClick}
                        className="cursor-pointer border-white bg-green-600 text-white hover:bg-green-700 ml-4"
                    >
                        Donate Now
                    </Button> */}
                </div>
            </div>
        </div>
    );
};

export default CustomModal;
