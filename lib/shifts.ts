import { supabase, Shift } from './supabase';
import { todayIsoDate, currentMonthRange } from './date';

// Looks up today's open shift for this device, if any.
export async function getTodayOpenShift(deviceId: string): Promise<Shift | null> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('telegram_chat_id', deviceId)
    .eq('shift_date', todayIsoDate())
    .eq('status', 'open')
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Returns the count of shifts this device has logged within the current
// calendar month (by shift_date).
export async function getShiftCountThisMonth(deviceId: string): Promise<number> {
  const { start, end } = currentMonthRange();
  const { count, error } = await supabase
    .from('shifts')
    .select('id', { count: 'exact', head: true })
    .eq('telegram_chat_id', deviceId)
    .gte('shift_date', start)
    .lte('shift_date', end);

  if (error) throw error;
  return count ?? 0;
}

// Returns the most recent shifts for this device, newest first.
export async function getRecentShifts(deviceId: string, limit = 5): Promise<Shift[]> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('telegram_chat_id', deviceId)
    .order('shift_date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

// Closes the given shift row in place — never creates a new row.
export async function closeShift(
  shiftId: number,
  params: { equipmentOk: boolean | null; notes: string }
): Promise<void> {
  const { error } = await supabase
    .from('shifts')
    .update({
      end_time: new Date().toISOString(),
      status: 'closed',
      end_equipment_ok: params.equipmentOk,
      end_notes: params.notes || null,
    })
    .eq('id', shiftId);

  if (error) throw error;
}

// Uploads the start-of-shift photo to the shift-photos bucket and returns its public URL.
export async function uploadStartShiftPhoto(deviceId: string, localUri: string): Promise<string> {
  const fileName = `${deviceId}_${todayIsoDate()}.jpg`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('shift-photos')
    .upload(fileName, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('shift-photos').getPublicUrl(fileName);
  return data.publicUrl;
}
