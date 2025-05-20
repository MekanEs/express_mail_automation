import React from 'react';
import { StatusBadge } from '../../../shared/utils/uiHelpers';
import { ProcessReport } from '../../../types/reports';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ProcessReport | null;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-gray-900/50">
      <div className="relative w-full max-w-4xl p-4 mx-auto my-6">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-200 rounded-t">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                Детали отчета
                <span className="ml-2">
                  <StatusBadge status={report.status} />
                </span>
              </h3>
              <p className="text-sm text-gray-500">ID Процесса: <span className="font-mono">{report.process_id}</span></p>
            </div>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-gray-400 hover:text-gray-900 float-right text-2xl leading-none outline-none focus:outline-none"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="relative p-6 flex-auto overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-lg mb-3">Основная информация</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Аккаунт:</span>
                    <span className="font-medium">{report.account}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Отправитель:</span>
                    <span className="font-medium">{report.sender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Статус:</span>
                    <span className="font-medium">{report.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Отправлено ответов:</span>
                    <span className="font-medium">{report.replies_sent}</span>
                  </div>
                </div>
              </div>

              {/* Email Statistics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-lg mb-3">Статистика по Email</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Найдено Email:</span>
                    <span className="font-medium">{report.emails.found}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Обработано Email:</span>
                    <span className="font-medium">{report.emails.processed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ошибки Email:</span>
                    <span className={`font-medium ${report.emails.errors > 0 ? 'text-red-600' : ''}`}>
                      {report.emails.errors}
                    </span>
                  </div>
                </div>
              </div>

              {/* Spam Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-lg mb-3">Управление спамом</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Найдено спама:</span>
                    <span className="font-medium">{report.spam.found}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Перемещено спама:</span>
                    <span className="font-medium">{report.spam.moved}</span>
                  </div>
                </div>
              </div>

              {/* Links Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-lg mb-3">Информация о ссылках</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Найдено ссылок:</span>
                    <span className="font-medium">{report.links.found}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Целевых открытий ссылок:</span>
                    <span className="font-medium">{report.links.targetOpen}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Попыток открытия ссылок:</span>
                    <span className="font-medium">{report.links.attemptedOpen}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ошибки ссылок:</span>
                    <span className={`font-medium ${report.links.errors > 0 ? 'text-red-600' : ''}`}>
                      {report.links.errors}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {(report.emails.errorMessages?.length > 0 || report.links.errorMessages?.length > 0) && (
              <div className="mt-6 bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-lg mb-3 text-red-700">Сообщения об ошибках</h4>

                {report.emails.errorMessages?.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-red-600 mb-2">Ошибки Email:</h5>
                    <ul className="list-disc pl-5 space-y-1">
                      {report.emails.errorMessages.map((errorMsg: string, idx: number) => (
                        <li key={`email-error-${idx}`} className="text-sm text-red-700">{errorMsg}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.links.errorMessages?.length > 0 && (
                  <div>
                    <h5 className="font-medium text-red-600 mb-2">Ошибки ссылок:</h5>
                    <ul className="list-disc pl-5 space-y-1">
                      {report.links.errorMessages.map((errorMsg: string, idx: number) => (
                        <li key={`link-error-${idx}`} className="text-sm text-red-700">{errorMsg}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              type="button"
              onClick={onClose}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
