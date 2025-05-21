import { Database } from '../clients/database.types';
import { ProcessReport } from './reports';
type Tables = Database['public']['Tables'];

export type Account = Tables['user_accounts']['Row'];
export type Accounts = Account[];
export type FromEmail = Tables['from_emails']['Row'];
export type ReportType = Tables['reports']['Row'];
export type InsertReportType = Tables['reports']['Insert'];
export type Provider = Database['public']['Enums']['Provider'];
export interface StartProcessResponse {
  process_id: string;
  message: string;
}
export interface ProviderConfig {
  host: string;
  // mailboxes: string[]; // Удалено
  // spam: string[]; // Удалено
  smtpHost: string;
}

export type ProviderConfigsType = Record<Provider, ProviderConfig>;

// Тип для запроса процесса с дополнительными фильтрами
export interface ProcessRequestBody {
  accounts: Omit<Account, 'is_selected'>[];
  emails: string[];
  limit?: number;
  openRate?: number;
  repliesCount?: number;
  headlessMode?: boolean;
}

export interface ProcessConfig {
  limit: number;
  openRate: number; // от 0 до 100
  repliesCount: number;
  minDelayBetweenEmailsMs?: number;
  maxDelayBetweenEmailsMs?: number;
  // ... другие будущие параметры конфигурации процесса
  // например, delayBetweenEmailsMs?: number;
}

// Обновить StartProcessingParams
export interface StartProcessingParams {
  accounts: Account[];
  emails: string[];
  process_id: string;
  baseOutputPath: string;
  config: ProcessConfig; // Вместо отдельных полей
  headlessMode?: boolean;
}

// Обновить AccountProcessingParams
export interface AccountProcessingParams {
  account: Account;
  fromEmail: string;
  providerConfig: ProviderConfig;
  process_id: string;
  config: ProcessConfig;
  report: ProcessReport;
  tempDirPath: string;
}

// Тип для метрик дашборда
export interface DashboardMetrics {
  summary: {
    totalReports: number;
    totalEmailsFound: number;
    totalEmailsProcessed: number;
    successRate: number;
  };
  recentProcesses: {
    process_id: string;
    created_at: string;
  }[];
  accountsStats: Record<
    string,
    {
      total: number;
      success: number;
      failure: number;
    }
  >;
}
