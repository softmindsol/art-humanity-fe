// src/components/modal/PaymentSuccessModal.tsx

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download } from "lucide-react";

// Props ke liye interface
interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentType: "purchase" | "donation"; // Batayein ke yeh purchase hai ya donation
  project?: any; // Purchase ke case mein project ka data
  onDownload?: (project: any) => void; // Purchase ke case mein download handler
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  paymentType,
  project,
  onDownload,
}) => {
  // Purchase ke liye title aur description
  const title =
    paymentType === "purchase" ? "Purchase Successful." : "Thank You.";
  const description =
    paymentType === "purchase"
      ? `You have successfully purchased "${project?.title}". You can download the artwork now.`
      : "Your generous donation helps us keep the art alive. We truly appreciate your support.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#000000] border-2 border-[#E23373] text-white font-[Georgia, serif]">
        <DialogHeader>
          <div className="flex justify-center items-center md:mb-3 mb-1.5">
            <CheckCircle className="text-green-400 md:size-12 size-8" />
          </div>
          <DialogTitle className="md:text-2xl text-xl !text-white text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-300 text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-3 flex sm:justify-center">
          {paymentType === "purchase" && project && onDownload ? (
            // Agar purchase hai, to "Download" button dikhayein
            <Button
              onClick={() => {
                onDownload(project);
                onClose(); // Download ke baad modal band kar dein
              }}
              className="cursor-pointer border-white bg-gradient-to-r from-[#E23373] to-[#FEC133] text-white hover:from-[#FEC133] hover:to-[#E23373] transition-colors duration-300"
            >
              <Download className="mr-1 size-5" />
              Download Now
            </Button>
          ) : (
            // Agar donation hai, to "Close" button dikhayein
            <Button
              onClick={onClose}
              className="cursor-pointer border-white bg-gradient-to-r from-[#E23373] to-[#FEC133] text-white hover:from-[#FEC133] hover:to-[#E23373] transition-colors duration-300"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSuccessModal;
