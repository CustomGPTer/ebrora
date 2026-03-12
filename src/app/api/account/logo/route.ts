import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'logos');
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Only PNG, JPG, and SVG are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File size exceeds 2MB limit' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.type === 'image/svg+xml' ? 'svg' : file.name.split('.').pop() || 'png';
    const filename = `${session.user.id}-${timestamp}.${extension}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Save file
    await writeFile(filepath, buffer);

    // Get current logo to delete old one
    const existingLogos = await prisma.logo.findMany({
      where: { user_id: session.user.id },
      orderBy: { created_at: 'desc' },
      take: 1,
    });

    if (existingLogos.length > 0) {
      try {
        const oldPath = join(process.cwd(), 'public', existingLogos[0].file_path);
        await unlink(oldPath);
      } catch (err) {
        console.error('Error deleting old logo:', err);
      }
      // Delete old logo record
      await prisma.logo.delete({ where: { id: existingLogos[0].id } });
    }

    // Create new logo record
    const logoPath = `/uploads/logos/${filename}`;
    await prisma.logo.create({
      data: {
        user_id: session.user.id,
        file_path: logoPath,
        original_filename: file.name,
      },
    });

    return NextResponse.json(
      {
        message: 'Logo uploaded successfully',
        logo: logoPath,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const existingLogos = await prisma.logo.findMany({
      where: { user_id: session.user.id },
      orderBy: { created_at: 'desc' },
      take: 1,
    });

    if (existingLogos.length === 0) {
      return NextResponse.json(
        { message: 'No logo to delete' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      const filepath = join(process.cwd(), 'public', existingLogos[0].file_path);
      await unlink(filepath);
    } catch (err) {
      console.error('Error deleting logo file:', err);
    }

    // Delete logo record
    await prisma.logo.delete({ where: { id: existingLogos[0].id } });

    return NextResponse.json(
      { message: 'Logo deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
