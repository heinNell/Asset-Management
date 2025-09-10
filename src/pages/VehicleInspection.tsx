
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {Camera, CheckCircle, XCircle, ArrowLeft, Save, Mic, MicOff, Upload} from 'lucide-react'
import { useVehicles } from '../hooks/useVehicles'
import LoadingSpinner from '../components/LoadingSpinner'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface InspectionItem {
  id: string
  category: string
  question: string
  status: 'pass' | 'fail' | 'not_checked'
  notes?: string
  photos?: string[]
}

const VehicleInspection: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { vehicles, loading } = useVehicles()
  const [vehicle, setVehicle] = useState<any>(null)
  const [inspectionType, setInspectionType] = useState<'pre_trip' | 'post_trip' | 'scheduled'>('pre_trip')
  const [currentMileage, setCurrentMileage] = useState('')
  const [fuelLevel, setFuelLevel] = useState('')
  const [overallCondition, setOverallCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good')
  const [generalNotes, setGeneralNotes] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([
    // Exterior Inspection
    { id: 'ext_body', category: 'Exterior', question: 'Body condition (no dents, scratches)', status: 'not_checked' },
    { id: 'ext_lights', category: 'Exterior', question: 'All lights working (headlights, taillights, indicators)', status: 'not_checked' },
    { id: 'ext_mirrors', category: 'Exterior', question: 'Mirrors clean and properly adjusted', status: 'not_checked' },
    { id: 'ext_windows', category: 'Exterior', question: 'Windows clean and undamaged', status: 'not_checked' },
    { id: 'ext_license', category: 'Exterior', question: 'License plates visible and secure', status: 'not_checked' },
    
    // Tires and Wheels
    { id: 'tire_condition', category: 'Tires', question: 'Tire condition and tread depth adequate', status: 'not_checked' },
    { id: 'tire_pressure', category: 'Tires', question: 'Tire pressure appears normal', status: 'not_checked' },
    { id: 'wheel_damage', category: 'Tires', question: 'No visible wheel damage or missing lug nuts', status: 'not_checked' },
    
    // Interior
    { id: 'int_seats', category: 'Interior', question: 'Seats clean and undamaged', status: 'not_checked' },
    { id: 'int_seatbelts', category: 'Interior', question: 'All seatbelts present and functional', status: 'not_checked' },
    { id: 'int_dashboard', category: 'Interior', question: 'Dashboard warning lights checked', status: 'not_checked' },
    { id: 'int_controls', category: 'Interior', question: 'All controls (steering, pedals) working properly', status: 'not_checked' },
    { id: 'int_cleanliness', category: 'Interior', question: 'Interior clean and free of debris', status: 'not_checked' },
    
    // Engine and Fluids
    { id: 'eng_oil', category: 'Engine', question: 'Oil level adequate (if checkable)', status: 'not_checked' },
    { id: 'eng_coolant', category: 'Engine', question: 'Coolant level adequate (if checkable)', status: 'not_checked' },
    { id: 'eng_sounds', category: 'Engine', question: 'Engine sounds normal when running', status: 'not_checked' },
    
    // Safety Equipment
    { id: 'safety_triangle', category: 'Safety', question: 'Emergency triangle present', status: 'not_checked' },
    { id: 'safety_spare', category: 'Safety', question: 'Spare tire and jack present', status: 'not_checked' },
    { id: 'safety_extinguisher', category: 'Safety', question: 'Fire extinguisher present (if required)', status: 'not_checked' }
  ])

  useEffect(() => {
    if (vehicles.length > 0 && id) {
      const foundVehicle = vehicles.find(v => v._id === id)
      setVehicle(foundVehicle || null)
      if (foundVehicle) {
        setCurrentMileage(foundVehicle.currentMileage.toString())
        setFuelLevel(foundVehicle.fuelLevel.toString())
      }
    }
  }, [vehicles, id])

  const updateInspectionItem = (itemId: string, status: 'pass' | 'fail' | 'not_checked', notes?: string) => {
    setInspectionItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, status, notes: notes || item.notes }
          : item
      )
    )
  }

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording logic here
      setIsRecording(false)
      toast.success('Voice recording stopped')
    } else {
      // Start recording logic here
      setIsRecording(true)
      toast.success('Voice recording started')
    }
  }

  const handleSubmitInspection = async () => {
    if (!vehicle || !currentMileage || !fuelLevel) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const inspectionData = {
        vehicleId: vehicle.vehicleId,
        inspectionType,
        inspectionDate: new Date().toISOString(),
        inspectorId: 'current_user', // This should come from auth context
        mileageAtInspection: parseInt(currentMileage),
        fuelLevel: parseInt(fuelLevel),
        overallCondition,
        damageReported: inspectionItems.some(item => item.status === 'fail'),
        notes: generalNotes,
        inspectionItems: inspectionItems.map(item => ({
          category: item.category,
          question: item.question,
          status: item.status,
          notes: item.notes || ''
        })),
        creator: 'current_user'
      }

      await lumi.entities.vehicle_inspections.create(inspectionData)
      
      // Update vehicle mileage and fuel level
      await lumi.entities.vehicles.update(vehicle._id, {
        currentMileage: parseInt(currentMileage),
        fuelLevel: parseInt(fuelLevel),
        updatedAt: new Date().toISOString()
      })

      toast.success('Inspection completed successfully')
      navigate(`/vehicles/${id}`)
    } catch (error) {
      console.error('Error submitting inspection:', error)
      toast.error('Failed to submit inspection')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <Camera className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not Found</h2>
        <p className="text-gray-600 mb-6">Cannot perform inspection on unknown vehicle.</p>
        <Link
          to="/vehicles"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vehicles
        </Link>
      </div>
    )
  }

  const groupedItems = inspectionItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, InspectionItem[]>)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600'
      case 'fail': return 'text-red-600'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={`/vehicles/${id}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Inspection</h1>
              <p className="text-gray-600">
                {vehicle.year} {vehicle.make} {vehicle.model} • {vehicle.licensePlate}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={inspectionType}
              onChange={(e) => setInspectionType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pre_trip">Pre-Trip Inspection</option>
              <option value="post_trip">Post-Trip Inspection</option>
              <option value="scheduled">Scheduled Inspection</option>
            </select>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Mileage (km) *
            </label>
            <input
              type="number"
              value={currentMileage}
              onChange={(e) => setCurrentMileage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter current mileage"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuel Level (%) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter fuel percentage"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Condition
            </label>
            <select
              value={overallCondition}
              onChange={(e) => setOverallCondition(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inspection Checklist */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Inspection Checklist</h2>
        
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-md font-semibold text-gray-900 mb-4">{category}</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <div className="flex-1">
                      <p className="text-gray-900">{item.question}</p>
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateInspectionItem(item.id, 'pass')}
                        className={`p-2 rounded-lg transition-colors ${
                          item.status === 'pass'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500'
                        }`}
                        title="Pass"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => updateInspectionItem(item.id, 'fail')}
                        className={`p-2 rounded-lg transition-colors ${
                          item.status === 'fail'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                        }`}
                        title="Fail"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                      <button
                        className="p-2 bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500 rounded-lg transition-colors"
                        title="Add Photo"
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Notes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleRecording}
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                isRecording
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Voice Note
                </>
              )}
            </button>
            {isRecording && (
              <span className="text-sm text-red-600 animate-pulse">Recording...</span>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Written Notes
            </label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any additional notes about the vehicle condition, issues found, or recommendations..."
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Completed: {inspectionItems.filter(item => item.status !== 'not_checked').length} / {inspectionItems.length} items
          </div>
          
          <div className="flex space-x-3">
            <Link
              to={`/vehicles/${id}`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmitInspection}
              disabled={submitting}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Complete Inspection
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VehicleInspection
