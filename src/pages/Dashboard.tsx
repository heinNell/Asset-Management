import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  Users,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Fuel,
  MapPin,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useVehicles } from "../hooks/useVehicles";
import { lumi } from "../lib/lumi";
import LoadingSpinner from "../components/LoadingSpinner";

interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  inUseVehicles: number;
  maintenanceVehicles: number;
  totalDrivers: number;
  activeAssignments: number;
  overdueServices: number;
  lowFuelVehicles: number;
}

interface RecentActivity {
  id: string;
  type: "checkout" | "checkin" | "service" | "inspection";
  vehicleId: string;
  driverName: string;
  timestamp: string;
  description: string;
}

const Dashboard: React.FC = () => {
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    availableVehicles: 0,
    inUseVehicles: 0,
    maintenanceVehicles: 0,
    totalDrivers: 0,
    activeAssignments: 0,
    overdueServices: 0,
    lowFuelVehicles: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateStats = async () => {
      if (!vehicles.length) return;

      try {
        // Calculate vehicle statistics
        const totalVehicles = vehicles.length;
        const availableVehicles = vehicles.filter(
          (v) => v.status === "available"
        ).length;
        const inUseVehicles = vehicles.filter(
          (v) => v.status === "in_use"
        ).length;
        const maintenanceVehicles = vehicles.filter(
          (v) => v.status === "maintenance"
        ).length;
        const lowFuelVehicles = vehicles.filter((v) => v.fuelLevel < 25).length;

        // Get driver count
        const driversResponse = await lumi.entities.driver_profiles.list();
        const totalDrivers = driversResponse.list?.length || 0;

        // Get active assignments
        const assignmentsResponse =
          await lumi.entities.vehicle_assignments.list({
            filter: { status: "active" },
          });
        const activeAssignments = assignmentsResponse.list?.length || 0;

        // Calculate overdue services
        const currentDate = new Date();
        const overdueServices = vehicles.filter((v) => {
          const nextServiceDate = new Date(v.nextServiceDate);
          return nextServiceDate < currentDate;
        }).length;

        setStats({
          totalVehicles,
          availableVehicles,
          inUseVehicles,
          maintenanceVehicles,
          totalDrivers,
          activeAssignments,
          overdueServices,
          lowFuelVehicles,
        });

        // Fetch recent activities
        const activitiesResponse = await lumi.entities.vehicle_assignments.list(
          {
            limit: 5,
            sort: { createdAt: -1 },
          }
        );

        const activities: RecentActivity[] = (
          activitiesResponse.list || []
        ).map((assignment) => ({
          id: assignment._id,
          type: assignment.assignmentType as any,
          vehicleId: assignment.vehicleId,
          driverName: "Driver Name", // Would need to join with driver data
          timestamp: assignment.createdAt,
          description: `${assignment.assignmentType} for vehicle ${assignment.vehicleId}`,
        }));

        setRecentActivities(activities);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!vehiclesLoading) {
      calculateStats();
    }
  }, [vehicles, vehiclesLoading]);

  if (loading || vehiclesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Vehicles",
      value: stats.totalVehicles,
      icon: Car,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Available",
      value: stats.availableVehicles,
      icon: Car,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "In Use",
      value: stats.inUseVehicles,
      icon: MapPin,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Maintenance",
      value: stats.maintenanceVehicles,
      icon: Wrench,
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Active Drivers",
      value: stats.totalDrivers,
      icon: Users,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Low Fuel",
      value: stats.lowFuelVehicles,
      icon: Fuel,
      color: "bg-orange-500",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const quickActions = [
    {
      title: "Vehicle Checkout",
      description: "Check out a vehicle to a driver",
      icon: Car,
      href: "/vehicles",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Vehicle Inspection",
      description: "Perform vehicle inspection",
      icon: AlertTriangle,
      href: "/vehicles",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Service Records",
      description: "View and manage service history",
      icon: Wrench,
      href: "/service",
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      title: "Driver Management",
      description: "Manage driver profiles and licenses",
      icon: Users,
      href: "/drivers",
      color: "bg-indigo-600 hover:bg-indigo-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Fleet overview and recent activities
          </p>
        </div>
        <div className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
          <span className="hidden sm:inline">Last updated: </span>
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-3 sm:mb-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-2 sm:p-3 rounded-lg ${stat.bgColor} self-start sm:self-auto`}
                >
                  <Icon
                    className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${stat.textColor}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {(stats.overdueServices > 0 || stats.lowFuelVehicles > 0) && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center mb-3">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-yellow-800">
              Attention Required
            </h3>
          </div>
          <div className="space-y-2 text-sm text-yellow-700">
            {stats.overdueServices > 0 && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <p>{stats.overdueServices} vehicle(s) have overdue service</p>
              </div>
            )}
            {stats.lowFuelVehicles > 0 && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <p>{stats.lowFuelVehicles} vehicle(s) have low fuel levels</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.href}
                  className={`${action.color} text-white p-4 rounded-xl transition-all duration-200 group hover:shadow-lg hover:-translate-y-1 touch-target`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">
                        {action.title}
                      </h3>
                      <p className="text-xs opacity-90 leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                    <Icon className="h-5 w-5 ml-3 opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activities
            </h2>
            <Link
              to="/reports"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors"
            >
              <span className="hidden sm:inline">View all</span>
              <span className="sm:hidden">All</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Clock className="h-3 w-3 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium mb-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 font-medium">
                No recent activities
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Activities will appear here as they occur
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
