export interface Notification {
  id: number;
  familyId: number;
  userId?: number;
  categoryId?: number;
  budgetId?: number;
  notificationType: string;
  title: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, any>;
  userName?: string;
  categoryName?: string;
}

