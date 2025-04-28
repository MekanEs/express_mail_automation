import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SelectableEmail } from "../../types/types";
import { addEmail, deleteEmail, getEmails } from "../../api/emailsApi";
import toast from 'react-hot-toast';
import { getFromEmails } from "../../api/sendersApi";

interface EmailListProps {
    emails: SelectableEmail[];
    toggleSelection: (selected: SelectableEmail[]) => void;
    selected: SelectableEmail[]
}

export const EmailList = ({ emails, toggleSelection, selected }: EmailListProps) => {
    const [curEmail, setCurEmail] = useState<string>('');
    const queryClient = useQueryClient();
    const { isLoading } = useQuery({
        queryKey: ['emails'],
        queryFn: getEmails,
    });

    const addEmailMutation = useMutation({
        mutationFn: addEmail,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['senders'] });
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            setCurEmail('');
            toast.success(`Email ${curEmail} added successfully!`);
            getFromEmails()
        },
        onError: (error: Error, variables) => {
            toast.error(`Failed to add email ${variables}: ${error.message}`);
        }
    });

    const deleteEmailMutation = useMutation<void, Error, number>({
        mutationFn: deleteEmail,
        onSuccess: (_data, deletedEmailId) => {
            queryClient.invalidateQueries({ queryKey: ['senders'] });
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            const deletedEmail = emails.find(e => e.id === deletedEmailId)?.email;
            toast.success(`Email ${deletedEmail || deletedEmailId} deleted.`);
        },
        onError: (error: Error, variables) => {
            const deletedEmail = emails.find(e => e.id === variables)?.email;
            toast.error(`Failed to delete email ${deletedEmail || variables}: ${error.message}`);
        }
    });

    const handleAddEmail = () => {
        if (curEmail.trim()) {
            addEmailMutation.mutate(curEmail);
        }
    };

    const handleDeleteEmail = (id: number) => {
        deleteEmailMutation.mutate(id);
    };
    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = event.target; // value будет email
        const senderEmail = value;

        let updatedSelection: SelectableEmail[];

        if (checked) {
            // Добавляем отправителя в выбранные
            const senderToAdd = emails.find(sender => sender.email === senderEmail);
            if (senderToAdd) {
                updatedSelection = [...selected, { ...senderToAdd, is_selected: true }];
            } else {
                updatedSelection = [...selected]; // На всякий случай, если не нашли
            }
        } else {
            // Удаляем отправителя из выбранных
            updatedSelection = selected.filter(sender => sender.email !== senderEmail);
        }
        toggleSelection(updatedSelection);
    }; const selectedEmailsSet = new Set(selected.map(s => s.email));
    return (
        <div className="card-content mt-4">
            <div className="card-header mb-4">
                <h2 className="text-xl font-semibold text-text-primary">Email Addresses</h2>
            </div>

            <div className="flex space-x-2 mb-4">
                <input
                    value={curEmail}
                    onChange={(e) => setCurEmail(e.target.value)}
                    type="email"
                    placeholder="Enter email address"
                    className="input flex-grow"
                />
                <button
                    onClick={handleAddEmail}
                    className="btn"
                    disabled={!curEmail.trim() || addEmailMutation.isPending}
                >
                    {addEmailMutation.isPending ? 'Adding...' : 'Add Email'}
                </button>
            </div>

            {isLoading ? (
                <div className="loading">Loading emails...</div>
            ) : emails.length === 0 ? (
                <div className="empty-state">
                    <p>No emails found</p>
                    <p className="text-sm">Add an email to get started</p>
                </div>
            ) : (
                <ul className="flex flex-wrap gap-2 *:bg-gray-100">
                    {emails.map((email) => (
                        <li key={email.id} className="email-list-item flex justify-between items-center mt-2 mb-2 grow-1 w-100 rounded p-2">
                            <span className="text-text-primary">{email.email}</span>
                            <div className="item-actions flex gap-2 items-center">
                                <input
                                    id={`sender-${email.id || email.email}`}
                                    name="sender"
                                    type="checkbox"
                                    value={email.email}
                                    checked={selectedEmailsSet.has(email.email)}
                                    onChange={handleCheckboxChange}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <button
                                    onClick={() => handleDeleteEmail(email.id)}
                                    className="text-red-500 hover:text-red-700 btn"
                                    disabled={deleteEmailMutation.isPending}
                                >
                                    <img style={{ width: '20px', height: '20px' }} src="/delete.svg" alt="Delete" className="h-5 w-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
