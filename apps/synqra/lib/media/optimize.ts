/**
 * Media Optimization Utilities
 *
 * Future enhancements:
 * - Image compression
 * - Video transcoding
 * - Thumbnail generation
 * - Format conversion
 */

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format: string;
  size: number;
}

export async function getMediaMetadata(file: File): Promise<MediaMetadata> {
  return new Promise((resolve) => {
    const metadata: MediaMetadata = {
      format: file.type,
      size: file.size,
    };

    if (file.type.startsWith('image/')) {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        metadata.width = img.width;
        metadata.height = img.height;
        URL.revokeObjectURL(url);
        resolve(metadata);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(metadata);
      };

      img.src = url;
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        metadata.width = video.videoWidth;
        metadata.height = video.videoHeight;
        metadata.duration = video.duration;
        URL.revokeObjectURL(url);
        resolve(metadata);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(metadata);
      };

      video.src = url;
    } else {
      resolve(metadata);
    }
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
