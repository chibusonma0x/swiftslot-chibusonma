import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useBookingStore } from "../store/bookingStore";
import BookingFlow from "../components/BookingFlow";
import {
  generateAllTimeSlots,
  formatTimeSlot,
  isSlotAvailable,
} from "../utils/timeSlots";

interface Vendor {
  id: number;
  name: string;
  timezone: string;
}

const VendorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
const [bookedSlot, setBookedSlot] = useState<string | null>(null);

  const {
    selectedDate,
    selectedSlotUtc,
    setSelectedVendor,
    setSelectedDate,
    setSelectedSlot,
  } = useBookingStore();

  const fetchVendor = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3000/api/vendors");
      const vendors = await response.json();
      const foundVendor = vendors.find((v: Vendor) => v.id === parseInt(id!));
      setVendor(foundVendor || null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch vendor details"
      );
    }
  }, [id]);

  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/vendors/${id}/availability?date=${selectedDate}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch availability");
      }
      const slots = await response.json();
      setAvailableSlots(slots);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch availability"
      );
    } finally {
      setLoading(false);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    if (id) {
      setSelectedVendor(parseInt(id));
      fetchVendor();
      fetchAvailability();
    }
  }, [id, selectedDate, fetchVendor, fetchAvailability, setSelectedVendor]);

  const allTimeSlots = generateAllTimeSlots(selectedDate);

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot === selectedSlotUtc ? null : slot);
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setSelectedSlot(null);
  };

const handleBookingSuccess = () => {
  setBookedSlot(selectedSlotUtc);
  showToast("Booking Confirmed", 'success', 7000);
  setSelectedSlot(null); 
  fetchAvailability();
};


const handleBookingError = (message: string) => {
  showToast(`Error: ${message}`, 'error');
  fetchAvailability();
};
const showToast = (message: string, type: 'success' | 'error' = 'success', duration = 5000) => {
  setToast({ message, type });
  setTimeout(() => setToast(null), duration);
};

  if (!vendor) {
    return <div className="text-center py-8">Vendor not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
   {toast && (
  <div
    className={`fixed top-4 right-4 z-50 p-6 rounded-lg shadow-lg border max-w-sm ${
      toast.type === 'error'
        ? 'bg-red-100 text-red-700 border-red-200'
        : 'bg-green-100 border-green-200'
    }`}
  >
    {toast.type === 'success' && toast.message.includes('Booking Confirmed') ? (
      <div>
        <h3 className="text-lg font-semibold text-green-600 mb-2 flex items-center">
          <span className="text-green-500 mr-2">✓</span>
          Booking Confirmed
        </h3>
        <div className="text-sm text-zinc-600 space-y-1">
          <p><strong>Vendor:</strong> {vendor?.name}</p>
          <p><strong>Date:</strong> {selectedDate}</p>
          <p><strong>Time:</strong> {bookedSlot ? formatTimeSlot(bookedSlot) : ''} (Lagos)</p>
        </div>
      </div>
    ) : (
      <div>{toast.message}</div>
    )}
  </div>
)}


      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-zinc-700">{vendor.name}</h1>
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">
            {vendor.timezone}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Select Date
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="text-sm text-zinc-600">
              Times shown in Africa/Lagos
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-zinc-700 mb-4">
              Available Time Slots
            </h3>

            {loading ? (
              <div className="text-center py-8 text-zinc-600">
                Loading availability...
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8 text-zinc-600">
                No free slots for this date. Pick another day.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {allTimeSlots.map((slot) => {
                  const available = isSlotAvailable(slot, availableSlots);
                  const selected = selectedSlotUtc === slot;

                  return (
                    <button
                      key={slot}
                      onClick={() =>
                        available ? handleSlotSelect(slot) : null
                      }
                      disabled={!available}
                      className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                        selected
                          ? "bg-sky-600 text-white border-sky-600 ring-2 ring-sky-600"
                          : available
                          ? "bg-white text-zinc-700 border-gray-300 hover:border-sky-500 hover:bg-sky-50"
                          : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                    >
                      {formatTimeSlot(slot)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Booking panel */}
        {selectedSlotUtc && (
          <div className="lg:col-span-1">
            <BookingFlow
              vendorId={vendor.id}
              vendorName={vendor.name}
              selectedDate={selectedDate}
              selectedSlotUtc={selectedSlotUtc}
              onSuccess={handleBookingSuccess}
              onError={handleBookingError}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDetailPage;
