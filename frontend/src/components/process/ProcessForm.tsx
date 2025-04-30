import { FC, useState } from 'react';
import { ProcessRequestBody, SelectableAccount, SelectableEmail } from '../../types/types';
import { useStartProcess } from '../../hooks/useProcessMutations';
import toast from 'react-hot-toast';
import Accounts from '../accounts/Accounts';
import { EmailList } from '../emails/EmailList';
import { ProcessFormInput } from './processFormInput';
// import { useSendMessage } from '../../api/senMessage';

interface ProcessFormProps {
    availableSenders: SelectableEmail[];
    selectedAccounts: SelectableAccount[];
    selectedSenders: SelectableEmail[];
    onAccountSelectionChange: (selected: SelectableAccount[]) => void;
    onSenderSelectionChange: (selected: SelectableEmail[]) => void;
}

export const ProcessForm: FC<ProcessFormProps> = ({
    availableSenders,
    selectedAccounts,
    selectedSenders,
    onAccountSelectionChange,
    onSenderSelectionChange
}) => {
    const [limit, setLimit] = useState(10);
    const [openRate, setOpenRate] = useState(70);
    const [repliesCount, setRepliesCount] = useState(0);
    const startProcessMutation = useStartProcess();
    // const sendMessage = useSendMessage();
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // --- Валидация ---
        if (selectedAccounts.length === 0) {
            toast.error('Please select at least one account.');
            return;
        }
        // TODO: Добавить другую необходимую валидацию (например, для фильтров)

        // --- Сборка данных ---
        const processData: ProcessRequestBody = {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            accounts: selectedAccounts.map(({ is_selected, ...rest }) => rest),
            emails: selectedSenders.length > 0 ? selectedSenders.map((s) => s.email).filter((email): email is string => email !== null) : [],
            limit: limit,
            openRate: openRate,
            repliesCount
        };

        console.log('Submitting process data:', processData);
        startProcessMutation.mutate(processData);
    };
    // const handleSendMessage = () => {
    //     sendMessage.mutate();
    // };
    return (
        <div className=' p-4 bg-white rounded  shadow-md'>
            <Accounts selected={selectedAccounts} setSelected={onAccountSelectionChange} />
            <EmailList
                emails={availableSenders}
                selected={selectedSenders}
                toggleSelection={onSenderSelectionChange}
            />
            {/* <button className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm
             font-medium text-white bg-indigo-600 hover:bg-indigo-700" onClick={handleSendMessage}>Send Message</button> */}
            <div className='w-full bg-gray-200 p-2 mt-4'>
                <form
                    onSubmit={handleSubmit}
                    className=" rounded bg-gray-100 max-w-3xl mx-auto  p-4"
                >
                    <h3 className=" space-y-6 rounded text-xl font-semibold mb-4 text-gray-800">
                        Start New Email Process
                    </h3>

                    <div className="flex flex-col gap-2 border p-2">
                        <label className="text-sm text-gray-600">
                            Limit
                            <p className="text-xs text-gray-400">
                                количество писем которые будут обработаны
                            </p>
                        </label>
                        <ProcessFormInput value={limit} setValue={setLimit} points={[1, 50, 100, 200]} min={1} />

                    </div>
                    <div className="flex flex-col gap-2  border p-2">
                        <label className="text-sm text-gray-600">
                            Open Rate
                            <p className="text-xs text-gray-400">
                                процент обработанных писем которые будут открыты
                            </p>
                        </label>
                        <ProcessFormInput value={openRate} setValue={setOpenRate} points={[0, 50, 100]} />


                    </div>
                    <div className="flex flex-col gap-2 border p-2">
                        <label className="text-sm text-gray-600">
                            Replies Count
                            <p className="text-xs text-gray-400" >
                                кол-во ответов которые будут отправлены (не более кол-ва обработанных писем)
                            </p>
                        </label>
                        <ProcessFormInput value={repliesCount} setValue={setRepliesCount} points={[0, 50, 100]} />

                    </div>
                    <div className='flex justify-center'>
                        <button
                            type="submit"
                            disabled={startProcessMutation.isPending || selectedAccounts.length === 0 || selectedSenders.length === 0}
                            className="mt-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed w-[200px]"
                        >
                            {startProcessMutation.isPending ? 'Starting Process...' : 'Start Process'}
                        </button>
                    </div>
                </form></div>
        </div>
    );
};
