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
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm p-4">
            <div className="w-full max-w-[535px] p-[1px] rounded-[12px] bg-gradient-to-br from-[#545454] to-[#212121] shadow-2xl relative">
                <div className="bg-[#0f0f0f] w-full h-full rounded-[14px] p-6 sm:p-8">
                    <div className="flex justify-center -mt-4 mb-6">
                        <div className="bg-[#E23373] p-3 rounded-2xl shadow-lg shadow-pink-500/20">
                            <Heart className="text-white fill-transparent" size={28} strokeWidth={2.5} />
                        </div>
                    </div>
                    
                    <h2 className="sm:text-[22px] text-[18px] font-bold !text-white text-center">Support the Collaborative Art</h2>
                    
                    <p className="mt-4 sm:text-[16px] text-[13px] !text-white text-center leading-relaxed">
                        Our Platform is a community-driven space for creativity. Your donation helps us maintain the servers, develop new features, and keep the art alive
                    </p>
                    
                    <p className="mt-6 sm:text-[16px] text-[13px] !text-white text-center font-medium">
                        Every Contribution, big or small, makes a difference
                    </p>
                    
                    <div className="mt-8 flex gap-3 sm:gap-4 w-full">
                        <div className="flex-1 p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133]">
                            <Button 
                                onClick={onClose} 
                                variant="ghost" 
                                className="w-full h-10 sm:h-12 rounded-full bg-[#0f0f0f] hover:bg-[#1a1a1a] font-semibold text-sm sm:text-base text-white hover:text-white border-0 transition-colors"
                            >
                                Cancel
                            </Button>
                        </div>
                        
                        <Button
                            onClick={onDonateClick}
                            className="flex-1 h-10 sm:h-12 rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:opacity-90 text-sm sm:text-base !text-white font-semibold border-0 shadow-lg shadow-pink-500/20"
                        >
                            Raise Fund
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomModal;
