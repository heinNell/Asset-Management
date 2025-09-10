import React, { useState } from "react";
import { Car, Shield, Users, BarChart3 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn();
      toast.success("Login successful!");
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Car,
      title: "Vehicle Tracking",
      description: "Real-time tracking and monitoring of your entire fleet",
    },
    {
      icon: Shield,
      title: "Secure Access",
      description:
        "Barcode scanning and secure authentication for vehicle access",
    },
    {
      icon: Users,
      title: "Driver Management",
      description: "Complete driver profiles with license verification",
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Comprehensive reporting and fleet analytics",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex min-h-screen">
        {/* Left side - Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 xl:p-12 text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black to-transparent opacity-20"></div>

          <div className="relative flex flex-col justify-center max-w-md mx-auto z-10">
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                  <Car className="h-8 w-8" />
                </div>
                <span className="ml-3 text-3xl font-bold">VMS</span>
              </div>
              <h1 className="text-4xl font-bold mb-4 leading-tight">
                Vehicle Management System
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Comprehensive fleet management solution for modern businesses
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start group">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm group-hover:bg-opacity-30 transition-all duration-200">
                        <Icon className="h-5 w-5 text-blue-100" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side - Login */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="max-w-md w-full">
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                  <Car className="h-8 w-8 text-white" />
                </div>
                <span className="ml-3 text-2xl font-bold text-gray-900">
                  VMS
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Vehicle Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Secure access to your fleet management dashboard
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  Welcome Back
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Sign in to access the vehicle management system
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="p-1 bg-blue-600 rounded-lg">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <span className="text-sm font-semibold text-blue-900 block">
                        Secure Authentication Required
                      </span>
                      <p className="text-sm text-blue-700 mt-1">
                        Click below to authenticate with your company
                        credentials
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 touch-target"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Authenticating...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Sign In to VMS
                    </span>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Need access?{" "}
                    <span className="text-blue-600 font-medium">
                      Contact your system administrator
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Security notice */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 leading-relaxed px-4">
                This system is for authorized personnel only. All activities are
                logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
