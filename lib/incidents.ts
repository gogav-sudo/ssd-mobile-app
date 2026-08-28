import { supabase, supabaseDirect, Incident } from './supabase';
import { todayIsoDate } from './date';

// Uploads an incident photo to the shared shift-photos bucket and returns its public URL.
// Each incident photo gets a unique filename — no upsert needed (unlike shift photos).
export async function uploadIncidentPhoto(deviceId: string, localUri: string): Promise<string> {
  const fileName = `incident_${deviceId}_${Date.now()}.jpg`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabaseDirect.storage
    .from('shift-photos')
    .upload(fileName, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabaseDirect.storage.from('shift-photos').getPublicUrl(fileName);
  return data.publicUrl;
}

export type NewIncidentInput = {
  telegramChatId: string;
  fullName: string;
  objectName: string;
  description: string;
  incidentType: string;
  urgency: 'Низкая' | 'Средняя' | 'Высокая';
  photoUrl: string | null;
};

export async function createIncident(input: NewIncidentInput): Promise<Incident> {
  const { data, error } = await supabase
    .from('incidents')
    .insert({
      telegram_chat_id: input.telegramChatId,
      full_name: input.fullName,
      object_name: input.objectName,
      photo_url: input.photoUrl,
      description: input.description,
      urgency: input.urgency,
      incident_type: input.incidentType,
      shift_date: todayIsoDate(),
      status: 'new',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
