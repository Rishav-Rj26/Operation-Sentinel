import React from 'react';

const DataTable = ({ columns, data, onRowClick }) => {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-outline-variant/30 bg-surface/40 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.2)]">
      <table className="sentinel-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index} className={col.align === 'right' ? 'text-right' : 'text-left'}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-on-surface-variant/50 py-8">
                NO DATA AVAILABLE
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className={col.align === 'right' ? 'text-right' : 'text-left'}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
