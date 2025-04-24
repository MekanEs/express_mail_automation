# Анализ API эндпоинтов backend

## 1. `/api/accounts`

### GET `/api/accounts`
- **Входные данные**: Не требуется
- **Выходные данные**: Массив объектов типа `account[]`, где каждый объект имеет структуру:
  ```typescript
  {
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
  }
  ```

## 2. `/api/fromEmails`

### GET `/api/fromEmails`
- **Входные данные**: Не требуется
- **Выходные данные**: Массив объектов типа:
  ```typescript
  {
    created_at: string;
    email: string;
    id: number;
  }
  ```

### POST `/api/fromEmails`
- **Входные данные**:
  ```typescript
  {
    email: string;
  }
  ```
- **Выходные данные**: Статус код 200, без тела ответа

### DELETE `/api/fromEmails`
- **Входные данные**:
  ```typescript
  {
    id: number;
  }
  ```
- **Выходные данные**: Статус код 200, без тела ответа

## 3. `/api/process`

### POST `/api/process`
- **Входные данные**: Объект типа `ProcessRequestBody`:
  ```typescript
  {
    accounts: {
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
    }[];
    emails: {
      created_at: string;
      email: string;
      id: number;
    }[];
    limit?: number;

  }
  ```
- **Выходные данные**: Статус код 200, возвращает объект с `process_id`

## 4. `/api/checkAccounts`

### GET `/api/checkAccounts`
- **Входные данные**: Не требуется
- **Выходные данные**: Массив email-адресов аккаунтов, которые успешно подключились:
  ```typescript
  string[]
  ```

## 5. `/api/reports`

### GET `/api/reports`
- **Входные данные**: Query параметры:
  ```typescript
  {
    page?: string; // по умолчанию '1'
    limit?: string; // по умолчанию '10'
    sort_by?: string; // по умолчанию 'created_at'
    sort_order?: string; // по умолчанию 'desc'
    filter_status?: string;
    filter_account?: string;
    filter_process_id?: string;
  }
  ```
- **Выходные данные**: Объект с пагинированными группами отчетов и метаданными:
  ```typescript
  {
    data: {
      processId: string;
      reports: {
        id: string;
        created_at: string | null;
        process_id: string | null;
        account: string | null;
        sender: string | null;
        inbox: string | null;
        status: string | null;
        emails_found: number | null;
        emails_processed: number | null;
        links_found: number | null;
        links_attemptedOpen: number | null;
        links_errors: number | null;
        emails_errorMessages?: any;
      }[];
    }[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }
  ```

### GET `/api/reports/export`
- **Входные данные**: Query параметры:
  ```typescript
  {
    format?: string; // 'csv' или 'json', по умолчанию 'csv'
    sort_by?: string; // по умолчанию 'created_at'
    sort_order?: string; // по умолчанию 'desc'
    filter_status?: string;
    filter_account?: string;
    filter_process_id?: string;
  }
  ```
- **Выходные данные**: Файл в формате CSV или JSON с отчетами

## 6. `/api/dashboard`

### GET `/api/dashboard/metrics`
- **Входные данные**: Не требуется
- **Выходные данные**: Объект типа `DashboardMetrics`:
  ```typescript
  {
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
      partial: number;
    }>;
  }
  ```

## 7. `/api`

### GET `/api`
- **Входные данные**: Не требуется
- **Выходные данные**:
  ```typescript
  {
    message: string;
  }
  ```
