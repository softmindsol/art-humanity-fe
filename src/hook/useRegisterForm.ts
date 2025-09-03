// hooks/useRegisterForm.ts
import { useState } from "react";
import useAppDispatch from "./useDispatch";
import { googleLogin, loginUser, registerUser } from "@/redux/action/auth";
import { toast } from "sonner";
export const useRegisterForm = ({onClose}:any) => {
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<{ [key: string]: string }>({});
  const [loginLoading, setLoginLoading] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (e.target.name === "fullName") {
      value = value.replace(/\s{2,}/g, " "); // replace multiple spaces with a single space
    }
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      errs.fullName = "Name is required";
    } else if (/ {2,}/.test(formData.fullName)) {
      errs.fullName = "Name cannot contain multiple consecutive spaces";
    } else if (!/^[a-zA-Z0-9\s]+$/.test(formData.fullName)) {
      // <-- Sirf letters, numbers, aur spaces allow karega
      errs.fullName = "Display Name can only contain letters and numbers";
    } else if (formData.fullName.length < 3) {
      errs.fullName = "Display Name must be at least 3 characters";
    }


    if (!formData.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[\w.%+-]+@[\w.-]+\.(com|org|net|io)$/i.test(formData.email)) {
      // <-- Aapka custom TLD check
      errs.email = "Email is invalid or must end with .com, .org, .net, or .io";
    }

    if (!formData.password) {
      errs.password = "Password is required";
    } else {
      const password = formData.password;

      if (password.length < 8) {
        errs.password = "Password must be at least 8 characters";
      } else if (!/[A-Z]/.test(password)) {
        errs.password = "Password must contain at least one uppercase letter";
      } else if (!/[a-z]/.test(password)) {
        errs.password = "Password must contain at least one lowercase letter";
      } else if (!/[0-9]/.test(password)) {
        errs.password = "Password must contain at least one digit";
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errs.password = "Password must contain at least one special character";
      }
    }

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
      toast.success("User Successfully Register, Please Verify Your Email.");
      // success toast / redirect logic here
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      console.log(err);
      setErrors({ submit: err.message || "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateLogin = () => {
    const errs: { [key: string]: string } = {};
    if (!loginData.email.trim()) {
      errs.email = "Email is required";
    }
    if (!loginData.password) {
      errs.password = "Password is required";
    }
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    try {
      setLoginLoading(true);
      await dispatch(
        loginUser({ email: loginData.email, password: loginData.password })
      ).unwrap();
      // Add success toast or close modal
      toast.success("Successfully logged in!");
      setLoginData({ email: "", password: "" });
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
      console.error(err);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    dispatch(googleLogin())
      .unwrap()
      .then(() => {
        // Now profile is ready in Redux
        onClose(); 
      })
      .catch((err) => {
        console.error("Google login error:", err);
      });

  };

  return {
    formData,
    errors,
    loading,
    handleChange,
    handleSubmit,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    showSigninPassword,
    setShowSigninPassword,
    showForgotPassword,
    setShowForgotPassword,
    handleLoginSubmit,
    handleLoginChange,
    validateLogin,
    loginData,
    setLoginData,
    loginErrors,
    setLoginErrors,
    loginLoading,
    setLoginLoading,
    handleGoogleLogin,
  };
};
