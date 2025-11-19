import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ExpandedState,
  type VisibilityState,
  type Row,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronsUpDown, ChevronUp, Settings2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Button } from './button';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowCanExpand?: (row: Row<TData>) => boolean;
  renderExpandedRow?: (row: Row<TData>) => React.ReactNode;
  enableSorting?: boolean;
  enableColumnVisibility?: boolean;
  initialColumnVisibility?: VisibilityState;
  storageKey?: string; // Key for localStorage persistence
}

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowCanExpand,
  renderExpandedRow,
  enableSorting = true,
  enableColumnVisibility = true,
  initialColumnVisibility = {},
  storageKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Load column visibility from localStorage if available
  const loadColumnVisibility = (): VisibilityState => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`table-visibility-${storageKey}`);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.error('Failed to load column visibility:', error);
      }
    }
    return initialColumnVisibility;
  };

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    loadColumnVisibility()
  );

  // Save column visibility to localStorage when it changes
  const handleColumnVisibilityChange = (visibility: VisibilityState) => {
    setColumnVisibility(visibility);
    if (storageKey) {
      try {
        localStorage.setItem(
          `table-visibility-${storageKey}`,
          JSON.stringify(visibility)
        );
      } catch (error) {
        console.error('Failed to save column visibility:', error);
      }
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getExpandedRowModel: getRowCanExpand ? getExpandedRowModel() : undefined,
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    getRowCanExpand,
    state: {
      sorting,
      expanded,
      columnVisibility,
    },
  });

  const allColumns = table.getAllColumns();
  const visibleColumnsCount = allColumns.filter((col) => col.getIsVisible()).length;

  return (
    <div className="space-y-4">
      {enableColumnVisibility && allColumns.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Showing {visibleColumnsCount} of {allColumns.length} columns
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allColumns
              .filter((column) => column.getCanHide())
              .map((column) => {
                const columnId = column.id;
                const isVisible = column.getIsVisible();
                return (
                  <Button
                    key={columnId}
                    variant={isVisible ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => column.toggleVisibility(!isVisible)}
                    className="text-xs"
                  >
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : columnId}
                  </Button>
                );
              })}
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <TableHead
                      key={header.id}
                      className={canSort ? 'cursor-pointer select-none' : ''}
                      onClick={
                        canSort ? header.column.getToggleSortingHandler() : undefined
                      }
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {canSort && (
                          <span className="text-gray-400">
                            {isSorted === 'asc' && <ChevronUp className="h-4 w-4" />}
                            {isSorted === 'desc' && <ChevronDown className="h-4 w-4" />}
                            {!isSorted && <ChevronsUpDown className="h-4 w-4" />}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <>
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && renderExpandedRow && (
                    <TableRow key={`${row.id}-expanded`}>
                      <TableCell colSpan={row.getVisibleCells().length}>
                        {renderExpandedRow(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Helper component for expandable row toggle button
export function ExpandToggleButton<TData>({ row }: { row: Row<TData> }) {
  if (!row.getCanExpand()) {
    return null;
  }

  return (
    <button
      onClick={() => row.toggleExpanded()}
      className="p-1 hover:bg-gray-100 rounded transition-colors"
      aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
    >
      {row.getIsExpanded() ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  );
}
