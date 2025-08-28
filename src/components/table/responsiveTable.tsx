import { Table } from 'antd';
import { TableProps } from 'antd/es/table';
import React, { useMemo } from 'react';

export function ResponsiveTable<RecordType extends object = Record<string, unknown>>(
  props: TableProps<RecordType>
) {
  // Process columns to ensure proper responsive behavior
  const columns = useMemo(() => {
    if (!props.columns) return [];
    
    return props.columns.map(col => {
      // Special handling for Actions column
      if (col.title && 
         (typeof col.title === 'string' && col.title.includes('Actions')) || 
         (col.key === 'action')) {
        return {
          ...col,
          fixed: 'right' as const, // Keep actions visible by fixing to right
          ellipsis: false, // Don't ellipsize action buttons
          className: `${col.className || ''} responsive-column action-column`.trim(),
          // Preserve width for action column
        };
      }
      
      // For other columns
      return {
      ...col,
        // Convert width to minWidth but cap maximum width
        width: undefined,
        minWidth: typeof col.width === 'number' ? 
          Math.min(col.width, window.innerWidth < 1366 ? 120 : 180) : undefined,
      // Ensure ellipsis for text overflow
      ellipsis: col.ellipsis ?? true,
      // Add className for better control
      className: `${col.className || ''} responsive-column`.trim(),
      };
    });
  }, [props.columns]);

  return (
    <div className="responsive-table">
      <Table
        {...props}
        columns={columns}
        scroll={{ x: 'max-content' }}
        size={window.innerWidth < 1366 ? 'small' : 'middle'}
      />
    </div>
  );
}

export default ResponsiveTable; 