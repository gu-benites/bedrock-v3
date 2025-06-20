/**
 * @fileoverview Therapeutic Properties Table component using TanStack Table.
 * Provides a data table view of therapeutic properties with sorting, filtering, and pagination.
 */

'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TherapeuticProperty } from '../types/recipe.types';

interface TherapeuticPropertiesTableProps {
  properties: TherapeuticProperty[];
  selectedCauses: any[];
  selectedSymptoms: any[];
  onAnalyzeProperty: (property: TherapeuticProperty) => void;
}

export function TherapeuticPropertiesTable({
  properties,
  selectedCauses,
  selectedSymptoms,
  onAnalyzeProperty,
}: TherapeuticPropertiesTableProps) {
  // Helper function to get addressed causes for a property
  const getAddressedCauses = (property: TherapeuticProperty) => {
    if (!property.addresses_cause_ids?.length) return [];
    return selectedCauses.filter(cause => 
      property.addresses_cause_ids?.includes(cause.cause_id)
    );
  };
  
  // Helper function to get addressed symptoms for a property
  const getAddressedSymptoms = (property: TherapeuticProperty) => {
    if (!property.addresses_symptom_ids?.length) return [];
    return selectedSymptoms.filter(symptom => 
      property.addresses_symptom_ids?.includes(symptom.symptom_id)
    );
  };

  // Define columns for the data table
  const columns: ColumnDef<TherapeuticProperty>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'property_name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent"
          >
            Property Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const property = row.original;
        return (
          <div>
            <div className="font-medium">
              {property.property_name_localized || property.property_name || 'Unknown Property'}
            </div>
            {property.property_name_english && 
             property.property_name_english !== property.property_name_localized && (
              <div className="text-xs text-muted-foreground">
                {property.property_name_english}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const property = row.original;
        return (
          <p className="text-xs text-muted-foreground whitespace-normal">
            {property.description_contextual_localized || property.description || 'No description available'}
          </p>
        );
      },
    },
    {
      accessorKey: 'causes',
      header: 'Addressed Causes',
      cell: ({ row }) => {
        const property = row.original;
        const addressedCauses = getAddressedCauses(property);
        return (
          <div className="flex flex-wrap gap-1">
            {addressedCauses.slice(0, 2).map((cause, i) => (
              <Badge 
                key={`${cause.cause_id}-${i}`} 
                variant="outline" 
                className="bg-orange-50 text-orange-700 border-orange-200 text-xs"
                title={cause.explanation}
              >
                {cause.cause_name}
              </Badge>
            ))}
            {addressedCauses.length > 2 && (
              <Badge variant="outline" className="bg-muted text-xs">
                +{addressedCauses.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'symptoms',
      header: 'Addressed Symptoms',
      cell: ({ row }) => {
        const property = row.original;
        const addressedSymptoms = getAddressedSymptoms(property);
        return (
          <div className="flex flex-wrap gap-1">
            {addressedSymptoms.slice(0, 2).map((symptom, i) => (
              <Badge 
                key={`${symptom.symptom_id}-${i}`} 
                variant="outline" 
                className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                title={symptom.explanation}
              >
                {symptom.symptom_name}
              </Badge>
            ))}
            {addressedSymptoms.length > 2 && (
              <Badge variant="outline" className="bg-muted text-xs">
                +{addressedSymptoms.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'relevancy_score',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent"
        >
          Relevancy
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const property = row.original;
        const relevancyScore = property.relevancy_score || property.relevancy || 0;
        return (
          <div className={cn(
            'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
            relevancyScore >= 5
              ? 'bg-green-50 text-green-700'
              : relevancyScore >= 4
              ? 'bg-blue-50 text-blue-700'
              : relevancyScore >= 3
              ? 'bg-yellow-50 text-yellow-700'
              : 'bg-gray-50 text-gray-700'
          )}>
            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L8.107 10.5a.75.75 0 00-1.214 1.029l1.5 2.25a.75.75 0 001.214-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
            {relevancyScore}/5
          </div>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const property = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onAnalyzeProperty(property)}
                className="cursor-pointer"
              >
                Analyze Essential Oils
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'relevancy_score', desc: true } // Default sort by relevancy
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Initialize table
  const table = useReactTable({
    data: properties,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter properties..."
            value={(table.getColumn('property_name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('property_name')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace('_', ' ')}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-muted/50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">
                    No therapeutic properties found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} properties selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="bg-muted p-4 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {table.getFilteredSelectedRowModel().rows.length} properties selected
            </span>
            <Button 
              size="sm"
              variant="outline"
              onClick={() => {
                const selectedProperties = table.getFilteredSelectedRowModel().rows.map(row => row.original);
                console.log("Analyze selected properties:", selectedProperties);
                // Here you would call a function to analyze multiple properties at once
              }}
            >
              Analyze Selected Oils
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
