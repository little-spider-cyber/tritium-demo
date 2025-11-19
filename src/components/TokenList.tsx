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
    const [showMarketCap, setShowMarketCap] = useState(false);

    const handleShowMarketCapChange = () => {

        setShowMarketCap(!showMarketCap);
        setSorting(currentSorting => {
            const dynamicColumnId = showMarketCap ? 'marketCap' : 'liquidity';
            const isSortingByDynamic = currentSorting.some(s => s.id === dynamicColumnId);
            if (isSortingByDynamic) {
                const newId = !showMarketCap ? 'marketCap' : 'liquidity';
                return currentSorting.map(s => s.id === dynamicColumnId ? { ...s, id: newId } : s);
            }
            return currentSorting;
        });
    };

    const columns = useMemo(
        () => [
            columnHelper.accessor('baseSymbol', {
                header: 'Token',
                size: 250,
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
                size: 150,
                cell: (info) => <span className="text-text-primary">{formatCurrency(info.getValue())}</span>,
            }),
            columnHelper.accessor('priceChange1m', {
                header: '1m',
                size: 100,
                cell: (info) => {
                    const val = info.getValue();
                    return (
                        <span className={val >= 0 ? 'text-upside' : 'text-downside'}>
                            {val > 0 ? '+' : ''}{formatPercentage(val)}
                        </span>
                    );
                },
            }),
            columnHelper.accessor('priceChange5m', {
                header: '5m',
                size: 100,
                cell: (info) => {
                    const val = info.getValue();
                    return (
                        <span className={val >= 0 ? 'text-upside' : 'text-downside'}>
                            {val > 0 ? '+' : ''}{formatPercentage(val)}
                        </span>
                    );
                },
            }),
            columnHelper.accessor('priceChange1h', {
                header: '1h',
                size: 100,
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
                header: '24h',
                size: 100,
                cell: (info) => {
                    const val = info.getValue();
                    return (
                        <span className={val >= 0 ? 'text-upside' : 'text-downside'}>
                            {val > 0 ? '+' : ''}{formatPercentage(val)}
                        </span>
                    );
                },
            }),
            columnHelper.accessor(row => showMarketCap ? row.marketCap : row.liquidity, {
                id: showMarketCap ? 'marketCap' : 'liquidity',
                header: () => (
                    <div className="flex items-center gap-1 cursor-pointer select-none" onClick={(e) => {
                        e.stopPropagation();
                        handleShowMarketCapChange();
                    }}>
                        <span className={!showMarketCap ? "text-text-primary" : "text-text-secondary"}>Liq</span>
                        <span className="text-text-secondary">/</span>
                        <span className={showMarketCap ? "text-text-primary" : "text-text-secondary"}>MC</span>
                    </div>
                ),
                enableSorting: true,
                size: 180,
                cell: (info) => {
                    return <span className="text-text-primary">${formatCompactNumber(info.getValue())}</span>;
                },
            }),
        ],
        [showMarketCap]
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
        estimateSize: () => 73,
        overscan: 10,
    });

    if (!isConnected && data.length === 0 && !error) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="w-full h-screen flex flex-col text-text-primary bg-black p-6">
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

            {error && (
                <div className="text-center py-10 text-downside flex-none">Error: {error}</div>
            )}

            <div
                className="overflow-y-auto border border-border-custom rounded-lg flex-1 w-full"
                ref={tableContainerRef}
            >
                <table className="w-full table-fixed border-collapse relative">
                    <thead className="sticky top-0 z-10 bg-black border-b border-border-custom">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="flex w-full">
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="py-4 px-4 text-left text-text-secondary font-medium cursor-pointer select-none hover:text-text-primary transition-colors flex items-center"
                                        onClick={header.column.getToggleSortingHandler()}
                                        style={{ width: `${header.getSize()}px`, flex: `0 0 ${header.getSize()}px` }}
                                    >
                                        <div className="flex items-center gap-1 w-full">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            <SortIcon
                                                className="w-2 h-3 ml-1"
                                                sortState={header.column.getIsSorted()}
                                            />
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
                            display: 'block'
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const row = rows[virtualRow.index];
                            return (
                                <tr
                                    key={row.id}
                                    className="border-b border-border-custom hover:bg-row-hover/10 transition-colors group absolute top-0 left-0 flex w-full items-center"
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="py-4 px-4 overflow-hidden text-ellipsis whitespace-nowrap"
                                            style={{ width: `${cell.column.getSize()}px`, flex: `0 0 ${cell.column.getSize()}px` }}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
