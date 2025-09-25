import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { addMinutes, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';

const LAGOS_TIMEZONE = 'Africa/Lagos';
export function generateTimeSlots(dateString: string): Date[] {

  const [year, month, day] = dateString.split('-').map(Number);
  

  let lagosTime = new Date(year, month - 1, day); 
  lagosTime = setHours(lagosTime, 9);
  lagosTime = setMinutes(lagosTime, 0);
  lagosTime = setSeconds(lagosTime, 0);
  lagosTime = setMilliseconds(lagosTime, 0);
  
  const slots: Date[] = [];
  
  for (let i = 0; i < 16; i++) {
    const lagosSlotTime = addMinutes(lagosTime, i * 30);
    // Convert Lagos time to UTC for database storage
    const utcSlotTime = fromZonedTime(lagosSlotTime, LAGOS_TIMEZONE);
    slots.push(utcSlotTime);
  }
  
  return slots;
}

export function convertUtcToLagos(utcDate: Date): Date {
  return toZonedTime(utcDate, LAGOS_TIMEZONE);
}

export function convertLagosToUtc(lagosDate: Date): Date {
  return fromZonedTime(lagosDate, LAGOS_TIMEZONE);
}

export function formatLagosTime(utcDate: Date): string {
  const lagosTime = convertUtcToLagos(utcDate);
  return format(lagosTime, 'HH:mm', { timeZone: LAGOS_TIMEZONE });
}