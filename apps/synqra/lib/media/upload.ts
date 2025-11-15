/**
 * Media Upload Helpers
 */

export interface UploadResult {
  url: string;
  type: 'image' | 'video';
  metadata: {
    filename: string;
    size: number;
    mimeType: string;
  };
}

export async function uploadMedia(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  const result = await response.json();
  return result;
}

export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not supported. Allowed: images (JPEG, PNG, GIF, WebP) and videos (MP4, MOV)`,
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 50MB limit`,
    };
  }

  return { valid: true };
}
