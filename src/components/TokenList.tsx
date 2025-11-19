'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTokenWebSocket } from '@/hooks/useTokenWebSocket';
import { TokenData } from '@/types/token';
import { formatCurrency, formatPercentage, formatCompactNumber } from '@/utils/format';
import { SearchIcon } from './icons/SearchIcon';
import { SortIcon } from './icons/SortIcon';
import { LoadingSkeleton } from './LoadingSkeleton';

const columnHelper = createColumnHelper<TokenData>();

export const TokenList = () => {
    const { data, isConnected, error } = useTokenWebSocket();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [showSkeleton, setShowSkeleton] = useState(true);

    // Effect to handle skeleton loading state
    // Show skeleton on initial load until we have data or a connection error
    // Or if we are connected but waiting for the first message
    useMemo(() => {
        if (data.length > 0 || error) {
            setShowSkeleton(false);
        }
    }, [data, error]);

    const columns = useMemo(
        () => [
            columnHelper.accessor('baseSymbol', {
                header: 'Token',
                size: 200,
                cell: (info) => (
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                            <span className="text-text-primary font-bold">{info.getValue()}</span>
                            <span className="text-text-secondary text-xs">{info.row.original.baseName}</span>
                        </div>
                    </div>
                ),
            }),
            columnHelper.accessor('priceUsd', {
                header: 'Price',
                size: 120,
                cell: (info) => <span className="text-text-primary">{formatCurrency(info.getValue())}</span>,
            }),
            columnHelper.accessor('priceChange1h', {
                header: '1h Change',
                size: 120,
                cell: (info) => {
                    const val = info.getValue();
                    return (
                        <span className={val >= 0 ? 'text-upside' : 'text-downside'}>
                            {val > 0 ? '+' : ''}{formatPercentage(val)}
                        </span>
                    );
                },
            }),
            columnHelper.accessor('priceChange24h', {
                header: '24h Change',
                size: 120,
                cell: (info) => {
                    const val = info.getValue();
                    return (
                        <span className={val >= 0 ? 'text-upside' : 'text-downside'}>
                            {val > 0 ? '+' : ''}{formatPercentage(val)}
                        </span>
                    );
                },
            }),
            columnHelper.accessor('volumeUsd24h', {
                header: '24h Volume',
                size: 150,
                cell: (info) => <span className="text-text-primary">${formatCompactNumber(info.getValue())}</span>,
            }),
            columnHelper.accessor('marketCap', {
                header: 'Market Cap',
                size: 150,
                cell: (info) => <span className="text-text-primary">${formatCompactNumber(info.getValue())}</span>,
            }),
        ],
        []
    );

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    const { rows } = table.getRowModel();

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 73, // Estimated row height based on CSS (py-4 + content)
        overscan: 10,
    });

    if (showSkeleton) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-6 bg-black h-screen flex flex-col text-text-primary">
            <div className="flex justify-between items-center mb-6 flex-none">
                <h1 className="text-2xl font-bold text-text-primary">Trending Tokens</h1>
                <div className="relative">
                    <input
                        type="text"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Search tokens..."
                        className="bg-transparent border border-border-custom rounded-full py-2 pl-10 pr-4 text-text-primary focus:outline-none focus:border-primary-pink transition-colors"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <SearchIcon className="w-4 h-4 text-text-secondary" />
                    </div>
                </div>
            </div>

            {!isConnected && data.length === 0 && (
                <div className="text-center py-10 text-text-secondary flex-none">Connecting to WebSocket...</div>
            )}

            {error && (
                <div className="text-center py-10 text-downside flex-none">Error: {error}</div>
            )}

            <div
                className="overflow-y-auto border border-border-custom rounded-lg flex-1"
                ref={tableContainerRef}
            >
                <table className="w-full border-collapse relative">
                    <thead className="sticky top-0 z-10 bg-black border-b border-border-custom">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="py-4 px-4 text-left text-text-secondary font-medium cursor-pointer select-none hover:text-text-primary transition-colors"
                                        onClick={header.column.getToggleSortingHandler()}
                                        style={{ width: header.getSize() }}
                                    >
                                        <div className="flex items-center gap-1">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            <SortIcon className={`w-2 h-3 ${header.column.getIsSorted() ? 'opacity-100' : 'opacity-40'}`} />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            position: 'relative',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const row = rows[virtualRow.index];
                            return (
                                <tr
                                    key={row.id}
                                    className="border-b border-border-custom hover:bg-row-hover/10 transition-colors group absolute w-full"
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="py-4 px-4" style={{ width: cell.column.getSize() }}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                        {data.length === 0 && isConnected && (
                            <tr className="absolute w-full">
                                <td colSpan={columns.length} className="py-10 text-center text-text-secondary">
                                    Waiting for data...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
