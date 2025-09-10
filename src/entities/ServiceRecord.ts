export interface ServiceRecord {
  vehicleId: string;
  serviceType:
    | "routine_maintenance"
    | "repair"
    | "inspection"
    | "tire_change"
    | "oil_change"
    | "brake_service"
    | "transmission_service"
    | "emergency_repair";
  serviceDate: string;
  mileageAtService: number;
  cost: number;
  serviceProvider?: string;
  serviceLocation?: string;
  description?: string;
  partsReplaced?: Array<{
    partName: string;
    partNumber?: string;
    quantity?: number;
    cost?: number;
  }>;
  laborHours?: number;
  laborCost?: number;
  nextServiceDue?: string;
  nextServiceMileage?: number;
  warrantyInfo?: {
    warrantyPeriod?: number;
    warrantyMileage?: number;
    warrantyExpiry?: string;
  };
  serviceReceipts?: string[];
  technicianId?: string;
  serviceNotes?: string;
  creator?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}
