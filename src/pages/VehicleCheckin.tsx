
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {ArrowLeft, User, Fuel, MapPin, Save, Mic, MicOff, PenTool, CheckCircle} from 'lucide-react'
import { useVehicles } from '../hooks/useVehicles'
import LoadingSpinner from '../components/LoadingSpinner'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

const VehicleCheckin: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { vehicles, loading } = useVehicles()
  const [vehicle, setVehicle] = useState<any>(null)
  const [currentAssignment, setCurrentAssignment] = useState<any>(null)
  const [endingMileage, setEndingMileage] = useState('')
  const [fuelLevel, setFuelLevel] = useState('')
  const [vehicleCondition, setVehicleCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good')
  const [damageReported, setDamageReported] = useState(false)
  const [damageDescription, setDamageDescription] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [tripNotes, setTripNotes] = useState('')
  const [signature, setSignature] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (vehicles.length > 0 && id) {
      const foundVehicle = vehicles.find(v => v._id === id)
      setVehicle(foundVehicle || null)
      if (foundVehicle) {
        setEndingMileage(foundVehicle.currentMileage.toString())
        setFuelLevel(foundVehicle.fuelLevel.toString())
        loadCurrentAssignment(foundVehicle.vehicleId)
      }
    }
  }, [vehicles, id])

  const loadCurrentAssignment = async (vehicleId: string) => {
    try {
      const assignments = await lumi.entities.vehicle_assignments.list({
        filter: { vehicleId, status: 'active' }
      })
      if (assignments && assignments.length > 0) {
        setCurrentAssignment(assignments[0])
      }
    } catch (error) {
      console.error('Error loading current assignment:', error)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      toast.success('Voice recording stopped')
    } else {
      setIsRecording(true)
      toast.success('Voice recording started')
    }
  }

  const handleCheckin = async () => {
    if (!endingMileage || !signature) {
      toast.error('Please fill in all required fields')
      return
    }

    const endMileage = parseInt(endingMileage)
    const startMileage = currentAssignment?.startingMileage || 0

    if (endMileage < startMileage) {
      toast.error('Ending mileage cannot be less than starting mileage')
      return
    }

    setSubmitting(true)
    try {
      // Update the current assignment
      if (currentAssignment) {
        await lumi.entities.vehicle_assignments.update(currentAssignment._id, {
          endingMileage: endMileage,
          fuelLevelEnd: parseInt(fuelLevel),
          returnDate: new Date().toISOString(),
          vehicleCondition,
          damageReported,
          damageDescription,
          tripNotes,
          returnSignature: signature,
          status: 'completed',
          totalMileage: endMileage - startMileage,
          updatedAt: new Date().toISOString()
        })
      }

      // Update vehicle status
      await lumi.entities.vehicles.update(vehicle._id, {
        status: 'available',
        currentDriverId: '',
        currentMileage: endMileage,
        fuelLevel: parseInt(fuelLevel),
        updatedAt: new Date().toISOString()
      })

      // Create post-trip inspection record if damage was reported
      if (damageReported) {
        await lumi.entities.vehicle_inspections.create({
          vehicleId: vehicle.vehicleId,
          inspectionType: 'post_trip',
          inspectionDate: new Date().toISOString(),
          inspectorId: currentAssignment?.driverId || 'unknown',
          mileageAtInspection: endMileage,
          fuelLevel: parseInt(fuelLevel),
          overallCondition: vehicleCondition,
          damageReported: true,
          notes: damageDescription,
          creator: 'current_user'
        })
      }

      toast.success('Vehicle checked in successfully')
      navigate(`/vehicles/${id}`)
    } catch (error) {
      console.error('Error checking in vehicle:', error)
      toast.error('Failed to check in vehicle')
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
        <User className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not Found</h2>
        <p className="text-gray-600 mb-6">Cannot checkin unknown vehicle.</p>
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

  if (vehicle.status !== 'in_use') {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <User className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not In Use</h2>
        <p className="text-gray-600 mb-6">This vehicle is not currently checked out and cannot be checked in.</p>
        <Link
          to={`/vehicles/${id}`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vehicle
        </Link>
      </div>
    )
  }

  const calculateTripDistance = () => {
    if (currentAssignment && endingMileage) {
      return parseInt(endingMileage) - (currentAssignment.startingMileage || 0)
    }
    return 0
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
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Check-in</h1>
              <p className="text-gray-600">
                {vehicle.year} {vehicle.make} {vehicle.model} • {vehicle.licensePlate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Summary */}
      {currentAssignment && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Driver</p>
              <p className="font-semibold text-gray-900">{currentAssignment.driverId}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Destination</p>
              <p className="font-semibold text-gray-900">{currentAssignment.destination}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Starting Mileage</p>
              <p className="font-semibold text-gray-900">{currentAssignment.startingMileage?.toLocaleString()} km</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-2">Trip Purpose</p>
            <p className="text-blue-900">{currentAssignment.tripPurpose}</p>
          </div>
        </div>
      )}

      {/* Return Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ending Mileage (km) *
            </label>
            <input
              type="number"
              value={endingMileage}
              onChange={(e) => setEndingMileage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter ending mileage"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuel Level (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter fuel percentage"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trip Distance
            </label>
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
              {calculateTripDistance().toLocaleString()} km
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Condition */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Condition</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Condition
            </label>
            <select
              value={vehicleCondition}
              onChange={(e) => setVehicleCondition(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="damageReported"
              checked={damageReported}
              onChange={(e) => setDamageReported(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="damageReported" className="text-sm font-medium text-gray-700">
              Report damage or issues
            </label>
          </div>
          
          {damageReported && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Damage Description *
              </label>
              <textarea
                value={damageDescription}
                onChange={(e) => setDamageDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe any damage, issues, or concerns with the vehicle"
                required={damageReported}
              />
            </div>
          )}
        </div>
      </div>

      {/* Trip Notes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Notes</h2>
        
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
              Additional Notes
            </label>
            <textarea
              value={tripNotes}
              onChange={(e) => setTripNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes about the trip, vehicle performance, or other observations"
            />
          </div>
        </div>
      </div>

      {/* Digital Signature */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Digital Signature</h2>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <PenTool className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Sign here to confirm vehicle return</p>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full max-w-md mx-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your full name as signature"
              required
            />
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="mb-2">By signing above, I confirm that:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>I have returned the vehicle in the condition described</li>
              <li>All information provided is accurate and complete</li>
              <li>I have reported any damage or issues discovered</li>
              <li>The vehicle has been returned with all keys and accessories</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center">
          <Link
            to={`/vehicles/${id}`}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          
          <button
            onClick={handleCheckin}
            disabled={submitting || !endingMileage || !signature || (damageReported && !damageDescription)}
            className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Check-in
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VehicleCheckin
