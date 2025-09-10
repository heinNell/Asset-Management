export interface DriverProfile {
  userId: string;
  licenseNumber: string;
  licenseClass?: string;
  licenseExpiry: string;
  status: "active" | "suspended" | "expired" | "pending_approval";
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phoneNumber?: string;
    email?: string;
  };
  companyInfo?: {
    companyName?: string;
    department?: string;
    employeeId?: string;
    position?: string;
    supervisor?: string;
  };
  documents?: Array<{
    type: string;
    url: string;
    expiryDate?: string;
    verified?: boolean;
  }>;
  drivingHistory?: {
    totalMileage?: number;
    accidentCount?: number;
    violationCount?: number;
    safetyRating?: number;
  };
  approvalStatus?: "pending" | "approved" | "rejected" | "requires_review";
  approvedBy?: string;
  approvalDate?: string;
  creator?: string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}
