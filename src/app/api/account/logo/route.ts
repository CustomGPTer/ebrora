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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { logo: true },
    });

    if (user?.logo) {
      try {
        const oldPath = join(process.cwd(), 'public', user.logo);
        await unlink(oldPath);
      } catch (err) {
        console.error('Error deleting old logo:', err);
      }
    }

    // Update user record
    const logoPath = `/uploads/logos/${filename}`;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { logo: logoPath },
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { logo: true },
    });

    if (!user?.logo) {
      return NextResponse.json(
        { message: 'No logo to delete' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      const filepath = join(process.cwd(), 'public', user.logo);
      await unlink(filepath);
    } catch (err) {
      console.error('Error deleting logo file:', err);
    }

    // Update user record
    await prisma.user.update({
      where: { id: session.user.id },
      data: { logo: null },
    });

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
