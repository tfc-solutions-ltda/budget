/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function RecentBudgets() {
  const budgets = await prisma.budget.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      client: true,
    },
  });

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h2 className="text-lg font-medium text-white mb-4">Orçamentos Recentes</h2>
      <div className="space-y-4">
        {budgets.map((budget: any) => (
          <Link
            key={budget.id}
            href={`/budgets/${budget.id}/edit`}
            className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-medium">{budget.client.name} - {budget.title}</h3>
                <p className="text-gray-400 text-sm">
                  {format(new Date(budget.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">R$ {budget.totalValue.toFixed(2)}</p>
                <p className="text-gray-400 text-sm">{budget.totalHours.toFixed(1)} horas</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-4">
        <Link href="/budgets" className="text-blue-400 hover:text-blue-300 text-sm">
          Ver todos os orçamentos →
        </Link>
      </div>
    </div>
  );
}
