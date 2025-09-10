import React, { useState, useRef } from "react";
import { QrCode, Camera, CheckCircle, XCircle, Car, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useVehicles } from "../hooks/useVehicles";
import toast from "react-hot-toast";

interface ScanResult {
  success: boolean;
  vehicleId?: string;
  message: string;
  vehicle?: any;
}

const BarcodeScanner: React.FC = () => {
  const { user } = useAuth();
  const { vehicles, getVehicleById } = useVehicles();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error("Camera access denied:", error);
      toast.error("Camera access required for scanning");
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsScanning(false);
  };

  const processCode = async (code: string) => {
    try {
      // Simulate QR code processing
      // In a real implementation, this would decode the QR code and extract vehicle information

      // For demo purposes, assume the code is a vehicle ID
      const vehicleId = code.trim();

      if (!vehicleId) {
        setScanResult({
          success: false,
          message: "Invalid QR code format",
        });
        return;
      }

      // Find vehicle by ID
      const vehicle = vehicles.find(
        (v) =>
          v.vehicleId === vehicleId ||
          v._id === vehicleId ||
          v.licensePlate === vehicleId
      );

      if (!vehicle) {
        setScanResult({
          success: false,
          message: "Vehicle not found in system",
        });
        return;
      }

      // Check vehicle availability
      if (vehicle.status !== "available") {
        setScanResult({
          success: false,
          vehicleId: vehicle.vehicleId,
          message: `Vehicle is currently ${vehicle.status}`,
          vehicle,
        });
        return;
      }

      // Successful scan
      setScanResult({
        success: true,
        vehicleId: vehicle.vehicleId,
        message: "Vehicle access granted",
        vehicle,
      });

      toast.success(`Access granted to ${vehicle.make} ${vehicle.model}`);
    } catch (error) {
      console.error("Error processing code:", error);
      setScanResult({
        success: false,
        message: "Error processing QR code",
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processCode(manualCode.trim());
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setManualCode("");
    stopScanning();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Vehicle Access Scanner
        </h1>
        <p className="text-gray-600 text-sm sm:text-base px-4">
          Scan vehicle QR code or enter vehicle ID manually for secure access
        </p>
      </div>

      {/* User Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-blue-900 block">
              {user?.userName || "User"}
            </span>
            <span className="text-xs text-blue-700 truncate">
              {user?.email}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Scanner Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <div className="p-1.5 bg-blue-100 rounded-lg mr-3">
              <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            QR Code Scanner
          </h2>

          {!isScanning && !scanResult && (
            <div className="text-center py-6 sm:py-8">
              <div className="bg-gray-50 rounded-xl p-6 sm:p-8 mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
                  Position the vehicle QR code within the camera frame
                </p>
                <button
                  onClick={startScanning}
                  className="btn-primary w-full sm:w-auto"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </button>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-48 sm:h-64 object-cover"
                />
                <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg"></div>
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-black bg-opacity-50 text-white text-xs px-3 py-2 rounded-lg text-center">
                    Position QR code in the frame
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => processCode("VH-001")} // Demo scan
                  className="btn-primary flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Demo Scan (VH-001)
                </button>
                <button
                  onClick={stopScanning}
                  className="btn-secondary flex-1 sm:flex-none"
                >
                  Stop Camera
                </button>
              </div>
            </div>
          )}

          {scanResult && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl ${
                  scanResult.success
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                    : "bg-gradient-to-r from-red-50 to-pink-50 border border-red-200"
                }`}
              >
                <div className="flex items-center mb-3">
                  <div
                    className={`p-2 rounded-lg mr-3 ${
                      scanResult.success ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {scanResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      scanResult.success ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {scanResult.message}
                  </span>
                </div>

                {scanResult.vehicle && (
                  <div className="mt-3 space-y-2 text-sm">
                    <div
                      className={`flex justify-between ${
                        scanResult.success ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      <span className="font-medium">Vehicle:</span>
                      <span>
                        {scanResult.vehicle.make} {scanResult.vehicle.model}
                      </span>
                    </div>
                    <div
                      className={`flex justify-between ${
                        scanResult.success ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      <span className="font-medium">License:</span>
                      <span>{scanResult.vehicle.licensePlate}</span>
                    </div>
                    <div
                      className={`flex justify-between ${
                        scanResult.success ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      <span className="font-medium">Status:</span>
                      <span className="capitalize">
                        {scanResult.vehicle.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {scanResult.success && scanResult.vehicle && (
                  <a
                    href={`/vehicles/${scanResult.vehicle._id}/checkout`}
                    className="btn-primary flex-1 text-center"
                  >
                    <Car className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </a>
                )}
                <button
                  onClick={resetScan}
                  className="btn-secondary flex-1 sm:flex-none"
                >
                  Scan Again
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Manual Entry Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <div className="p-1.5 bg-blue-100 rounded-lg mr-3">
              <Car className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            Manual Entry
          </h2>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="form-label">Vehicle ID or License Plate</label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter vehicle ID (e.g., VH-001)"
                className="form-input-mobile"
                required
              />
              <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                Enter the vehicle identifier if QR scanning is not available
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={!manualCode.trim()}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Vehicle Access
            </button>
          </form>

          {/* Quick Access Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Quick Access (Demo)
            </h3>
            <div className="space-y-3">
              {vehicles.slice(0, 3).map((vehicle) => (
                <button
                  key={vehicle._id}
                  onClick={() => processCode(vehicle.vehicleId)}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 touch-target"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm mb-1">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {vehicle.licensePlate} • {vehicle.vehicleId}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ml-3 ${
                        vehicle.status === "available"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {vehicle.status.replace("_", " ")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <QrCode className="h-4 w-4 mr-2 text-blue-600" />
              QR Code Scanning:
            </h4>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2"></div>
                Click "Start Camera" to activate scanner
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2"></div>
                Position QR code within the frame
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2"></div>
                Wait for automatic detection
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2"></div>
                Follow on-screen instructions
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Car className="h-4 w-4 mr-2 text-blue-600" />
              Manual Entry:
            </h4>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2"></div>
                Enter vehicle ID or license plate
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2"></div>
                Click "Verify Vehicle Access"
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2"></div>
                Use quick access buttons for demo
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2"></div>
                Proceed to checkout if authorized
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
