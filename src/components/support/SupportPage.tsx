
import  { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import DonationForm from '../stripe/DonationForm';
import CheckoutForm from '../stripe/CheckoutForm';

const SupportPage = () => {
    const [paymentState, setPaymentState] = useState({
        isOpen: false,
        clientSecret: null as string | null,
        amount: 0,
    });

    const handleOnDonate = (clientSecret: string, amount: number) => {
        // DonationForm se data anay par payment modal kholein
        setPaymentState({
            isOpen: true,
            clientSecret,
            amount,
        });
    };

    const handlePaymentSuccess = () => {
        // Yahan aap "Thank you" ka message dikha sakte hain
        toast.success("Thank you for your generous donation.");
        setPaymentState({ isOpen: false, clientSecret: null, amount: 0 });
    };

    return (
        <div className=" mx-auto py-8">
            <DonationForm onDonate={handleOnDonate} />
            <Dialog open={paymentState.isOpen} onOpenChange={() => setPaymentState({ ...paymentState, isOpen: false })}>
                <DialogContent className="!bg-[#037] border-2 border-[#3e2723] text-white font-[Georgia, serif] max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className='!text-white'>Confirm Your Donation</DialogTitle>
                    </DialogHeader>
                    {paymentState.clientSecret && (
                        <CheckoutForm
                            clientSecret={paymentState.clientSecret}
                            projectPrice={paymentState.amount} // Hum 'projectPrice' prop ko hi dobara istemal kar rahe hain
                            onPaymentSuccess={handlePaymentSuccess}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SupportPage;