export interface VehicleInspection {
  vehicleId: string;
  inspectorId: string;
  inspectionType: "pre_trip" | "post_trip" | "maintenance" | "damage_report";
  timestamp: string; // ISO datetime string
  odometerReading?: number;
  fuelLevel?: number;
  dashboardPhoto?: string;
  overallCondition: "excellent" | "good" | "fair" | "poor" | "damaged";
  inspectionItems?: Array<{
    item: string;
    condition: "pass" | "fail" | "needs_attention";
    notes?: string;
    photos?: string[];
  }>;
  damageReports?: Array<{
    location: string;
    severity: "minor" | "moderate" | "major" | "critical";
    description?: string;
    photos?: string[];
  }>;
  voiceNotes?: Array<{
    audioUrl: string;
    transcription?: string;
    duration?: number;
  }>;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  creator?: string;
  createdAt?: string; // ISO datetime string
  [key: string]: any;
}
