/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

interface Activity {
  id: string;
  title: string;
  description: string;
  hours: number;
  complexityFactor: number;
}

interface Story {
  id: string;
  title: string;
  complexityFactor: number;
  activities: Activity[];
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const budget = await prisma.budget.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        stories: {
          include: {
            activities: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!budget) {
      return new NextResponse('Budget not found', { status: 404 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error loading budget:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const {
      clientId,
      title,
      hourlyRate,
      testPercentage,
      availableHours,
      projectComplexityFactor: complexityFactor,
      stories,
    } = body;

    // Validação básica
    if (
      !clientId ||
      !title ||
      !hourlyRate ||
      !testPercentage ||
      !availableHours ||
      !complexityFactor
    ) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Verifica se o orçamento existe e pertence ao usuário
    const existingBudget = await prisma.budget.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingBudget) {
      return new NextResponse('Budget not found', { status: 404 });
    }

    // Calcula o total de horas considerando os fatores de complexidade
    const totalHours = stories.reduce((sum: number, story: Story) => {
      const storyHours = story.activities.reduce((activitySum: number, activity: Activity) => {
        const activityComplexity = activity.complexityFactor || 1;
        return activitySum + activity.hours * activityComplexity;
      }, 0);
      const storyComplexity = story.complexityFactor || 1;
      return sum + storyHours * storyComplexity;
    }, 0);

    const totalHoursWithProjectComplexity = totalHours * complexityFactor;
    const totalTestHours = (totalHoursWithProjectComplexity * testPercentage) / 100;
    const totalHoursWithTests = totalHoursWithProjectComplexity + totalTestHours;
    const totalValue = totalHoursWithTests * hourlyRate;
    const estimatedDays = Math.ceil(totalHoursWithTests / availableHours);

    // Executa a transação em duas etapas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Busca o orçamento atual com todas as stories e activities
      const currentBudget = await tx.budget.findUnique({
        where: { id },
        include: {
          stories: {
            include: {
              activities: true,
            },
          },
        },
      });

      if (!currentBudget) {
        throw new Error('Budget not found');
      }

      // 2. Atualiza o orçamento principal
      await tx.budget.update({
        where: { id },
        data: {
          client: {
            connect: { id: clientId },
          },
          title,
          hourlyRate,
          testPercentage,
          availableHours,
          complexityFactor,
          totalHours,
          totalTestHours,
          totalValue,
          estimatedDays,
        },
      });

      // 3. Processa as stories
      const currentStories = currentBudget.stories;
      const newStories = stories;

      // Identifica stories para manter, criar e remover
      const storiesToKeep = newStories.filter((newStory: Story) => {
        // Verifica se a story existe no banco
        const exists = currentStories.some(
          (currentStory: { id: string }) => currentStory.id === newStory.id
        );
        return exists;
      });

      const storiesToCreate = newStories.filter((newStory: Story) => {
        // Verifica se a story NÃO existe no banco
        const exists = currentStories.some(
          (currentStory: { id: string }) => currentStory.id === newStory.id
        );
        return !exists;
      });

      const storiesToRemove = currentStories.filter(
        (currentStory: { id: string }) =>
          !newStories.some((newStory: Story) => newStory.id === currentStory.id)
      );

      // Remove stories que não existem mais
      if (storiesToRemove.length > 0) {
        await tx.story.deleteMany({
          where: {
            id: {
              in: storiesToRemove.map((story: { id: any }) => story.id),
            },
          },
        });
      }

      // Atualiza stories existentes
      for (const story of storiesToKeep) {
        const currentStory = currentStories.find((s: { id: any }) => s.id === story.id);
        if (!currentStory) continue;

        // Atualiza a story
        await tx.story.update({
          where: { id: story.id },
          data: {
            title: story.title,
            complexityFactor: story.complexityFactor || 1,
          },
        });

        // Processa as activities da story
        const currentActivities = currentStory.activities;
        const newActivities = story.activities;

        // Identifica activities para manter, criar e remover
        const activitiesToKeep = newActivities.filter((newActivity: Activity) => {
          // Verifica se a activity existe no banco
          const exists = currentActivities.some(
            (currentActivity: { id: string }) => currentActivity.id === newActivity.id
          );
          return exists;
        });

        const activitiesToCreate = newActivities.filter((newActivity: Activity) => {
          // Verifica se a activity NÃO existe no banco
          const exists = currentActivities.some(
            (currentActivity: { id: string }) => currentActivity.id === newActivity.id
          );
          return !exists;
        });

        const activitiesToRemove = currentActivities.filter(
          (currentActivity: { id: string }) =>
            !newActivities.some((newActivity: Activity) => newActivity.id === currentActivity.id)
        );

        // Remove activities que não existem mais
        if (activitiesToRemove.length > 0) {
          await tx.activity.deleteMany({
            where: {
              id: {
                in: activitiesToRemove.map((activity: { id: any }) => activity.id),
              },
            },
          });
        }

        // Atualiza activities existentes
        for (const activity of activitiesToKeep) {
          await tx.activity.update({
            where: { id: activity.id },
            data: {
              title: activity.title,
              description: activity.description,
              hours: activity.hours,
              complexityFactor: activity.complexityFactor || 1,
            },
          });
        }

        // Cria novas activities
        if (activitiesToCreate.length > 0) {
          await tx.activity.createMany({
            data: activitiesToCreate.map((activity: Activity) => ({
              title: activity.title,
              description: activity.description,
              hours: activity.hours,
              complexityFactor: activity.complexityFactor || 1,
              storyId: story.id,
            })),
          });
        }
      }

      console.log('storiesToCreate', storiesToCreate);
      // Cria novas stories com suas activities
      for (const story of storiesToCreate) {
        await tx.story.create({
          data: {
            title: story.title,
            complexityFactor: story.complexityFactor || 1,
            budgetId: id,
            activities: {
              create: story.activities.map((activity: Activity) => ({
                title: activity.title,
                description: activity.description,
                hours: activity.hours,
                complexityFactor: activity.complexityFactor || 1,
              })),
            },
          },
        });
      }

      // 4. Retorna o orçamento atualizado com todas as relações
      return await tx.budget.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          stories: {
            include: {
              activities: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating budget:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
