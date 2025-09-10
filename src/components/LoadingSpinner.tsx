import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
  text,
}) => {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="relative">
        {/* Main spinner */}
        <div
          className={`animate-spin rounded-full border-gray-200 border-t-blue-600 ${sizeClasses[size]}`}
        ></div>

        {/* Pulsing dot in center for better visual feedback */}
        <div className={`absolute inset-0 flex items-center justify-center`}>
          <div
            className={`rounded-full bg-blue-600 animate-pulse ${
              size === "sm" ? "h-1 w-1" : size === "md" ? "h-2 w-2" : "h-3 w-3"
            }`}
          ></div>
        </div>
      </div>

      {text && (
        <p
          className={`text-gray-600 font-medium animate-pulse ${textSizeClasses[size]}`}
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
