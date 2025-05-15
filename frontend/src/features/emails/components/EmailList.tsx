import { SelectableEmail } from "../../../types/types";
import { from_email } from "../../../types/types";
import { EmailList as FeatureEmailList } from "./EmailList";

interface EmailListProps {
    emails: SelectableEmail[];
    toggleSelection: (selected: SelectableEmail[]) => void;
    selected: SelectableEmail[]
}

export const EmailList = ({ emails, toggleSelection, selected }: EmailListProps) => {

    // Convert SelectableEmail[] to from_email[]
    const emailsConverted: from_email[] = emails.map(email => ({
        id: email.id,
        email: email.email,
        created_at: email.created_at
    }));

    // Convert selected SelectableEmail[] to just IDs array
    const selectedIds = selected.map(email => email.id).filter(Boolean) as number[];

    // Handle selection changes and convert back to the expected format
    const handleSelectionChange = (id: number, isSelected: boolean) => {
        let updatedSelection: SelectableEmail[];

        if (isSelected) {
            // Add to selection if not already selected
            if (!selected.some(email => email.id === id)) {
                const emailToAdd = emails.find(email => email.id === id);
                if (emailToAdd) {
                    updatedSelection = [...selected, { ...emailToAdd, is_selected: true }];
                } else {
                    updatedSelection = [...selected];
                }
            } else {
                updatedSelection = [...selected];
            }
        } else {
            // Remove from selection
            updatedSelection = selected.filter(email => email.id !== id);
        }

        toggleSelection(updatedSelection);
    };

    return (
        <FeatureEmailList
            emails={emailsConverted}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
        />
    );
};
