import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Mock for WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  readyState: number = 1; // OPEN

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose();
    }
  }

  constructor(url: string) {
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 100);
  }
}

global.WebSocket = MockWebSocket as any;
global.TextDecoder = TextDecoder as any;
global.TextEncoder = TextEncoder as any;
global.Uint8Array = Uint8Array;
