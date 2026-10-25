import type { UploadedVideo, VideoContentType, ZeyooApi } from '@/shared/api';

/** Mirrors the server's VIDEO_MAX_BYTES so an oversized pick fails before uploading. */
export const VIDEO_MAX_BYTES = 500 * 1024 * 1024;

const VIDEO_TYPES: Record<string, VideoContentType> = {
  'video/mp4': 'video/mp4',
  'video/quicktime': 'video/quicktime',
  'video/webm': 'video/webm',
};

/** Checks a chosen file before anything is sent; returns the content type to declare. */
export function checkVideoFile(file: File): VideoContentType {
  const contentType = VIDEO_TYPES[file.type];
  if (!contentType) throw new Error('Choose an MP4, MOV or WebM video.');
  if (file.size > VIDEO_MAX_BYTES) throw new Error('That video is over 500 MB. Trim it or choose a shorter one.');
  return contentType;
}

/**
 * Uploads straight to storage: reserve → PUT the file to the signed URL (with progress)
 * → confirm. Resolves to the URL to submit. XHR rather than fetch, for upload progress.
 */
export async function uploadVideo(
  api: ZeyooApi,
  file: File,
  onProgress: (fraction: number) => void,
): Promise<UploadedVideo> {
  const contentType = checkVideoFile(file);
  const ticket = await api.startVideoUpload({ contentType, size: file.size });
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', ticket.uploadUrl);
    Object.entries(ticket.uploadHeaders).forEach(([name, value]) => xhr.setRequestHeader(name, value));
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`The upload did not finish (status ${xhr.status}). Try again.`));
    xhr.onerror = () => reject(new Error('The upload was interrupted. Check your connection and try again.'));
    xhr.send(file);
  });
  onProgress(1);
  return api.completeVideoUpload(ticket.id);
}
