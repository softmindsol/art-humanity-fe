// src/components/payment/DonationForm.tsx

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/api/api"; // Aapka api instance
import useAuth from "@/hook/useAuth";
import useAppDispatch from "@/hook/useDispatch";

// Parent ko batane ke liye ke payment process shuru karna hai
interface DonationFormProps {
  onDonate: (clientSecret: string, amount: number) => void;
}

const DonationForm: React.FC<DonationFormProps> = ({ onDonate }) => {
  const [amount, setAmount] = useState<number | string>(5); // Default amount $5
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  // Define the maximum allowed value
  const MAX_AMOUNT_VALUE = 999999.99;

  // New handler to validate and set the amount
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // 1. Allow empty string or '.' for partial input
    if (value === "" || value === ".") {
      setAmount(value);
      return;
    }

    // 2. Check for non-numeric characters (except one decimal point)
    const regex = /^\d*\.?\d*$/;
    if (!regex.test(value)) {
      // Reject input that is not a valid number format
      return;
    }

    // 3. Check maximum value - check against the actual limit
    const numericValue = parseFloat(value);
    if (numericValue > MAX_AMOUNT_VALUE) {
      toast.error(`Amount cannot exceed $${MAX_AMOUNT_VALUE.toFixed(2)}.`);
      // Keep the previous valid state or set to max limit
      if (Number(amount) <= MAX_AMOUNT_VALUE) {
        setAmount(MAX_AMOUNT_VALUE);
      }
      return;
    }

    // 4. Basic length check for the integer part (to enforce max 6 digits before decimal)
    const integerPart = value.split(".")[0];
    if (integerPart.length > 6) {
      // If the user types a 7th digit before the decimal, stop it from being added
      // This logic is slightly complex with number inputs; the value check (step 3) is more effective.
      // We'll rely primarily on the numericValue check but this can provide immediate feedback.
      if (integerPart.length > 6 && value.indexOf(".") === -1) return;
    }

    // If all checks pass, update the state
    setAmount(value);
  };

  const handleDonateClick = async () => {
    // Final validation before sending to backend
    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid amount greater than $0.");
      return;
    }

    if (numericAmount > MAX_AMOUNT_VALUE) {
      toast.error(`Amount cannot exceed $${MAX_AMOUNT_VALUE.toFixed(2)}.`);
      return;
    }

    setIsLoading(true);
    try {
      // Hamara naya backend endpoint call karein
      const response = await api.post("/payments/create-donation-intent", {
        amount: numericAmount,
        userId: user?._id,
      });

      // Parent ko client secret aur amount bhejein taake woh payment modal khol sake
      onDonate(response.data.data.clientSecret, numericAmount);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Could not initiate donation.",
      );
    } finally {
      setIsLoading(false);
      // dispatch(closeDonationForm()) // Keep disabled unless you are sure the parent flow is fine
    }
  };

  return (
    <div className="">
      <h3 className="text-lg font-semibold text-center !text-white">
        Support Our Platform
      </h3>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold">$</span>
        <Input
          type="number" // Keep type="number" for better mobile keyboard experience
          value={amount}
          onChange={handleAmountChange} // Use the new handler
          placeholder="5.00"
          min="1"
          step="0.01" // Allow decimal input for cents
          className="text-lg border-[#545454]"
        />
      </div>
      <div className="flex items-center justify-center mt-3 ">
        <Button
          onClick={handleDonateClick}
          disabled={isLoading}
          className="cursor-pointer border-white rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:from-[#FEC133] hover:to-[#E23373] transition-colors duration-300 text-white disabled:opacity-50"
        >
          {isLoading ? "Processing..." : "Donate Now"}
        </Button>
      </div>
    </div>
  );
};

export default DonationForm;
