// hooks/useRegisterForm.ts
import { useState } from "react";
import useAppDispatch from "./useDispatch";
import { registerUser } from "@/redux/action/auth";
import {toast} from 'sonner'
export const useRegisterForm = () => {
    const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.fullName.trim()) errs.fullName = "Name is required";
    if (!formData.email.trim()) errs.email = "Email is required";
    if (!formData.password) errs.password = "Password is required";
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const { confirmPassword, ...apiPayload } = formData;
      await dispatch(registerUser(apiPayload)).unwrap();
    toast.success("User Successfully Register, Please Verify Your Email.")
      // success toast / redirect logic here
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      console.error(err);
      setErrors({ submit: err.message || "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    errors,
    loading,
    handleChange,
    handleSubmit,
  };
};
