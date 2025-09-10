import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  Plus,
  Search,
  Filter,
  Fuel,
  Calendar,
  MapPin,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useVehicles } from "../hooks/useVehicles";
import LoadingSpinner from "../components/LoadingSpinner";

const VehicleList: React.FC = () => {
  const { vehicles, loading, deleteVehicle } = useVehicles();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vehicleId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || vehicle.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: {
        class: "status-available",
        icon: CheckCircle,
        text: "Available",
      },
      in_use: {
        class: "status-in-use",
        icon: Car,
        text: "In Use",
      },
      maintenance: {
        class: "status-maintenance",
        icon: AlertTriangle,
        text: "Maintenance",
      },
      out_of_service: {
        class: "status-out-of-service",
        icon: AlertTriangle,
        text: "Out of Service",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <span className={config.class}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const handleDelete = async (vehicleId: string, vehicleName: string) => {
    if (
      confirm(
        `Are you sure you want to delete ${vehicleName}? This action cannot be undone.`
      )
    ) {
      await deleteVehicle(vehicleId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Vehicles
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage your fleet of {vehicles.length} vehicles
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center justify-center w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input-mobile pl-10 w-full"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <label className="text-sm font-medium text-gray-700 sm:whitespace-nowrap">
              Filter by status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input-mobile w-full sm:w-48"
            >
              <option value="all">All Vehicles</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_service">Out of Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle Grid */}
      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              {/* Vehicle Image Placeholder */}
              <div className="h-40 sm:h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative">
                <Car className="h-12 w-12 sm:h-16 sm:w-16 text-blue-400" />
                <div className="absolute top-3 right-3">
                  {getStatusBadge(vehicle.status)}
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="p-4 sm:p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-sm text-gray-600 font-medium">
                    {vehicle.year}
                  </p>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 rounded-lg mr-3">
                      <Car className="h-3 w-3" />
                    </div>
                    <span className="font-medium">{vehicle.licensePlate}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 rounded-lg mr-3">
                      <Fuel className="h-3 w-3" />
                    </div>
                    <span>{vehicle.fuelLevel}% Fuel</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 rounded-lg mr-3">
                      <Calendar className="h-3 w-3" />
                    </div>
                    <span>{vehicle.currentMileage.toLocaleString()} km</span>
                  </div>
                  {vehicle.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 rounded-lg mr-3">
                        <MapPin className="h-3 w-3" />
                      </div>
                      <span className="truncate">
                        {vehicle.location.address}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-gray-100 gap-3">
                  <div className="flex justify-center sm:justify-start space-x-1">
                    <Link
                      to={`/vehicles/${vehicle._id}`}
                      className="touch-target text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      className="touch-target text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Edit Vehicle"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(
                          vehicle._id,
                          `${vehicle.make} ${vehicle.model}`
                        )
                      }
                      className="touch-target text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Vehicle"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {vehicle.status === "available" && (
                    <Link
                      to={`/vehicles/${vehicle._id}/checkout`}
                      className="btn-primary text-xs py-2 px-4 rounded-lg text-center w-full sm:w-auto"
                    >
                      Check Out
                    </Link>
                  )}

                  {vehicle.status === "in_use" && (
                    <Link
                      to={`/vehicles/${vehicle._id}/checkin`}
                      className="bg-green-600 text-white text-xs py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center w-full sm:w-auto"
                    >
                      Check In
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {searchTerm || statusFilter !== "all"
                ? "No vehicles found"
                : "No vehicles yet"}
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria to find what you're looking for"
                : "Get started by adding your first vehicle to the fleet management system"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Vehicle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleList;
