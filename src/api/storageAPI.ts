import { supabase } from '../lib/supabaseClient';
import { safeRandomUUID } from '../utils/random';

const TEMPLATE_ASSET_BUCKET = 'template-assets';

type UploadTemplateAssetArgs = {
  file: File;
  userId: string;
  folder?: string;
};

export async function uploadTemplateAsset({ file, userId, folder = 'assets' }: UploadTemplateAssetArgs) {
  const fileExt = file.name.split('.').pop() ?? 'png';
  const fileName = `${safeRandomUUID()}.${fileExt}`;
  const filePath = `${userId}/${folder}/${fileName}`;

  const { error } = await supabase.storage.from(TEMPLATE_ASSET_BUCKET).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  const { data } = supabase.storage.from(TEMPLATE_ASSET_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
