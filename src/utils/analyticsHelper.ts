/**
 * Calculate percentage with 2 decimal places
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100;
}

/**
 * Get date range based on period
 */
export function getDateRange(period: 'daily' | 'weekly' | 'monthly', range: number) {
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'daily':
      startDate = new Date(now.getTime() - range * 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - range * 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth() - range, now.getDate());
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  return { startDate, endDate: now };
}

/**
 * Format duration from milliseconds to readable format
 */
export function formatDuration(milliseconds: number): { hours: number; days: number } {
  const hours = Math.round(milliseconds / (1000 * 60 * 60) * 100) / 100;
  const days = Math.round(milliseconds / (1000 * 60 * 60 * 24) * 100) / 100;
  return { hours, days };
}

/**
 * Generate CSV fields configuration based on data type
 */
export function getCSVFields(type: string): string[] {
  switch (type) {
    case 'requests':
      return ['id', 'title', 'userId', 'categoryId', 'status', 'type', 'location', 'createdAt'];
    case 'users':
      return ['id', 'name', 'email', 'role', 'createdAt'];
    case 'responses':
      return ['id', 'requestId', 'userId', 'content', 'status', 'createdAt'];
    case 'reports':
      return ['id', 'reporterId', 'targetType', 'targetId', 'reason', 'status', 'createdAt'];
    default:
      return ['id', 'createdAt'];
  }
}
