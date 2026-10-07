import React from 'react';
import EmptyState from './EmptyState';
import { Loader2 } from 'lucide-react';

export const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No records found',
  keyField = 'id',
  className = '',
}) => {
  return (
    <div className={`w-full overflow-hidden border border-slate-200/80 rounded-xl bg-white shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  scope="col"
                  className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-600 ${
                    col.className || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    <span className="text-xs text-slate-500">Loading table data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-4">
                  <EmptyState title={emptyMessage} className="border-0 shadow-none my-2" />
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row[keyField] || rowIdx}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-slate-700 ${
                        col.className || ''
                      }`}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
