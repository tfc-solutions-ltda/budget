'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useState } from 'react';

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn('google', {
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      // Erro silencioso - já temos feedback visual com o estado de loading
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1E23]">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="flex flex-col items-center">
          <Image
            src="/images/logo-tfc.png"
            alt="TFC Solutions Logo"
            width={120}
            height={120}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
            priority
          />
          <h1 className="text-4xl font-bold text-white mt-8 mb-2">
            TFC Solutions
          </h1>
          <h2 className="text-xl text-gray-400 mb-8">
            Sistema de Orçamentos
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className={`w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-[#00B5B5] hover:bg-[#009999] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00B5B5] focus:ring-offset-[#1A1E23] ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
            ) : (
              <svg
                className="w-6 h-6 mr-3"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
            )}
            {isLoading ? 'Entrando...' : 'Entrar com Google'}
          </button>
          <p className="text-center text-sm text-gray-400">
            Apenas e-mails @tfcsolutions.tech são permitidos
          </p>
        </div>
      </div>
    </div>
  );
}