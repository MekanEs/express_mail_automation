import { Database } from './database.types';
type Tables = Database['public']['Tables'];
export type account = Tables['user_accounts']['Row'];

export type accounts = account[];
export type from_email = Tables['from_emails']['Row'];

export type report = Tables['reports']['Row'];
export type Provider = Database['public']['Enums']['Provider'];
export type ProviderConfig = {
    host: string;
    mailboxes: string[];
    spam: string[];
};

export type ProviderConfigsType = Record<Provider, ProviderConfig>;

// Тип для отчета, совпадающий с бэкендом
export type Report = Database['public']['Tables']['reports']["Row"]

// Добавляем универсальный тип для элементов с флагом выбора
export type Selectable<T> = T & { is_selected: boolean };

// Создаем конкретные типы на его основе
export type SelectableEmail = Selectable<from_email>;
export type SelectableAccount = Selectable<account>;

// Типы для API

// Параметры для запроса отчетов
export interface GetReportsParams {
    page?: number;
    limit?: number;
    sort_by?: string; // Поле для сортировки
    sort_order?: 'asc' | 'desc'; // Направление сортировки
    filter_status?: string;
    filter_account?: string;
    filter_process_id?: string;
}

// Группа отчетов (возвращается бэкендом)
export interface ReportGroup {
    processId: string;
    reports: Report[];
}

// Структура ответа для пагинированных отчетов
export interface PaginatedReportsResponse {
    data: ReportGroup[];
    pagination: Pagination;
}

// Тип для пагинации
export interface Pagination {
    page: number;
    limit: number;
    total: number; // Общее количество ГРУПП
    pages: number; // Общее количество страниц ГРУПП
}

// Тип для тела запроса на запуск процесса (совпадает с бэкендом)
export interface ProcessRequestBody {
    accounts: account[]; // Используем базовый тип account
    emails: string[]; // Backend likely only needs the email addresses
    limit?: number;
    openRate?: number;
    repliesCount?: number;
}

// Тип ответа при запуске процесса
export interface StartProcessResponse {
    process_id: string;
    message: string;
}

// Тип ответа для статуса процесса (совпадает с бэкендом)
export interface ProcessStatus {
    id: string;
    status: 'in_progress' | 'completed' | 'failed' | 'partial_success' | 'not_found'; // Добавил возможные статусы
    metrics: {
        total: number;
        emailsFound: number;
        emailsProcessed: number;
        success: number;
        failed: number;
        partialSuccess: number;
    };
    details: Report[];
}

// Тип для метрик дашборда (совпадает с бэкендом)
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
            partial: number; // Добавил поле partial из бэкенда
        }
    >;
}

// Параметры для запроса экспорта
export interface ExportReportsParams {
    format?: 'csv' | 'json';
    process_id?: string;
    filter_status?: string;
    filter_account?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}
