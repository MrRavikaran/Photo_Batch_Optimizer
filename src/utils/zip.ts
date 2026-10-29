import { calculateCRC32 } from './crc32';

export interface ZipFileInput {
  name: string;
  data: Uint8Array | ArrayBuffer;
  date?: Date;
}

/**
 * Encodes a valid standard PKZip format archive in memory with zero external libraries.
 * Uses method 0 (STORE), which is instantaneous, has zero compression CPU overhead,
 * and preserves exact binary integrity for already-compressed WebP, JPEG, PNG, and AVIF images.
 */
export async function createZipBlob(
  files: (ZipFileInput | { name: string; blob: Blob })[],
  onProgress?: (percent: number, currentFile: string) => void
): Promise<Blob> {
  const encoder = new TextEncoder();
  
  interface ProcessedEntry {
    nameBytes: Uint8Array;
    data: Uint8Array;
    crc: number;
    compressedSize: number;
    uncompressedSize: number;
    localHeaderOffset: number;
    dosTime: number;
    dosDate: number;
  }

  const entries: ProcessedEntry[] = [];
  const parts: any[] = [];
  let currentOffset = 0;

  const now = new Date();
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
  const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    if (onProgress) {
      onProgress(Math.round(((i) / files.length) * 50), item.name);
    }

    let fileBytes: Uint8Array;
    if ('blob' in item) {
      const buffer = await item.blob.arrayBuffer();
      fileBytes = new Uint8Array(buffer);
    } else if (item.data instanceof Uint8Array) {
      fileBytes = item.data;
    } else {
      fileBytes = new Uint8Array(item.data);
    }

    const nameBytes = encoder.encode(item.name.replace(/\\/g, '/'));
    const crc = calculateCRC32(fileBytes);
    const size = fileBytes.length;

    // --- Local File Header (30 bytes + name length) ---
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true);         // Version needed to extract (2.0)
    view.setUint16(6, 0x0800, true);     // General purpose bit flag (Bit 11: Language encoding flag / UTF-8)
    view.setUint16(8, 0, true);          // Compression method: 0 = Store
    view.setUint16(10, dosTime, true);   // Last mod time
    view.setUint16(12, dosDate, true);   // Last mod date
    view.setUint32(14, crc, true);       // CRC-32
    view.setUint32(18, size, true);      // Compressed size
    view.setUint32(22, size, true);      // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // File name length
    view.setUint16(28, 0, true);         // Extra field length

    localHeader.set(nameBytes, 30);

    const localHeaderOffset = currentOffset;
    parts.push(localHeader);
    parts.push(fileBytes);

    currentOffset += localHeader.length + fileBytes.length;

    entries.push({
      nameBytes,
      data: fileBytes,
      crc,
      compressedSize: size,
      uncompressedSize: size,
      localHeaderOffset,
      dosTime,
      dosDate,
    });
  }

  // --- Central Directory Records ---
  const centralDirectoryOffset = currentOffset;
  let centralDirectorySize = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (onProgress) {
      onProgress(50 + Math.round(((i) / entries.length) * 50), '');
    }

    // 46 bytes + nameBytes length
    const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
    const cdView = new DataView(cdHeader.buffer);

    cdView.setUint32(0, 0x02014b50, true); // Central directory header signature
    cdView.setUint16(4, 0x003F, true);     // Version made by (Unix / DOS compatible)
    cdView.setUint16(6, 20, true);         // Version needed to extract (2.0)
    cdView.setUint16(8, 0x0800, true);     // Bit 11 UTF-8
    cdView.setUint16(10, 0, true);         // Method: Store
    cdView.setUint16(12, entry.dosTime, true);
    cdView.setUint16(14, entry.dosDate, true);
    cdView.setUint32(16, entry.crc, true);
    cdView.setUint32(20, entry.compressedSize, true);
    cdView.setUint32(24, entry.uncompressedSize, true);
    cdView.setUint16(28, entry.nameBytes.length, true);
    cdView.setUint16(30, 0, true);         // Extra field length
    cdView.setUint16(32, 0, true);         // File comment length
    cdView.setUint16(34, 0, true);         // Disk number start
    cdView.setUint16(36, 0, true);         // Internal attributes
    cdView.setUint32(38, 0x81A40000, true); // External attributes (regular file -rw-r--r--)
    cdView.setUint32(42, entry.localHeaderOffset, true); // Relative offset of local header

    cdHeader.set(entry.nameBytes, 46);

    parts.push(cdHeader);
    centralDirectorySize += cdHeader.length;
    currentOffset += cdHeader.length;
  }

  // --- End of Central Directory Record (22 bytes) ---
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);

  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true);          // Number of this disk
  eocdView.setUint16(6, 0, true);          // Disk where CD starts
  eocdView.setUint16(8, entries.length, true);  // Number of CD records on this disk
  eocdView.setUint16(10, entries.length, true); // Total number of CD records
  eocdView.setUint32(12, centralDirectorySize, true); // Size of central directory
  eocdView.setUint32(16, centralDirectoryOffset, true); // Offset of start of CD
  eocdView.setUint16(20, 0, true);         // Comment length

  parts.push(eocd);

  if (onProgress) {
    onProgress(100, 'Finalizing archive');
  }

  return new Blob(parts, { type: 'application/zip' });
}
