export interface ProcessReport {
    process_id: string;
    status: 'success' | 'partial_failure' | 'failure';
    account: string;
    sender: string;
    spam: {
        found: number;
        moved: number;
    }
    emails: {
        found: number;
        processed: number;
        errors: number;
        errorMessages: string[];
    };
    links: {
        found: number;
        targetOpen: number;
        attemptedOpen: number;
        errors: number;
        errorMessages: string[];
    };

}
