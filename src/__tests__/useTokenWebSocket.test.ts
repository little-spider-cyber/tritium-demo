import { renderHook, act, waitFor } from '@testing-library/react';
import { useTokenWebSocket } from '../hooks/useTokenWebSocket';
import pako from 'pako';

// Mock pako
jest.mock('pako', () => ({
  inflate: jest.fn(),
}));

describe('useTokenWebSocket', () => {
  let mockWebSocket: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup WebSocket mock
    mockWebSocket = {
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN,
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
    };

    // Mock global WebSocket
    global.WebSocket = jest.fn(() => mockWebSocket) as any;
    (global.WebSocket as any).OPEN = 1;
  });

  it('should connect to WebSocket on mount', async () => {
    const { result } = renderHook(() => useTokenWebSocket());

    // Wait for connection
    await act(async () => {
      mockWebSocket.onopen();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining('trending'));
  });

  it('should handle incoming JSON data correctly', async () => {
    const { result } = renderHook(() => useTokenWebSocket());

    await act(async () => {
      mockWebSocket.onopen();
    });

    const mockData = {
      topic: 'trending',
      data: [
        {
          baseSymbol: 'TEST',
          price: 1.23,
          info: '{"website":"test.com"}'
        }
      ]
    };

    await act(async () => {
      mockWebSocket.onmessage({ data: JSON.stringify(mockData) });
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].baseSymbol).toBe('TEST');
    expect(result.current.data[0].info).toEqual({ website: 'test.com' });
  });

  it('should handle incoming compressed data correctly', async () => {
    const { result } = renderHook(() => useTokenWebSocket());

    await act(async () => {
      mockWebSocket.onopen();
    });

    const mockData = {
        topic: 'trending',
        data: [
          {
            baseSymbol: 'COMPRESSED',
            price: 100
          }
        ]
      };

    // Mock pako inflate behavior
    (pako.inflate as jest.Mock).mockReturnValue(
        new TextEncoder().encode(JSON.stringify(mockData))
    );

    // Simulate a compressed string (in reality this would be ISO-8859-1 char codes)
    // For test simplicity we pass a dummy string that triggers the decompress logic
    // The decompressData function logic: string -> charCode -> Uint8Array -> inflate -> UTF8 decode
    // We just need to ensure pako.inflate is called and returns something we can decode
    
    // We can't easily pass invalid JSON that is also valid "compressed string" for our mock logic without
    // implementing the exact inverse. 
    // Instead, we'll mock the implementation of decompressData or just ensure pako is called.
    // Since decompressData is internal, we have to rely on the hook's behavior.
    
    // Let's pass a string that is NOT valid JSON so it goes to the catch block and tries decompression
    const compressedString = "NOT_JSON_STRING";

    await act(async () => {
      mockWebSocket.onmessage({ data: compressedString });
    });

    expect(pako.inflate).toHaveBeenCalled();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].baseSymbol).toBe('COMPRESSED');
  });

  it('should respond to ping with pong', async () => {
    renderHook(() => useTokenWebSocket());

    await act(async () => {
      mockWebSocket.onopen();
    });

    await act(async () => {
      mockWebSocket.onmessage({ 
          data: JSON.stringify({ topic: 'ping' }) 
      });
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining('"topic":"pong"'));
  });

  it('should handle connection errors', async () => {
    const { result } = renderHook(() => useTokenWebSocket());

    await act(async () => {
      mockWebSocket.onerror('Connection failed');
    });

    expect(result.current.error).toBe('WebSocket connection error');
  });

  it('should attempt to reconnect on close', async () => {
    jest.useFakeTimers();
    renderHook(() => useTokenWebSocket());

    await act(async () => {
        mockWebSocket.onopen();
    });
    
    // Initial connection success
    expect(global.WebSocket).toHaveBeenCalledTimes(1);

    // Close connection
    await act(async () => {
        mockWebSocket.onclose();
    });

    // Fast-forward time to trigger reconnect
    act(() => {
        jest.advanceTimersByTime(3000);
    });

    expect(global.WebSocket).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});

