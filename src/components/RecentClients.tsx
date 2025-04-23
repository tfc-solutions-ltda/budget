import { prisma } from '@/lib/prisma';
import { Client } from '@/types';
import Link from 'next/link';

export async function RecentClients() {
  const clients = await prisma.client.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h2 className="text-lg font-medium text-white mb-4">Clientes Recentes</h2>
      <div className="space-y-4">
        {clients.map((client: Client) => (
          <Link
            key={client.id}
            href={`/clients/${client.id}/edit`}
            className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-medium">{client.name}</h3>
                <p className="text-gray-400 text-sm">
                  {client.email || 'Sem email'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">
                  {new Date(client.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-4">
        <Link
          href="/clients"
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          Ver todos os clientes →
        </Link>
      </div>
    </div>
  );
} 