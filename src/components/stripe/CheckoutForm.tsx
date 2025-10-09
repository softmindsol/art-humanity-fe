// src/components/payment/CheckoutForm.tsx

import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js'; // Stripe ki ahem types
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Props ke liye ek interface banayein
interface CheckoutFormProps {
    clientSecret: string;
    projectPrice: number; // Price ko prop ke tor par lein taake button par dikha sakein
    onPaymentSuccess: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ clientSecret, projectPrice, onPaymentSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCardComplete, setIsCardComplete] = useState(false); // Button ko disable karne ke liye

    const handleCardChange = (event: StripeCardElementChangeEvent) => {
        setIsCardComplete(event.complete);
        if (event.error) {
            setError(event.error.message);
        } else {
            setError(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!stripe || !elements || !isCardComplete) {
            // Agar form complete nahi hai ya Stripe load nahi hua to kuch na karein
            return;
        }

        setIsProcessing(true);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setIsProcessing(false);
            return;
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
            },
        });

        if (error) {
            setError(error.message ?? "An unexpected error occurred.");
            toast.error(error.message ?? "Payment failed. Please try again.");
            setIsProcessing(false);
        } else if (paymentIntent?.status === 'succeeded') {
            toast.success("Payment successful.");
            onPaymentSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 border rounded-md bg-white">
                <CardElement onChange={handleCardChange} />
            </div>
            <Button
                type="submit"
                disabled={!stripe || isProcessing || !isCardComplete}
                className="!cursor-pointer flex items-center justify-center !border-white !bg-[#8b795e] !text-white hover:!bg-[#a1887f] disabled:opacity-50"
            >
                {isProcessing ? "Processing..." : `Pay $${projectPrice.toFixed(2)}`}
            </Button>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        </form>
    );
};

export default CheckoutForm;