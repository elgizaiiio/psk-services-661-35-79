import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

const logger = createLogger('ApiClient');

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

interface ApiResult<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

interface UseApiClientOptions {
  showErrorToast?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: UseApiClientOptions = {
  showErrorToast: true,
  retryCount: 2,
  retryDelay: 1000,
};

export function useApiClient<T = unknown>(options: UseApiClientOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<T | null>(null);

  const handleError = useCallback((err: unknown, context: string): ApiError => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
    };

    if (err instanceof Error) {
      apiError.message = err.message;
    } else if (typeof err === 'object' && err !== null) {
      const errorObj = err as Record<string, unknown>;
      apiError.message = String(errorObj.message || errorObj.error || apiError.message);
      apiError.code = String(errorObj.code || '');
      apiError.status = Number(errorObj.status) || undefined;
    }

    logger.error(`${context}: ${apiError.message}`, err);

    if (opts.showErrorToast) {
      toast({
        title: 'Error',
        description: apiError.message,
        variant: 'destructive',
      });
    }

    return apiError;
  }, [opts.showErrorToast]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const executeWithRetry = useCallback(async <R>(
    fn: () => Promise<R>,
    context: string,
    retries = opts.retryCount || 0
  ): Promise<R> => {
    try {
      return await fn();
    } catch (err) {
      if (retries > 0) {
        logger.warn(`${context}: Retrying... (${retries} attempts left)`);
        await sleep(opts.retryDelay || 1000);
        return executeWithRetry(fn, context, retries - 1);
      }
      throw err;
    }
  }, [opts.retryCount, opts.retryDelay]);

  const query = useCallback(async <R = T>(
    queryFn: () => Promise<{ data: R | null; error: unknown }>,
    context: string = 'Query'
  ): Promise<ApiResult<R>> => {
    setLoading(true);
    setError(null);

    try {
      const result = await executeWithRetry(async () => {
        return await queryFn();
      }, context);

      if (result.error) {
        const apiError = handleError(result.error, context);
        setError(apiError);
        return { data: null, error: apiError, loading: false };
      }

      setData(result.data as unknown as T);
      return { data: result.data, error: null, loading: false };
    } catch (err) {
      const apiError = handleError(err, context);
      setError(apiError);
      return { data: null, error: apiError, loading: false };
    } finally {
      setLoading(false);
    }
  }, [executeWithRetry, handleError]);

  const invokeFunction = useCallback(async <R = T>(
    functionName: string,
    body?: Record<string, unknown>,
    context: string = 'Function'
  ): Promise<ApiResult<R>> => {
    setLoading(true);
    setError(null);

    try {
      const result = await executeWithRetry(async () => {
        return await supabase.functions.invoke(functionName, { body });
      }, context);

      if (result.error) {
        const apiError = handleError(result.error, context);
        setError(apiError);
        return { data: null, error: apiError, loading: false };
      }

      setData(result.data as unknown as T);
      return { data: result.data as R, error: null, loading: false };
    } catch (err) {
      const apiError = handleError(err, context);
      setError(apiError);
      return { data: null, error: apiError, loading: false };
    } finally {
      setLoading(false);
    }
  }, [executeWithRetry, handleError]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    query,
    invokeFunction,
    reset,
    setData,
  };
}

export default useApiClient;
