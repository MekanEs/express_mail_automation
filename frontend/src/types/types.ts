import { Database } from './database.types';
type Tables = Database['public']['Tables'];

/** @description Represents a user account entity from the database. */
export type Account = Tables['user_accounts']['Row'];
/** @description Array of Account objects. */
export type Accounts = Account[];
/** @description Represents a sender email entity from the database. */
export type FromEmail = Tables['from_emails']['Row'];

/** @description Represents a report entity from the database. */
export type Report = Tables['reports']['Row'];
/** @description Defines the email provider type (e.g., 'google', 'outlook'). */
export type Provider = Database["public"]["Enums"]["Provider"]

/**
 * @description Configuration for a specific email provider.
 * @property host - The IMAP host address for the provider.
 * @property mailboxes - An array of mailbox names (folders) to be processed.
 * @property spam - An array of mailbox names (folders) considered as spam.
 */
export type ProviderConfig = {
    host: string;
    mailboxes: string[];
    spam: string[];
};

/** @description A record mapping each Provider to its ProviderConfig. */
export type ProviderConfigsType = Record<Provider, ProviderConfig>;

/**
 * @description A generic type that adds an 'is_selected' boolean flag to an existing type T.
 * @template T - The base type to which the selection flag is added.
 */
export type Selectable<T> = T & { is_selected: boolean };

/** @description Represents a FromEmail object that can be selected. */
export type SelectableEmail = Selectable<FromEmail>;
/** @description Represents an Account object that can be selected. */
export type SelectableAccount = Selectable<Account>;

// Типы для API

/**
 * @description Parameters for requesting a list of reports.
 * @property page - The page number for pagination (optional).
 * @property limit - The number of items per page (optional).
 * @property sort_by - The field name to sort by (optional).
 * @property sort_order - The sort order: 'asc' or 'desc' (optional).
 * @property filter_status - Filter reports by status (optional).
 * @property filter_account - Filter reports by account identifier (e.g., email) (optional).
 * @property filter_process_id - Filter reports by process ID (optional).
 */
export interface GetReportsParams {
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    filter_status?: string;
    filter_account?: string;
    filter_process_id?: string;
}

/** @description Filters for the Reports page, excluding pagination and sorting parameters. */
export type ReportPageFilters = Omit<GetReportsParams, 'page' | 'limit' | 'sort_by' | 'sort_order'>;

/**
 * @description Represents a group of reports, usually associated with a single process ID.
 * @property processId - The unique identifier of the process.
 * @property reports - An array of Report objects belonging to this process.
 */
export interface ReportGroup {
    processId: string;
    reports: Report[];
}

/**
 * @description Structure of the response for paginated reports.
 * @property data - An array of ReportGroup objects.
 * @property pagination - Pagination details.
 */
export interface PaginatedReportsResponse {
    data: ReportGroup[];
    pagination: Pagination;
}

/**
 * @description Details for pagination.
 * @property page - The current page number.
 * @property limit - The number of items per page.
 * @property total - The total number of groups or items (context-dependent, here groups).
 * @property pages - The total number of pages.
 */
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

/**
 * @description Request body for starting a new email processing task.
 * @property accounts - An array of Account objects to be processed.
 * @property emails - An array of sender email addresses (strings) to filter by.
 * @property limit - The maximum number of emails to process per account (optional).
 * @property openRate - The percentage of processed emails for which links should be opened (optional).
 * @property repliesCount - The number of replies to send per account (optional).
 * @property headlessMode - The mode of headless processing (optional).
 */
export interface ProcessRequestBody {
    accounts: Account[];
    emails: string[];
    limit?: number;
    openRate?: number;
    repliesCount?: number;
    headlessMode?: boolean;
}

/**
 * @description Response received after successfully starting an email processing task.
 * @property process_id - The unique identifier for the started process.
 * @property message - A confirmation message.
 */
export interface StartProcessResponse {
    process_id: string;
    message: string;
}

/**
 * @description Type for the process status.
 * @property id - The unique identifier for the process.
 * @property status - The current status of the process.
 * @property metrics - Metrics related to the process.
 * @property metrics.total - Total number of emails processed.
 * @property metrics.emailsFound - Number of emails found.
 * @property metrics.emailsProcessed - Number of emails processed.
 * @property metrics.success - Number of successful emails processed.
 * @property metrics.failed - Number of failed emails processed.
 * @property metrics.partialSuccess - Number of partially successful emails processed.
 * @property details - List of reports related to the process.
 */
export interface ProcessStatus {
    id: string;
    status: 'in_progress' | 'completed' | 'failed' | 'partial_success' | 'not_found';
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

/**
 * @description Metrics for the dashboard.
 * @property summary - Overall summary statistics.
 * @property summary.totalReports - Total number of reports generated.
 * @property summary.totalEmailsFound - Total number of emails found across all processes.
 * @property summary.totalEmailsProcessed - Total number of emails processed across all processes.
 * @property summary.successRate - Overall success rate of email processing.
 * @property recentProcesses - A list of recently executed processes.
 * @property recentProcesses.process_id - The ID of the recent process.
 * @property recentProcesses.created_at - Timestamp of when the process was created.
 * @property accountsStats - Statistics for each account, keyed by account identifier (e.g., email).
 * @property accountsStats.ACCOUNT_KEY.total - Total emails related to this account.
 * @property accountsStats.ACCOUNT_KEY.success - Successfully processed emails for this account.
 * @property accountsStats.ACCOUNT_KEY.failure - Failed email processing attempts for this account.
 * @property accountsStats.ACCOUNT_KEY.partial - Partially successful email processing for this account.
 */
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
            partial: number;
        }
    >;
}

/**
 * @description Parameters for exporting reports.
 * @property format - The format of the exported reports (optional, default 'csv').
 * @property process_id - The ID of the process to filter reports by (optional).
 * @property filter_status - Filter reports by status (optional).
 * @property filter_account - Filter reports by account identifier (e.g., email) (optional).
 * @property sort_by - The field name to sort by (optional).
 * @property sort_order - The sort order: 'asc' or 'desc' (optional).
 */
export interface ExportReportsParams {
    format?: 'csv' | 'json';
    process_id?: string;
    filter_status?: string;
    filter_account?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}
