// src/components/payment/DonationForm.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/api/api'; // Aapka api instance
import useAuth from '@/hook/useAuth';
import { closeDonationForm } from '@/redux/slice/opeModal';
import useAppDispatch from '@/hook/useDispatch';

// Parent ko batane ke liye ke payment process shuru karna hai
interface DonationFormProps {
    onDonate: (clientSecret: string, amount: number) => void;
}

const DonationForm: React.FC<DonationFormProps> = ({ onDonate }) => {
    const [amount, setAmount] = useState<number | string>(5); // Default amount $5
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth()
    const dispatch = useAppDispatch();
    const handleDonateClick = async () => {
        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount < 1) {
            toast.error("Please enter a valid amount of at least $1.");
            return;
        }

        setIsLoading(true);
        try {
            // Hamara naya backend endpoint call karein
            const response = await api.post('/payments/create-donation-intent', { amount: numericAmount, userId: user?._id });

            // Parent ko client secret aur amount bhejein taake woh payment modal khol sake
            onDonate(response.data.data.clientSecret, numericAmount);

        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not initiate donation.");
        } finally {
            setIsLoading(false);
            dispatch(closeDonationForm())
        }
    };

    return (
        <div className="">
            <h3 className="text-lg font-semibold text-center !text-white">Support Our Platform</h3>
            <div className="flex items-center gap-2">
                <span className="text-xl font-bold">$</span>
                <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="5.00"
                    min="1"
                    className="text-lg"
                />
            </div>
            <div className='flex items-center justify-center mt-3 '>
                <Button onClick={handleDonateClick} disabled={isLoading} className="cursor-pointer border-white   bg-[#8b795e] text-white hover:bg-[#a1887f] disabled:opacity-50">
                    {isLoading ? "Processing..." : "Donate Now"}
                </Button>
            </div>

        </div>
    );
};

export default DonationForm;