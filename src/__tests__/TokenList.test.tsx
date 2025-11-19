import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { TokenList } from '../components/TokenList';
import { useTokenWebSocket } from '../hooks/useTokenWebSocket';

// Mock the hook
jest.mock('../hooks/useTokenWebSocket');

// Mock react-virtual
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(() => ({
    getTotalSize: () => 1000,
    getVirtualItems: () => [],
  })),
}));

// Mock icons
jest.mock('../components/icons/SearchIcon', () => ({
  SearchIcon: () => <div data-testid="search-icon" />
}));
jest.mock('../components/icons/SortIcon', () => ({
  SortIcon: ({ sortState }: { sortState: string }) => <div data-testid="sort-icon" data-sort={sortState} />
}));

// Mock LoadingSkeleton
jest.mock('../components/LoadingSkeleton', () => ({
  LoadingSkeleton: () => <div data-testid="loading-skeleton">Loading Skeleton...</div>
}));

const mockUseTokenWebSocket = useTokenWebSocket as jest.Mock;

describe('TokenList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading skeleton initially', () => {
    mockUseTokenWebSocket.mockReturnValue({
      data: [],
      isConnected: false,
      error: null,
    });

    render(<TokenList />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should render token list when data is available', async () => {
    // Setup virtualizer mock to return items
    const { useVirtualizer } = require('@tanstack/react-virtual');
    useVirtualizer.mockReturnValue({
      getTotalSize: () => 50,
      getVirtualItems: () => [{
        index: 0,
        start: 0,
        size: 50,
        key: '0'
      }]
    });

    const mockData = [
      {
        baseSymbol: 'BTC',
        baseName: 'Bitcoin',
        priceUsd: 60000,
        priceChange1h: 0.05,
        priceChange24h: -0.02,
        volumeUsd24h: 1000000000,
        marketCap: 1000000000000,
        pair: 'btc-pair'
      }
    ];

    mockUseTokenWebSocket.mockReturnValue({
      data: mockData,
      isConnected: true,
      error: null,
    });

    render(<TokenList />);

    expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('$60,000.00')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    const { useVirtualizer } = require('@tanstack/react-virtual');
    useVirtualizer.mockReturnValue({
      getTotalSize: () => 0,
      getVirtualItems: () => []
    });

    mockUseTokenWebSocket.mockReturnValue({
      data: [],
      isConnected: false,
      error: 'Connection failed',
    });

    render(<TokenList />);

    expect(screen.getByText('Error: Connection failed')).toBeInTheDocument();
  });

  it('should filter tokens when searching', async () => {
    const { useVirtualizer } = require('@tanstack/react-virtual');
    useVirtualizer.mockReturnValue({
      getTotalSize: () => 0,
      getVirtualItems: () => []
    });

    mockUseTokenWebSocket.mockReturnValue({
      data: [{ baseSymbol: 'TEST' }], // Provide data to bypass skeleton
      isConnected: true,
      error: null,
    });

    render(<TokenList />);

    const searchInput = screen.getByPlaceholderText('Search tokens...');
    fireEvent.change(searchInput, { target: { value: 'ETH' } });

    expect(searchInput).toHaveValue('ETH');
  });
});
