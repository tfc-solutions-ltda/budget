import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';

interface Activity {
  title: string;
  description?: string;
  hours: number;
  complexityFactor?: number;
}

interface Story {
  title: string;
  activities: Activity[];
  complexityFactor?: number;
}

interface BudgetData {
  clientId: string;
  title: string;
  hourlyRate: number;
  testPercentage: number;
  availableHours: number;
  stories: Story[];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const budgets = await prisma.budget.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data: BudgetData = await request.json();

    if (!data.clientId || !data.title || !data.hourlyRate || !data.testPercentage || !data.availableHours) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Calculate total hours from stories and activities
    const totalHours = data.stories.reduce((storyTotal, story) => {
      const storyHours = story.activities.reduce((activityTotal, activity) => {
        const complexityFactor = activity.complexityFactor || 1;
        return activityTotal + (activity.hours * complexityFactor);
      }, 0);
      const storyComplexityFactor = story.complexityFactor || 1;
      return storyTotal + (storyHours * storyComplexityFactor);
    }, 0);

    const totalTestHours = (totalHours * data.testPercentage) / 100;
    const totalHoursWithTests = totalHours + totalTestHours;
    const estimatedDays = Math.ceil(totalHoursWithTests / data.availableHours);
    const totalValue = totalHoursWithTests * data.hourlyRate;

    // Create the budget with all required fields
    const budget = await prisma.budget.create({
      data: {
        title: data.title,
        clientId: data.clientId,
        userId: session.user.id,
        hourlyRate: data.hourlyRate,
        testPercentage: data.testPercentage,
        availableHours: data.availableHours,
        estimatedDays: estimatedDays,
        totalHours: totalHours,
        totalTestHours: totalTestHours,
        totalValue: totalValue,
        stories: {
          create: data.stories.map(story => ({
            title: story.title,
            complexityFactor: story.complexityFactor || 1,
            activities: {
              create: story.activities.map(activity => ({
                title: activity.title,
                description: activity.description,
                hours: activity.hours,
                complexityFactor: activity.complexityFactor || 1
              }))
            }
          }))
        }
      },
      include: {
        stories: {
          include: {
            activities: true
          }
        }
      }
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Error creating budget:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 