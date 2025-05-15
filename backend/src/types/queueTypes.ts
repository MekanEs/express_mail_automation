import { Account } from './types';

export interface ProcessJobData {
  process_id: string;
  accounts: Account[]; // Используйте базовый тип Account
  emails: string[];
  limit?: number;
  openRate?: number;
  repliesCount?: number;
  baseOutputPath: string;
  // Добавьте любые другие параметры, необходимые для обработки
}
