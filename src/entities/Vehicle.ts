export interface Vehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
  status: "available" | "in_use" | "maintenance" | "out_of_service";
  currentMileage?: number;
  fuelLevel?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  serviceIntervalKm?: number;
  licenseDiskExpiry?: string;
  insuranceExpiry?: string;
  currentDriverId?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  specifications?: {
    engine?: string;
    transmission?: string;
    fuelType?: string;
    capacity?: number;
  };
  creator?: string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}
