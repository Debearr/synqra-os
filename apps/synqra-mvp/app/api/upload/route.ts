import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createHash } from 'crypto';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];

export async function POST(req: NextRequest) {
  const supabase = requireSupabaseAdmin();
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: `File type ${file.type} not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 50MB limit` },
        { status: 400 }
      );
    }

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentHash = createHash('sha256').update(buffer).digest('hex');
    const extension = file.name.split('.').pop() || 'bin';
    const filename = `${contentHash}.${extension}`;

    // Upload to Supabase Storage (idempotent by content hash)
    const { error: uploadError } = await supabase.storage
      .from('synqra-media')
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      const message = uploadError.message || '';
      const statusCode =
        typeof uploadError === 'object' &&
        uploadError !== null &&
        'statusCode' in uploadError
          ? (uploadError as { statusCode?: number }).statusCode
          : undefined;
      const isDuplicate = statusCode === 409 || message.toLowerCase().includes('already exists');

      if (!isDuplicate) {
        console.error('Upload error:', uploadError);
        return NextResponse.json(
          { ok: false, error: `Upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('synqra-media')
      .getPublicUrl(filename);

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      metadata: {
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        idempotencyKey: contentHash,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Upload error:', message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
