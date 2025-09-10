
import React, { useState, useEffect } from 'react'
import {BarChart, LineChart, PieChart, Download, Calendar, TrendingUp, DollarSign, Activity, AlertTriangle} from 'lucide-react'
import { lumi } from '../lib/lumi'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface ReportData {
  vehicles: any[]
  serviceRecords: any[]
  assignments: any[]
  inspections: any[]
}

const Reports: React.FC = () => {
  const [data, setData] = useState<ReportData>({
    vehicles: [],
    serviceRecords: [],
    assignments: [],
    inspections: []
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month')
  const [reportType, setReportType] = useState('overview')

  useEffect(() => {
    loadReportData()
  }, [dateRange])

  const loadReportData = async () => {
    try {
      setLoading(true)
      const [vehicles, serviceRecords, assignments, inspections] = await Promise.all([
        lumi.entities.vehicles.list(),
        lumi.entities.service_records.list(),
        lumi.entities.vehicle_assignments.list(),
        lumi.entities.vehicle_inspections.list()
      ])

      setData({
        vehicles: vehicles || [],
        serviceRecords: serviceRecords || [],
        assignments: assignments || [],
        inspections: inspections || []
      })
    } catch (error) {
      console.error('Error loading report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const getDateRangeFilter = () => {
    const now = new Date()
    switch (dateRange) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  const filterByDateRange = (items: any[], dateField: string) => {
    const cutoffDate = getDateRangeFilter()
    return items.filter(item => new Date(item[dateField]) >= cutoffDate)
  }

  // Calculate key metrics
  const totalVehicles = data.vehicles.length
  const availableVehicles = data.vehicles.filter(v => v.status === 'available').length
  const inUseVehicles = data.vehicles.filter(v => v.status === 'in_use').length
  const maintenanceVehicles = data.vehicles.filter(v => v.status === 'maintenance').length

  const filteredServiceRecords = filterByDateRange(data.serviceRecords, 'serviceDate')
  const totalServiceCost = filteredServiceRecords.reduce((sum, record) => sum + (record.cost || 0), 0)
  const averageServiceCost = filteredServiceRecords.length > 0 ? totalServiceCost / filteredServiceRecords.length : 0

  const filteredAssignments = filterByDateRange(data.assignments, 'assignmentDate')
  const totalTrips = filteredAssignments.length
  const totalMileage = filteredAssignments.reduce((sum, assignment) => sum + (assignment.totalMileage || 0), 0)

  const filteredInspections = filterByDateRange(data.inspections, 'inspectionDate')
  const inspectionsWithDamage = filteredInspections.filter(i => i.damageReported).length

  // Vehicle status distribution
  const vehicleStatusData = [
    { name: 'Available', value: availableVehicles, color: '#10b981' },
    { name: 'In Use', value: inUseVehicles, color: '#3b82f6' },
    { name: 'Maintenance', value: maintenanceVehicles, color: '#f59e0b' },
    { name: 'Out of Service', value: data.vehicles.filter(v => v.status === 'out_of_service').length, color: '#ef4444' }
  ]

  // Service cost by type
  const serviceCostByType = filteredServiceRecords.reduce((acc, record) => {
    const type = record.serviceType || 'unknown'
    acc[type] = (acc[type] || 0) + record.cost
    return acc
  }, {} as Record<string, number>)

  const serviceCostData = Object.entries(serviceCostByType).map(([type, cost]) => ({
    name: type.replace('_', ' '),
    value: cost
  }))

  // Monthly trends (last 12 months)
  const monthlyData = []
  for (let i = 11; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    
    const monthServices = data.serviceRecords.filter(record => {
      const recordDate = new Date(record.serviceDate)
      return recordDate >= monthStart && recordDate <= monthEnd
    })
    
    const monthAssignments = data.assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.assignmentDate)
      return assignmentDate >= monthStart && assignmentDate <= monthEnd
    })

    monthlyData.push({
      month: date.toLocaleDateString('en-ZA', { month: 'short' }),
      serviceCost: monthServices.reduce((sum, s) => sum + s.cost, 0),
      trips: monthAssignments.length,
      mileage: monthAssignments.reduce((sum, a) => sum + (a.totalMileage || 0), 0)
    })
  }

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      summary: {
        totalVehicles,
        availableVehicles,
        inUseVehicles,
        maintenanceVehicles,
        totalServiceCost,
        averageServiceCost,
        totalTrips,
        totalMileage,
        inspectionsWithDamage
      },
      vehicleStatusData,
      serviceCostData,
      monthlyData
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fleet-report-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported successfully')
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Reports & Analytics</h1>
            <p className="text-gray-600">Comprehensive insights into your fleet operations</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            
            <button
              onClick={exportReport}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{totalVehicles}</p>
              <p className="text-sm text-green-600">{availableVehicles} available</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Service Cost</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalServiceCost)}</p>
              <p className="text-sm text-gray-500">Last {dateRange}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">{totalTrips}</p>
              <p className="text-sm text-blue-600">{totalMileage.toLocaleString()} km</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Damage Reports</p>
              <p className="text-2xl font-bold text-gray-900">{inspectionsWithDamage}</p>
              <p className="text-sm text-red-600">Requires attention</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Status Distribution</h3>
          <div className="space-y-4">
            {vehicleStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900 font-medium">{item.value}</span>
                  <span className="text-gray-500">
                    ({totalVehicles > 0 ? Math.round((item.value / totalVehicles) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Cost by Type */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Cost by Type</h3>
          <div className="space-y-4">
            {serviceCostData.slice(0, 5).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                  />
                  <span className="text-gray-700 capitalize">{item.name}</span>
                </div>
                <span className="text-gray-900 font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service Cost</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trips</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mileage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {monthlyData.map((month, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{month.month}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(month.serviceCost)}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{month.trips}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{month.mileage.toLocaleString()} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fleet Efficiency Metrics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Efficiency Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(averageServiceCost)}</p>
            <p className="text-sm text-gray-600">Average Service Cost</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {totalTrips > 0 ? Math.round(totalMileage / totalTrips) : 0} km
            </p>
            <p className="text-sm text-gray-600">Average Trip Distance</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {totalVehicles > 0 ? Math.round((inUseVehicles / totalVehicles) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-600">Fleet Utilization</p>
          </div>
        </div>
      </div>

      {/* Maintenance Alerts */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Alerts</h3>
        <div className="space-y-3">
          {data.vehicles
            .filter(vehicle => {
              const nextServiceDate = new Date(vehicle.nextServiceDate)
              const now = new Date()
              const daysUntilService = Math.ceil((nextServiceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              return daysUntilService <= 30 && daysUntilService >= 0
            })
            .map(vehicle => (
              <div key={vehicle._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-gray-600">Service due soon</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(vehicle.nextServiceDate).toLocaleDateString('en-ZA')}
                  </p>
                  <p className="text-sm text-gray-600">{vehicle.licensePlate}</p>
                </div>
              </div>
            ))}
          
          {data.vehicles.filter(vehicle => {
            const nextServiceDate = new Date(vehicle.nextServiceDate)
            const now = new Date()
            const daysUntilService = Math.ceil((nextServiceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            return daysUntilService <= 30 && daysUntilService >= 0
          }).length === 0 && (
            <p className="text-gray-500 text-center py-4">No upcoming maintenance alerts</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports
