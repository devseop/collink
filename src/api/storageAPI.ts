import { supabase } from '../lib/supabaseClient';
import { safeRandomUUID } from '../utils/random';

const TEMPLATE_ASSET_BUCKET = 'template-assets';
const TEMPLATE_THUMBNAIL_BUCKET = 'template-thumbnail';

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

type UploadTemplateThumbnailArgs = {
  file: Blob;
  userId: string;
};

export async function uploadTemplateThumbnail({ file, userId }: UploadTemplateThumbnailArgs) {
  const fileName = `${safeRandomUUID()}.jpg`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage.from(TEMPLATE_THUMBNAIL_BUCKET).upload(filePath, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  });

  if (error) {
    throw new Error(`썸네일 업로드 실패: ${error.message}`);
  }

  const { data } = supabase.storage.from(TEMPLATE_THUMBNAIL_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
