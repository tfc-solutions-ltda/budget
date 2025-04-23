'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="w-full bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:text-gray-300 transition-colors">
          <div className="bg-white rounded-full p-0.5 w-8 h-8 flex items-center justify-center">
            <Image
              src="/images/logo-tfc.png"
              alt="TFC Solutions"
              width={28}
              height={28}
              className="rounded-full"
            />
          </div>
          <span className="text-2xl font-bold">Sistema de Orçamentos</span>
        </Link>

        {session?.user && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {session.user.image && (
                <div className="border-2 border-gray-700 rounded-full p-0.5">
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </div>
              )}
              <span className="text-sm text-gray-300">{session.user.name}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
} 