'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { ExportPDFButton } from '@/components/ExportPDFButton';

interface Client {
  id: string;
  name: string;
  email: string | null;
  logo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Activity {
  id: string;
  title: string;
  description: string | null;
  hours: number;
  isExpanded: boolean;
  complexityFactor: number;
  storyId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Story {
  id: string;
  title: string;
  activities: Activity[];
  isExpanded: boolean;
  complexityFactor: number;
  createdAt: Date;
  updatedAt: Date;
  budgetId: string;
}

interface Budget {
  id: string;
  title: string;
  clientId: string;
  userId: string;
  hourlyRate: number;
  testPercentage: number;
  availableHours: number;
  projectComplexityFactor: number;
  stories: Story[];
  client: Client;
  totalHours: number;
  totalTestHours: number;
  totalValue: number;
  estimatedDays: number;
  complexityFactor: number;
  createdAt: Date;
  updatedAt: Date;
}

const COMPLEXITY_OPTIONS = [
  { value: 1, label: 'Baixa (1x)' },
  { value: 1.2, label: 'Média (1.2x)' },
  { value: 1.5, label: 'Alta (1.5x)' },
  { value: 2, label: 'Muito Alta (2x)' }
];

export default function EditBudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [hourlyRate, setHourlyRate] = useState(200);
  const [testPercentage, setTestPercentage] = useState(30);
  const [projectComplexityFactor, setProjectComplexityFactor] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [budgetTitle, setBudgetTitle] = useState('');
  const [numberOfDevs, setNumberOfDevs] = useState(3);
  const [hoursPerDev, setHoursPerDev] = useState(2);
  const availableHours = numberOfDevs * hoursPerDev;
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [budget, setBudget] = useState<Budget | null>(null);

  useEffect(() => {
    if (!resolvedParams.id) return;
    loadClients();
    loadBudget();
  }, [resolvedParams.id]);

  async function loadClients() {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoadingClients(false);
    }
  }

  async function loadBudget() {
    try {
      const response = await fetch(`/api/budgets/${resolvedParams.id}`);
      if (!response.ok) throw new Error('Failed to fetch budget');
      const data: Budget = await response.json();
      setBudget(data);
      
      setBudgetTitle(data.title);
      setSelectedClientId(data.clientId);
      setHourlyRate(data.hourlyRate);
      setTestPercentage(data.testPercentage);
      setProjectComplexityFactor(data.projectComplexityFactor || 1);
      setStories(data.stories.map(story => ({
        ...story,
        isExpanded: false,
        activities: story.activities.map(activity => ({
          ...activity,
          isExpanded: false
        }))
      })));
      
      // Calcular número de devs e horas por dev baseado nas horas disponíveis
      const devs = Math.ceil(data.availableHours / 8); // Assumindo 8 horas por dia
      setNumberOfDevs(devs);
      setHoursPerDev(Math.ceil(data.availableHours / devs));
    } catch (error) {
      console.error('Error loading budget:', error);
    }
  }

  // Função auxiliar para calcular horas com complexidade
  const calculateHoursWithComplexity = (baseHours: number, activityFactor: number, storyFactor: number) => {
    return baseHours * activityFactor * storyFactor;
  };

  // Cálculos
  const totalHoursPerStory = stories.map(story => ({
    id: story.id,
    baseHours: story.activities.reduce((sum, activity) => sum + (activity.hours || 0), 0),
    hoursWithComplexity: story.activities.reduce((sum, activity) => 
      sum + calculateHoursWithComplexity(activity.hours || 0, activity.complexityFactor || 1, story.complexityFactor || 1), 0)
  }));

  const totalBaseHours = totalHoursPerStory.reduce((sum, story) => sum + story.baseHours, 0);
  const totalHoursWithAllComplexity = totalHoursPerStory.reduce((sum, story) => sum + story.hoursWithComplexity, 0);
  const totalHoursWithProjectComplexity = totalHoursWithAllComplexity * (projectComplexityFactor || 1);
  const testHours = (totalHoursWithProjectComplexity * (testPercentage || 0)) / 100;
  const totalHoursWithTests = totalHoursWithProjectComplexity + testHours;
  const totalValue = totalHoursWithTests * (hourlyRate || 0);
  const estimatedDays = Math.ceil(totalHoursWithTests / (availableHours || 1));
  const estimatedWeeks = estimatedDays / 5; // 5 dias úteis por semana
  const weeksText = estimatedWeeks === 1 
    ? '1 semana' 
    : estimatedWeeks < 1 
      ? `${estimatedWeeks.toFixed(1)} semanas` 
      : `${estimatedWeeks.toFixed(1)} semanas`;

