import { ProcessReport } from "../../../types/reports";

export const getBaseReport = ({
    process_id,
    user,
    from,
    found,
    moved
}: {
    from: string;
    found: number;
    user: string;
    process_id: string;
    moved: number;
}): ProcessReport => ({
    process_id: process_id,
    status: 'success',
    account: user,
    sender: from,
    spam: { found, moved },
    emails: { found: 0, processed: 0, errors: 0, errorMessages: [] },
    links: { found: 0, targetOpen: 0, attemptedOpen: 0, errors: 0, errorMessages: [] }
});
