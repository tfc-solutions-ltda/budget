import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth/config';
import { supabase } from '@/lib/supabase/server';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = context.params;

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: {
        id,
      },
    });

    if (!client) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = context.params;

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

    if (logoFile && logoFile.size > 0) {
      // Validação do arquivo
      if (!ALLOWED_FILE_TYPES.includes(logoFile.type)) {
        return new NextResponse(
          'Invalid file type. Allowed types: JPEG, PNG, GIF',
          { status: 400 }
        );
      }

      if (logoFile.size > MAX_FILE_SIZE) {
        return new NextResponse(
          'File too large. Maximum size: 2MB',
          { status: 400 }
        );
      }

      // Gera um nome único para o arquivo
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `clients/${fileName}`;

      // Upload para o Supabase Storage
      const { error } = await supabase.storage
        .from('clients') // Mudando para o bucket 'clients'
        .upload(filePath, logoFile, {
          contentType: logoFile.type,
          cacheControl: '3600',
        });

      if (error) {
        console.error('Error uploading file:', error);
        return new NextResponse('Error uploading file', { status: 500 });
      }

      // Obtém a URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('clients') // Mudando para o bucket 'clients'
        .getPublicUrl(filePath);

      logoUrl = publicUrl;
    }

    // Atualiza o cliente no banco de dados
    const client = await prisma.client.update({
      where: {
        id,
      },
      data: {
        name,
        email,
        ...(logoUrl && { logo: logoUrl }),
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = context.params;

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if client has any budgets
    const client = await prisma.client.findUnique({
      where: {
        id,
      },
      include: {
        budgets: true,
      },
    });

    if (!client) {
      return new NextResponse('Not Found', { status: 404 });
    }

    if (client.budgets.length > 0) {
      return new NextResponse(
        'Cannot delete client with associated budgets',
        { status: 400 }
      );
    }

    // Remove a logo do Supabase Storage se existir
    if (client.logo) {
      try {
        const logoPath = client.logo.split('/').pop();
        if (logoPath) {
          await supabase.storage
            .from('clients')
            .remove([`clients/${logoPath}`]);
        }
      } catch (error) {
        console.error('Error removing logo from storage:', error);
        // Continua com a exclusão mesmo se falhar em remover a logo
      }
    }

    await prisma.client.delete({
      where: {
        id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting client:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 