  const addStory = () => {
    setStories([...stories, {
      id: crypto.randomUUID(),
      title: '',
      activities: [{
        id: crypto.randomUUID(),
        title: '',
        description: '',
        hours: 0,
        isExpanded: false,
        complexityFactor: 1,
        storyId: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      isExpanded: false,
      complexityFactor: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      budgetId: budget?.id || ''
    }]);
  };

  const addActivity = (storyId: string) => {
    setStories(stories.map(story => 
      story.id === storyId 
        ? {
            ...story,
            activities: [...story.activities, {
              id: crypto.randomUUID(),
              title: '',
              description: '',
              hours: 0,
              isExpanded: false,
              complexityFactor: 1,
              storyId: story.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }]
          }
        : story
    ));
  };

  const removeActivity = (storyId: string, activityId: string) => {
    setStories(stories.map(story => 
      story.id === storyId 
        ? {
            ...story,
            activities: story.activities.filter(a => a.id !== activityId)
          }
        : story
    ));
  };

  const removeStory = (storyId: string) => {
    setStories(stories.filter(s => s.id !== storyId));
  };

  const updateStoryTitle = (storyId: string, title: string) => {
    setStories(stories.map(story => 
      story.id === storyId ? { ...story, title } : story
    ));
  };

  const updateActivity = (storyId: string, activityId: string, field: keyof Activity, value: string | number | null) => {
    setStories(stories.map(story => 
      story.id === storyId 
        ? {
            ...story,
            activities: story.activities.map(activity => 
              activity.id === activityId 
                ? { ...activity, [field]: value }
                : activity
            )
          }
        : story
    ));
  };

  const toggleActivityExpanded = (storyId: string, activityId: string) => {
    setStories(stories.map(story => 
      story.id === storyId 
        ? {
            ...story,
            activities: story.activities.map(activity => 
              activity.id === activityId 
                ? { ...activity, isExpanded: !activity.isExpanded }
                : activity
            )
          }
        : story
    ));
  };

  const toggleStoryExpanded = (storyId: string) => {
    setStories(stories.map(story => 
      story.id === storyId 
        ? { ...story, isExpanded: !story.isExpanded }
        : story
    ));
  };

  const updateStoryComplexity = (storyId: string, factor: number) => {
    setStories(stories.map(story => 
      story.id === storyId 
        ? { ...story, complexityFactor: factor }
        : story
    ));
  };

  const updateActivityComplexity = (storyId: string, activityId: string, factor: number) => {
    setStories(stories.map(story => 
      story.id === storyId 
        ? {
            ...story,
            activities: story.activities.map(activity => 
              activity.id === activityId 
                ? { ...activity, complexityFactor: factor }
                : activity
            )
          }
        : story
    ));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedClientId || !budgetTitle) {
        alert('Por favor, preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }

      // Validar se todas as histórias têm título
      if (stories.some(story => !story.title)) {
        alert('Por favor, preencha o título de todas as histórias');
        setLoading(false);
        return;
      }

      // Validar se todas as atividades têm título e horas
      if (stories.some(story => 
        story.activities.some(activity => !activity.title || activity.hours <= 0)
      )) {
        alert('Por favor, preencha o título e as horas de todas as atividades');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/budgets/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          title: budgetTitle,
          hourlyRate,
          testPercentage,
          availableHours,
          projectComplexityFactor,
          stories: stories.map(story => ({
            id: story.id,
            title: story.title,
            complexityFactor: story.complexityFactor,
            activities: story.activities.map(activity => ({
              id: activity.id,
              title: activity.title,
              description: activity.description,
              hours: activity.hours,
              complexityFactor: activity.complexityFactor
            }))
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar orçamento');
      }

      router.push(`/budgets/${resolvedParams.id}/edit`);
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Erro ao atualizar orçamento. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const budgetForPDF = budget ? {
    ...budget,
    client: clients.find(c => c.id === selectedClientId) || budget.client,
    stories: stories.map(story => ({
      ...story,
      createdAt: story.createdAt || new Date(),
      updatedAt: new Date(),
      budgetId: budget.id,
      activities: story.activities.map(activity => ({
        ...activity,
        complexityFactor: activity.complexityFactor || 1,
        storyId: story.id,
        description: activity.description || null,
        createdAt: activity.createdAt || new Date(),
        updatedAt: new Date()
      }))
    })),
    totalHours: totalHoursWithProjectComplexity,
    totalTestHours: testHours,
    totalValue,
    estimatedDays,
    createdAt: budget.createdAt,
    updatedAt: new Date()
  } : null;

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center sm:text-left mb-8">
          <h1 className="text-2xl font-bold text-white">Editar Orçamento</h1>
          <p className="mt-1 text-sm text-gray-400">
            Atualize as informações do orçamento
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar com Cálculos */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6 sticky top-0">
              <h2 className="text-lg font-medium text-white">Resumo do Orçamento</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Total de Horas Base</p>
                  <p className="text-lg font-medium text-white">{totalBaseHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total com Todas Complexidades</p>
                  <p className="text-lg font-medium text-white">{totalHoursWithProjectComplexity.toFixed(1)}h</p>
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    {stories.some(s => s.complexityFactor > 1 || s.activities.some(a => a.complexityFactor > 1)) && (
                      <p>Inclui complexidade das atividades e histórias</p>
                    )}
                    {projectComplexityFactor > 1 && (
                      <p>Fator de complexidade do projeto: {projectComplexityFactor}x</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Horas de Teste</p>
                  <p className="text-lg font-medium text-white">{testHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total de Horas Final</p>
                  <p className="text-lg font-medium text-white">{totalHoursWithTests.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Valor Total</p>
                  <p className="text-lg font-medium text-white">
                    R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Prazo Estimado</p>
                  <p className="text-lg font-medium text-white">
                    {estimatedDays} dias úteis ({weeksText})
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <div className="space-y-6">
                  {/* Configurações Resumidas */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-white">Configurações do Projeto</h3>
                      <button
                        onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                        className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 px-3 py-1.5 rounded-md hover:bg-gray-700/50"
                      >
                        <span className="text-sm">{isConfigExpanded ? 'Recolher' : 'Expandir'}</span>
                        <svg
                          className={`w-4 h-4 transform transition-transform ${isConfigExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Valor Hora</div>
                        <div className="text-xl font-medium text-white">R$ {hourlyRate}</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Testes</div>
                        <div className="text-xl font-medium text-white">{testPercentage}%</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Complexidade</div>
                        <div className="text-xl font-medium text-white">{projectComplexityFactor}x</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Horas/Dia</div>
                        <div className="text-xl font-medium text-white">{availableHours}h</div>
                      </div>
                    </div>
                  </div>

                  {/* Configurações Expandidas */}
                  {isConfigExpanded && (
                    <div className="space-y-6 pt-6 border-t border-gray-700">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Valor Hora (R$)
                          </label>
                          <input
                            type="number"
                            value={hourlyRate}
                            onChange={(e) => setHourlyRate(parseFloat(e.target.value))}
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Testes (%)
                          </label>
                          <input
                            type="number"
                            value={testPercentage}
                            onChange={(e) => setTestPercentage(parseInt(e.target.value))}
                            min="0"
                            max="100"
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Qtd Devs
                          </label>
                          <input
                            type="number"
                            value={numberOfDevs}
                            onChange={(e) => setNumberOfDevs(parseInt(e.target.value))}
                            min="1"
                            max="10"
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Horas (Dia)
                          </label>
                          <input
                            type="number"
                            value={hoursPerDev}
                            onChange={(e) => setHoursPerDev(parseInt(e.target.value))}
                            min="1"
                            max="8"
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Complexidade do Projeto
                        </label>
                        <select
                          value={projectComplexityFactor}
                          onChange={(e) => setProjectComplexityFactor(parseFloat(e.target.value))}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {COMPLEXITY_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
                {/* Dados Básicos */}
                <div className="space-y-6">
                  <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-white mb-2">
                      Cliente
                    </label>
                    {loadingClients ? (
                      <div className="h-10 flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : clients.length === 0 ? (
                      <div className="text-sm text-gray-400">
                        Nenhum cliente cadastrado.{' '}
                        <a href="/clients/new" className="text-blue-500 hover:text-blue-400">
                          Cadastrar cliente
                        </a>
                      </div>
                    ) : (
                      <select
                        id="clientId"
                        name="clientId"
                        required
                        value={selectedClientId}
                        onChange={(e) => {
                          setSelectedClientId(e.target.value);
                        }}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecione um cliente</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                      Título do Orçamento
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      value={budgetTitle}
                      onChange={(e) => {
                        setBudgetTitle(e.target.value);
                      }}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite o título do orçamento"
                    />
                  </div>
                </div>

                {/* Histórias e Atividades */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-white">Histórias e Atividades</h2>
                    <button
                      type="button"
                      onClick={addStory}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar História
                    </button>
                  </div>

                  {stories.map((story) => (
                    <div key={story.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleStoryExpanded(story.id)}
                              className="text-gray-400 hover:text-white"
                            >
                              <svg
                                className={`w-4 h-4 transform transition-transform ${story.isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                value={story.title}
                                onChange={(e) => updateStoryTitle(story.id, e.target.value)}
                                placeholder="Título da História"
                                className="flex-1 px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <select
                                value={story.complexityFactor}
                                onChange={(e) => updateStoryComplexity(story.id, parseFloat(e.target.value))}
                                className="w-32 px-2 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                {COMPLEXITY_OPTIONS.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => removeStory(story.id)}
                                className="p-1.5 text-gray-400 hover:text-red-400"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="ml-6 text-sm text-gray-400 mt-3">
                            {story.activities.length} {story.activities.length === 1 ? 'atividade' : 'atividades'} • 
                            {totalHoursPerStory.find(s => s.id === story.id)?.hoursWithComplexity.toFixed(1)}h estimadas
                            {story.complexityFactor > 1 && ` • Complexidade ${story.complexityFactor}x`}
                          </div>
                        </div>
                      </div>

                      {story.isExpanded && (
                        <div className="mt-3 ml-6 space-y-2">
                          {story.activities.map((activity) => (
                            <div key={activity.id} className="bg-gray-600 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleActivityExpanded(story.id, activity.id)}
                                      className="text-gray-400 hover:text-white"
                                    >
                                      <svg
                                        className={`w-4 h-4 transform transition-transform ${activity.isExpanded ? 'rotate-90' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                    <span className="text-white font-medium">{activity.title || 'Nova Atividade'}</span>
                                  </div>
                                  <div className="ml-6 text-sm text-gray-400">
                                    {calculateHoursWithComplexity(activity.hours, activity.complexityFactor, story.complexityFactor).toFixed(1)}h estimadas
                                    {activity.complexityFactor > 1 && ` • Complexidade ${activity.complexityFactor}x`}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={activity.complexityFactor}
                                    onChange={(e) => updateActivityComplexity(story.id, activity.id, parseFloat(e.target.value))}
                                    className="w-32 px-2 py-1.5 bg-gray-500 border border-gray-400 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    {COMPLEXITY_OPTIONS.map(option => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => removeActivity(story.id, activity.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-400"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {activity.isExpanded && (
                                <div className="mt-3 ml-6 space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                      Nome da Atividade
                                    </label>
                                    <input
                                      type="text"
                                      value={activity.title}
                                      onChange={(e) => updateActivity(story.id, activity.id, 'title', e.target.value)}
                                      placeholder="Nome da atividade"
                                      className="w-full px-3 py-1.5 bg-gray-500 border border-gray-400 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                      Horas Estimadas
                                    </label>
                                    <input
                                      type="number"
                                      value={activity.hours}
                                      onChange={(e) => updateActivity(story.id, activity.id, 'hours', parseFloat(e.target.value))}
                                      min="0"
                                      step="0.5"
                                      className="w-full px-3 py-1.5 bg-gray-500 border border-gray-400 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                      Descrição (opcional)
                                    </label>
                                    <textarea
                                      value={activity.description || ''}
                                      onChange={(e) => updateActivity(story.id, activity.id, 'description', e.target.value)}
                                      className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                      rows={3}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addActivity(story.id)}
                            className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Adicionar Atividade
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-4">
                {budgetForPDF && <ExportPDFButton budget={budgetForPDF} />}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 