import { Database } from '../clients/database.types';
type Tables = Database['public']['Tables'];
export type account = Tables['user_accounts']['Row'];

export type accounts = account[];
export type from_email = Tables['from_emails']['Row'];

export type ReportType = Tables['reports']['Row'];
export type InsertReportType = Tables['reports']['Insert'];
export type Provider = Database['public']['Enums']['Provider'];
export type ProviderConfig = {
  host: string;
  mailboxes: string[];
  spam: string[];
  smtpHost: string;
};

export type ProviderConfigsType = Record<Provider, ProviderConfig>;

// Тип для запроса процесса с дополнительными фильтрами
export interface ProcessRequestBody {
  accounts: accounts;
  emails: string[];
  limit?: number;
  openRate?: number;
  repliesCount?: number;
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
