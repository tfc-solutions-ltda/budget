export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  logo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  title: string;
  description: string | null;
  hours: number;
  storyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  title: string;
  budgetId: string;
  activities: Activity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  title: string;
  clientId: string;
  client: Client;
  userId: string;
  user: User;
  hourlyRate: number;
  testPercentage: number;
  availableHours: number;
  estimatedDays: number;
  totalHours: number;
  totalTestHours: number;
  totalValue: number;
  stories: Story[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetFormData {
  title: string;
  clientId: string;
  hourlyRate: number;
  testPercentage: number;
  availableHours: number;
  stories: {
    title: string;
    activities: {
      title: string;
      description?: string;
      hours: number;
    }[];
  }[];
} 