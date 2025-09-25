export const generateAllTimeSlots = (selectedDate: string): string[] => {
  const slots: string[] = [];
  const baseDate = new Date(`${selectedDate}T00:00:00.000Z`);

  for (let i = 0; i < 16; i++) {
    const hour = Math.floor(i / 2) + 9;
    const minute = (i % 2) * 30;
    
    const lagosTime = new Date(
      baseDate.getFullYear(), 
      baseDate.getMonth(), 
      baseDate.getDate(), 
      hour, 
      minute
    );
    
    slots.push(lagosTime.toISOString());
  }
  
  return slots;
};

export const formatTimeSlot = (utcTime: string): string => {
  const date = new Date(utcTime);
  
  return date.toLocaleTimeString("en-US", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
export const isSlotAvailable = (slot: string, availableSlots: string[]): boolean => {
  const availableSlotsSet = new Set(availableSlots);
  return availableSlotsSet.has(slot);
};

