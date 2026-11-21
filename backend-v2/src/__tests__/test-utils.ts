/**
 * Test Utilities and Lightweight Zero-Dependency Mocks for Backend Tests
 */

import { AuthenticatedRequest } from '../middleware/auth';

export interface MockRequestOptions {
  headers?: Record<string, string | string[] | undefined>;
  params?: Record<string, string>;
  query?: Record<string, string | string[] | undefined>;
  body?: any;
  user?: any;
  method?: string;
  url?: string;
}

export interface MockResponse {
  statusCode: number;
  _jsonData: any;
  _sentData: any;
  _headers: Record<string, string>;
  _isEnd: boolean;
  status(code: number): MockResponse;
  json(data: any): MockResponse;
  send(data: any): MockResponse;
  setHeader(name: string, value: string): MockResponse;
  end(): MockResponse;
}

export interface MockNextFunction {
  (err?: any): void;
  called: boolean;
  error?: any;
}

/**
 * Creates a lightweight Express mock request object conforming to AuthenticatedRequest.
 */
export const createMockRequest = (options: MockRequestOptions = {}): AuthenticatedRequest => {
  const headers = options.headers || {};
  const req = {
    headers,
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    user: options.user,
    method: options.method || 'GET',
    url: options.url || '/',
    get(name: string): string | undefined {
      const lower = name.toLowerCase();
      const match = Object.keys(headers).find(k => k.toLowerCase() === lower);
      return match ? (headers[match] as string) : undefined;
    },
    header(name: string): string | undefined {
      return this.get(name);
    }
  };
  return req as unknown as AuthenticatedRequest;
};

/**
 * Creates a lightweight Express mock response object with status/json chaining.
 */
export const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    statusCode: 200,
    _jsonData: null,
    _sentData: null,
    _headers: {},
    _isEnd: false,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this._jsonData = data;
      this._sentData = data;
      this._isEnd = true;
      return this;
    },
    send(data: any) {
      this._sentData = data;
      this._isEnd = true;
      return this;
    },
    setHeader(name: string, value: string) {
      this._headers[name.toLowerCase()] = value;
      return this;
    },
    end() {
      this._isEnd = true;
      return this;
    }
  };
  return res;
};

/**
 * Creates a mock Express next function tracking invocation and errors.
 */
export const createMockNext = (): MockNextFunction => {
  const nextFn = ((err?: any) => {
    nextFn.called = true;
    nextFn.error = err;
  }) as MockNextFunction;
  nextFn.called = false;
  nextFn.error = undefined;
  return nextFn;
};

/**
 * Helper to create a chainable query mock (e.g. for User.findById(id).select('-password')).
 */
export const createQueryMock = (result: any) => ({
  select: (_fields?: string) => Promise.resolve(result),
  populate: (_path?: any) => Promise.resolve(result),
  lean: () => Promise.resolve(result),
  exec: () => Promise.resolve(result),
  then: (resolve: (val: any) => any, reject: (err: any) => any) => Promise.resolve(result).then(resolve, reject)
});

/**
 * Temporarily stubs a method on an object or model, restoring the original after execution.
 */
export const withMockModel = async <T>(
  model: any,
  methodName: string,
  mockImplementation: (...args: any[]) => any,
  testFn: () => Promise<T> | T
): Promise<T> => {
  const original = model[methodName];
  try {
    model[methodName] = mockImplementation;
    return await testFn();
  } finally {
    model[methodName] = original;
  }
};

/**
 * Calculates distance in meters between two GPS coordinates using Haversine formula.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const clampedA = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
  return R * c;
};

/**
 * Strict RFC 1918 Private IPv4 address validator (matches production server.ts CORS rules).
 */
export const isPrivateIP = (hostname: string): boolean => {
  return (
    /^10(\.\d{1,3}){3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}$/.test(hostname) ||
    /^192\.168(\.\d{1,3}){2}$/.test(hostname)
  );
};

export const normalizeDiacritics = (str: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase();
};

/**
 * Cleans and sanitizes currency amounts containing commas, dots, spaces, or currency text.
 * Always returns a clean integer VND; never returns NaN.
 */
export const sanitizeCurrencyAmount = (input: any): number => {
  if (typeof input === 'number') return isNaN(input) ? 0 : Math.round(input);
  if (!input) return 0;
  let str = String(input).trim();

  // Strip trailing decimal cents like .00 or ,00 followed by currency symbols
  str = str.replace(/([.,]00)\s*(VND|đ|d)?$/i, '');

  // If dot is used as thousands separator (e.g. 2.500.000 đ)
  if (/\.\d{3}(\.|\b)/.test(str)) {
    str = str.replace(/\./g, '');
  }

  // Remove commas (used as thousands separator)
  str = str.replace(/,/g, '');

  const cleaned = str.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed);
};
