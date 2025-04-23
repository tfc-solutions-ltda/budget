import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { supabase } from '@/lib/supabase/server';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const clients = await prisma.client.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const logoFile = formData.get('logo') as File;

    // Validação dos dados
    if (!name || name.trim().length === 0) {
      return new NextResponse('Name is required', { status: 400 });
    }

    if (email && !email.includes('@')) {
      return new NextResponse('Invalid email format', { status: 400 });
    }

    let logoUrl = null;

    if (logoFile) {
      // Validação do arquivo
      if (!ALLOWED_FILE_TYPES.includes(logoFile.type)) {
        return new NextResponse('Invalid file type. Allowed types: JPEG, PNG, GIF', {
          status: 400,
        });
      }

      if (logoFile.size > MAX_FILE_SIZE) {
        return new NextResponse('File too large. Maximum size: 2MB', { status: 400 });
      }

      // Gera um nome único para o arquivo
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `clients/${fileName}`;

      // Upload para o Supabase Storage
      const { error } = await supabase.storage.from('clients').upload(filePath, logoFile, {
        contentType: logoFile.type,
        cacheControl: '3600',
      });

      if (error) {
        console.error('Error uploading file:', error);
        return new NextResponse('Error uploading file', { status: 500 });
      }

      // Obtém a URL pública do arquivo
      const {
        data: { publicUrl },
      } = supabase.storage.from('clients').getPublicUrl(filePath);

      logoUrl = publicUrl;
    }

    // Cria o cliente no banco de dados
    const client = await prisma.client.create({
      data: {
        name,
        email,
        logo: logoUrl,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
