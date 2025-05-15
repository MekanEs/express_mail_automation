import { from_email } from "../../../types/types"; // This will need to be refactored later
import { useEmailsManager } from "../hooks/useEmailsManager";

interface EmailListProps {
  // emails prop can be used to pass externally managed emails
  emails?: from_email[];
  // selectedIds and onSelectionChange for externally managed selection state
  selectedIds?: number[];
  onSelectionChange?: (id: number, isSelected: boolean) => void;
}

export const EmailList = ({
  emails: propsEmails,
  selectedIds: propsSelectedIds,
  onSelectionChange: propsOnSelectionChange
}: EmailListProps) => {
  const {
    emails: hookEmails, // These are from_email[]
    isLoading,
    curEmail,
    setCurEmail,
    selectedIds: hookSelectedIds, // These are number[]
    handleAddEmail,
    handleDeleteEmail,
    toggleSelectionById: hookToggleSelectionById, // This is (id: number, isSelected: boolean) => void
    isPendingAdd,
    isPendingDelete
  } = useEmailsManager();

  const emailsToRender: from_email[] = propsEmails || hookEmails || [];
  const currentSelectedIds: number[] = propsSelectedIds || hookSelectedIds || [];
  const handleSelectionChange = propsOnSelectionChange || hookToggleSelectionById;

  // Create a Set for quick lookup of selected IDs
  const selectedIdsSet = new Set(currentSelectedIds);

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
          disabled={!curEmail.trim() || isPendingAdd}
        >
          {isPendingAdd ? 'Adding...' : 'Add Email'}
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading emails...</div>
      ) : emailsToRender.length === 0 ? (
        <div className="empty-state">
          <p>No emails found</p>
          <p className="text-sm">Add an email to get started</p>
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2 *:bg-gray-100">
          {emailsToRender.map((email: from_email) => (
            <li onClick={() => {
              if (email.id) handleSelectionChange(email.id, !selectedIdsSet.has(email.id));
            }} key={email.id} className="email-list-item flex justify-between items-center mt-2 mb-2 grow-1 w-100 rounded p-2 cursor-pointer">
              <span className="text-text-primary">{email.email}</span>
              <div className="item-actions flex gap-2 items-center">
                <input
                  id={`sender-${email.id}`}
                  name="sender"
                  type="checkbox"
                  value={email.email || ''} // Value is not strictly needed if using ID for selection
                  checked={email.id ? selectedIdsSet.has(email.id) : false}
                  onChange={(e) => {
                    if (email.id) handleSelectionChange(email.id, e.target.checked);
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent li onClick from firing
                    if (email.id) handleDeleteEmail(email.id);
                  }}
                  className="text-red-500 hover:text-red-700 btn"
                  disabled={isPendingDelete}
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
