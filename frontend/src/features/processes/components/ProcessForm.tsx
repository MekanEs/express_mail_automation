import { FC } from 'react';
import { SelectableAccount, SelectableEmail } from '../../../types/types';
import { useProcessForm } from '../hooks/useProcessForm';
import { ProcessFormInput } from './ui/ProcessFormInput';

interface ProcessFormProps {
  selectedAccounts: SelectableAccount[];
  selectedSenders: SelectableEmail[];
}

export const ProcessForm: FC<ProcessFormProps> = ({
  selectedAccounts,
  selectedSenders
}) => {
  // Используем хук для управления формой
  const {
    limit,
    setLimit,
    openRate,
    setOpenRate,
    repliesCount,
    setRepliesCount,
    handleSubmit,
    isPending,
    formErrors
  } = useProcessForm();

  return (
    <div className='w-full bg-gray-200 p-2 mt-4'>
      <form
        onSubmit={(e) => handleSubmit(e, selectedAccounts, selectedSenders)}
        className="rounded bg-gray-100 max-w-3xl mx-auto p-4"
      >
        <h3 className="space-y-6 rounded text-xl font-semibold mb-4 text-gray-800">
          Запустить новый процесс электронной почты
        </h3>

        {formErrors.selectedAccounts && <p className="text-red-500 text-sm mb-2">{formErrors.selectedAccounts}</p>}
        {formErrors.selectedSenders && <p className="text-red-500 text-sm mb-4">{formErrors.selectedSenders}</p>}

        <div className="flex flex-col gap-2 border p-2">
          <label className="text-sm text-gray-600">
            Лимит
            <p className="text-xs text-gray-400">
              количество писем которые будут обработаны
            </p>
          </label>
          <ProcessFormInput
            value={limit}
            setValue={setLimit}
            points={[1, 50, 100, 200, 500]}
            min={1}
            max={500}
            error={formErrors.limit}

          />
        </div>

        <div className="flex flex-col gap-2 border p-2">
          <label className="text-sm text-gray-600">
            Процент открытия ссылок
            <p className="text-xs text-gray-400">
              процент обработанных писем ссылки в которых будут открыты
            </p>
          </label>
          <ProcessFormInput
            value={openRate}
            setValue={setOpenRate}
            points={[0, 25, 50, 75, 100]}
            min={0}
            max={100}
            error={formErrors.openRate}

          />
        </div>

        <div className="flex flex-col gap-2 border p-2">
          <label className="text-sm text-gray-600">
            Количество ответов
            <p className="text-xs text-gray-400">
              кол-во ответов которые будут отправлены (не более кол-ва обработанных писем)
            </p>
          </label>
          <ProcessFormInput
            value={repliesCount}
            setValue={setRepliesCount}
            points={[0, 25, 50, 75, 100]}
            min={0}
            max={100}
            error={formErrors.repliesCount}
          />
        </div>

        <div className='flex justify-center'>
          <button
            type="submit"
            disabled={isPending}
            className="mt-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed w-[200px]"
          >
            {isPending ? 'Запуск процесса...' : 'Запустить процесс'}
          </button>
        </div>
      </form>
    </div>
  );
};
