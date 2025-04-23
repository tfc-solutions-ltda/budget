import AuthGuard from '@/components/AuthGuard';
import { RecentBudgets } from '@/components/RecentBudgets';
import { RecentClients } from '@/components/RecentClients';

export default function Home() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              <a
                href="/budgets/new"
                className="bg-gray-800 overflow-hidden shadow-lg hover:shadow-xl transition-shadow rounded-xl border border-gray-700"
              >
                <div className="p-6">
                  <h3 className="text-lg font-medium text-white">
                    Novo Orçamento
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Crie um novo orçamento para um cliente
                  </p>
                </div>
              </a>

              <a
                href="/clients/new"
                className="bg-gray-800 overflow-hidden shadow-lg hover:shadow-xl transition-shadow rounded-xl border border-gray-700"
              >
                <div className="p-6">
                  <h3 className="text-lg font-medium text-white">
                    Novo Cliente
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Cadastre um novo cliente
                  </p>
                </div>
              </a>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecentBudgets />
              <RecentClients />
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
