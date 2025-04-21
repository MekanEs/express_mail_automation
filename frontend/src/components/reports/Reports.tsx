import { useEffect, useState } from "react";
import { report } from "../../types/types";

export const Reports = () => {
  const [reports, setReports] = useState<Record<string, report[]>>({})
  const fetchReports = async () => {
    const res = await fetch('http://localhost:3002/api/reports')
    const data: Record<string, report[]> = await res.json()
    setReports(data)
  }
  useEffect(() => {
    fetchReports()
  }, [])
  return (
    <div className="space-y-6">
      <button onClick={fetchReports}>Fetch Reports</button>
      {Object.entries(reports).map(([processId, items]) => (
        <div key={processId} className="bordered rounded-xl p-4 shadow-sm bg-white">
          <p className="text-lg font-semibold mb-2">Process ID: {processId}</p>
          <h5 className="text-lg font-semibold mb-2">{items[0].created_at?.slice(0, 10)}</h5>

          <table className="w-full w-100 text-sm bordered-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 bordered">Account</th>
                <th className="p-2 bordered">Sender</th>
                <th className="p-2 bordered">Status</th>
                <th className="p-2 bordered">Подходящих под условия</th>
                <th className="p-2 bordered">Открыто</th>
                <th className="p-2 bordered">Ссылки</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="p-2 bordered">{item.account}</td>
                  <td className="p-2 bordered">{item.sender}</td>
                  <td className="p-2 bordered">{item.status}</td>
                  <td className="p-2 bordered">
                    {item.emails_found}
                  </td>
                  <td className="p-2 bordered">
                    {item.emails_processed}

                  </td>
                  <td className="p-2 bordered">
                    {item.links_attemptedOpen}/{item.links_found} (
                    {item.links_errors} ошибок)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};
