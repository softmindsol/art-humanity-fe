// src/components/modal/PaymentSuccessModal.tsx

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download } from 'lucide-react';

// Props ke liye interface
interface PaymentSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentType: 'purchase' | 'donation'; // Batayein ke yeh purchase hai ya donation
    project?: any; // Purchase ke case mein project ka data
    onDownload?: (project: any) => void; // Purchase ke case mein download handler
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
    isOpen,
    onClose,
    paymentType,
    project,
    onDownload
}) => {

    // Purchase ke liye title aur description
    const title = paymentType === 'purchase' ? 'Purchase Successful.' : 'Thank You.';
    const description = paymentType === 'purchase'
        ? `You have successfully purchased "${project?.title}". You can download the artwork now.`
        : 'Your generous donation helps us keep the art alive. We truly appreciate your support!';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif]">
                <DialogHeader>
                    <div className="flex justify-center items-center mb-4">
                        <CheckCircle className="text-green-400" size={48} />
                    </div>
                    <DialogTitle className="text-2xl !text-white text-center">{title}</DialogTitle>
                    <DialogDescription className="pt-4 text-base text-gray-300 text-center">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex sm:justify-center">
                    {paymentType === 'purchase' && project && onDownload ? (
                        // Agar purchase hai, to "Download" button dikhayein
                        <Button
                            onClick={() => {
                                onDownload(project);
                                onClose(); // Download ke baad modal band kar dein
                            }}
                            className="cursor-pointer border-white bg-blue-600 text-white hover:bg-blue-700"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download Now
                        </Button>
                    ) : (
                        // Agar donation hai, to "Close" button dikhayein
                        <Button onClick={onClose} className=" cursor-pointer border-white bg-[#8b795e] text-white hover:bg-[#a1887f]">
                            Close
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentSuccessModal;