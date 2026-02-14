import { supabase } from '@/integrations/supabase/client';

export async function uploadPhoto(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from('photos')
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

export async function uploadPhotosFromFiles(files: FileList | File[], folder: string): Promise<string[]> {
  const uploads = Array.from(files).map(file => uploadPhoto(file, folder));
  return Promise.all(uploads);
}
