import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BudgetPDF } from './BudgetPDF';
import { Activity, Budget, Story } from '@/types';
import { Client } from '@/types';

type BudgetWithRelations = Budget & {
  client: Client;
  stories: (Story & {
    activities: Activity[];
  })[];
};

interface ExportPDFButtonProps {
  budget: BudgetWithRelations;
}

export function ExportPDFButton({ budget }: ExportPDFButtonProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setIsGenerating] = useState(false);

  return (
    <PDFDownloadLink
      document={<BudgetPDF budget={budget} />}
      fileName={`orcamento-${budget.client.name.toLowerCase().replace(/\s+/g, '-')}-${
        new Date().toISOString().split('T')[0]
      }.pdf`}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      onClick={() => setIsGenerating(true)}
    >
      {({ loading, error }) => {
        if (loading) {
          return 'Gerando PDF...';
        }
        if (error) {
          return 'Erro ao gerar PDF';
        }
        return 'Exportar PDF';
      }}
    </PDFDownloadLink>
  );
}
