import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { Budget, Client, Story, Activity } from '@prisma/client';
import { getLogoBase64 } from '../../base-logo';

// Logo em base64 (substitua pelo seu base64 real)
const logo = getLogoBase64()
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    paddingBottom: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 'auto',
    objectFit: 'contain',
    borderRadius: 8,
  },
  clientLogo: {
    width: 60,
    height: 'auto',
    objectFit: 'contain',
    borderRadius: 8,
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
    color: '#1a365d',
    fontWeight: 'bold',
  },
  clientInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientInfoText: {
    flex: 1,
  },
  clientGreeting: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 5,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#1a365d',
    fontWeight: 'bold',
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 5,
  },
  story: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  activity: {
    marginLeft: 15,
    marginBottom: 8,
    paddingLeft: 10,
    borderLeft: 2,
    borderLeftColor: '#e2e8f0',
  },
  activityTitle: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 5,
  },
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    borderTop: 1,
    paddingTop: 10,
  },
  footerText: {
    marginBottom: 5,
  },
  footerContact: {
    marginTop: 5,
  },
});

type BudgetWithRelations = Budget & {
  client: Client;
  stories: (Story & {
    activities: Activity[];
  })[];
};

interface BudgetPDFProps {
  budget: BudgetWithRelations;
}

export function BudgetPDF({ budget }: BudgetPDFProps) {
  const formatDuration = (days: number) => {
    if (days < 5) {
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    } else if (days < 20) {
      const weeks = Math.ceil(days / 5);
      return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    } else {
      const months = Math.ceil(days / 20);
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image
            src={logo}
            style={styles.logo}
          />
          <Text style={styles.title}>{budget.title}</Text>
        </View>

        <View style={styles.clientInfo}>
          {budget.client.logo && (
            <Image
              src={budget.client.logo}
              style={styles.clientLogo}
            />
          )}
          <View style={styles.clientInfoText}>
            <Text style={styles.clientName}>{budget.client.name}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes</Text>
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Prazo Estimado</Text>
              <Text style={styles.summaryValue}>{formatDuration(budget.estimatedDays)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Valor Total</Text>
              <Text style={styles.summaryValue}>{formatPrice(budget.totalValue)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escopo do Projeto</Text>
          {budget.stories.map((story) => (
            <View key={story.id} style={styles.story}>
              <Text style={styles.storyTitle}>{story.title}</Text>
              {story.activities.map((activity) => (
                <View key={activity.id} style={styles.activity}>
                  <Text style={styles.activityTitle}>• {activity.title}</Text>
                  {activity.description && (
                    <Text style={styles.activityDescription}>
                      {activity.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>TFC Solution - Transformando ideias em realidade</Text>
        </View>
      </Page>
    </Document>
  );
} 