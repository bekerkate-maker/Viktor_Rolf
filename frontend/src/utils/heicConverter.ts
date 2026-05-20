import heic2any from 'heic2any';

/**
 * Checks if a file is an HEIC/HEIF image and converts it to JPEG.
 * Returns the original file if it's not an HEIC image.
 */
export async function convertHeicToJpegIfNeeded(file: File): Promise<File> {
  const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                 file.name.toLowerCase().endsWith('.heif') ||
                 file.type === 'image/heic' || 
                 file.type === 'image/heif';

  if (!isHeic) {
    return file;
  }

  try {
    // Explicitly create a Blob to ensure compatibility with heic2any
    const blobToConvert = new Blob([await file.arrayBuffer()], { type: file.type || 'image/heic' });

    const convertedBlob = await heic2any({
      blob: blobToConvert,
      toType: 'image/jpeg',
      quality: 0.8
    });

    const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    const newName = file.name.replace(/\.hei[cf]$/i, '.jpg');
    return new File([blobToUse], newName, { type: 'image/jpeg' });
  } catch (error: any) {
    console.error(`Failed to convert HEIC file ${file.name}:`, error?.message || error);
    if (error && typeof error === 'object') {
      console.error(JSON.stringify(error));
    }
    return file;
  }
}

/**
 * Takes an array of Files, converts any HEIC files to JPEG, and returns the new array.
 */
export async function processFilesForUpload(files: File[]): Promise<File[]> {
  const processedFiles = await Promise.all(
    files.map(file => convertHeicToJpegIfNeeded(file))
  );
  return processedFiles;
}
