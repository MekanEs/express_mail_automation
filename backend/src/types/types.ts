export type account = {
  access_token: string | null;
  app_password: string | null;
  email: string | null;
  expires_at: number | null;
  id: string;
  is_token: boolean;
  provider: string | null;
  refresh_token: string | null;
  updated_at: string | null;
  user_id: string;
  isSelected?: boolean;
};
export type accounts = account[];
export type from_email = { created_at: string; email: string; id: number };

// Определение и экспорт типа report
export type report = {
    id: string; // или number, в зависимости от схемы БД
    created_at: string | null;
    process_id: string | null;
    account: string | null;
    sender: string | null;
    inbox: string | null;
    status: string | null; // 'success', 'failure', 'partial_failure', etc.
    emails_found: number | null;
    emails_processed: number | null;
    links_found: number | null;
    links_attemptedOpen: number | null;
    links_errors: number | null;
    emails_errorMessages?: any; // Или более конкретный тип, если известен
    // Добавьте другие поля, если они есть в таблице 'reports'
};

// Добавление новых типов

// Тип для запроса процесса с дополнительными фильтрами
export interface ProcessRequestBody {
    accounts: accounts;
    emails: string[];
    limit?: number;
    openRate?: number;
    mailboxFilters?: {
        startDate?: string;
        endDate?: string;
        subject?: string;
        custom?: Record<string, any>; // Для любых дополнительных кастомных фильтров
    };
    processingOptions?: {
        skipAttachments?: boolean;
        processingMode?: 'quick' | 'thorough'; // Пример опций
        customOptions?: Record<string, any>; // Для любых дополнительных кастомных опций
    };
}

// Тип для ответа со статусом процесса
export interface ProcessStatus {
    id: string;
    status: 'in_progress' | 'completed' | 'failed' | 'partial_success';
    metrics: {
        total: number;
        emailsFound: number;
        emailsProcessed: number;
        success: number;
        failed: number;
        partialSuccess: number;
    };
    details: report[]; // Используем созданный тип report
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
    accountsStats: Record<string, {
        total: number;
        success: number;
        failure: number;
    }>;
}
