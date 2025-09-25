import { create } from 'zustand'

interface BookingState {
  user: { id: number; role: string }
  selectedVendorId: number | null
  selectedDate: string
  selectedSlotUtc: string | null
  setSelectedVendor: (id: number) => void
  setSelectedDate: (date: string) => void
  setSelectedSlot: (slot: string | null) => void
}

export const useBookingStore = create<BookingState>((set) => ({
  user: { id: 1, role: 'buyer' },
  selectedVendorId: null,
  selectedDate: new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }),
  selectedSlotUtc: null,
  setSelectedVendor: (id) => set({ selectedVendorId: id }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedSlot: (slot) => set({ selectedSlotUtc: slot }),
}))