import { supabase } from '@/integrations/supabase/client';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadPhoto(file: File, folder: string): Promise<string> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande (máx ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const { error } = await supabase.storage
    .from('photos')
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (error) throw new Error('Erro ao enviar arquivo');

  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

export async function uploadPhotosFromFiles(files: FileList | File[], folder: string): Promise<string[]> {
  const fileArray = Array.from(files);
  
  // Limit number of files per upload
  if (fileArray.length > 10) {
    throw new Error('Máximo de 10 fotos por vez');
  }

  const uploads = fileArray.map(file => uploadPhoto(file, folder));
  return Promise.all(uploads);
}
