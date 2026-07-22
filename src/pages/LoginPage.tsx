import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff, Lock, Mail, ArrowLeft } from "lucide-react";
import { Input, Button } from "../components/ui";
import api from "../services/api";
import axios from "axios"; // only for isAxiosError check
import { getRole } from "../utils/auth";

export function LoginPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // ✅ USING api.ts (NO HARD CODED URL)
      const response = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const data = response.data;

      // store token
      if (data?.token) {
        localStorage.setItem("authToken", data.token);
      }

      // store user
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // A promoter's Sidebar only has Kit Orders — land there directly
      // rather than on the overview page, which pulls in donation/sponsor/
      // volunteer data a promoter has no server-side access to.
      navigate(getRole() === "promoter" ? "/dashboard/orders" : "/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          "Login failed. Please check your credentials.";

        alert(message);
      } else {
        alert("Unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = () => {
    alert("Password reset functionality will be implemented soon.");
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-gutter py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary mb-6 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-outline-variant">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-primary/10 mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-[32px] font-bold text-on-surface">
              Welcome Back
            </h1>

            <p className="text-on-surface-variant text-[16px]">
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <Input
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            {/* Password */}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                error={errors.password}
                icon={<Lock className="w-5 h-5" />}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px]"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-sm text-primary font-semibold"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              className="py-4"
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-outline-variant" />
            <span className="px-4 text-sm text-on-surface-variant">or</span>
            <div className="flex-1 border-t border-outline-variant" />
          </div>

          {/* Register */}
          <p className="text-center text-on-surface-variant">
            Don’t have an account?{" "}
            <Link to="/buy-kit" className="text-primary font-semibold">
              Buy Kit to Register
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-on-surface-variant mt-6 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          Secure encrypted login
        </p>
      </motion.div>
    </div>
  );
}
