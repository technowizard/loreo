import {
  MutationCache,
  QueryClient,
  type DefaultOptions,
  type QueryKey,
  type UseMutationOptions
} from '@tanstack/react-query';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      invalidates?: QueryKey[];
    };
  }
}

const queryConfig = {
  mutations: {
    retry: 1,
    retryDelay: 1000
  },
  queries: {
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: (failureCount: number) => failureCount < 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    staleTime: 5 * 60 * 1000
  }
} satisfies DefaultOptions;

export function createQueryClient() {
  // `client` is declared first so the MutationCache closure can reference it
  // by the time onSuccess fires, the assignment below has already run
  let client: QueryClient;

  const mutationCache = new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      const keys = mutation.meta?.invalidates;

      if (!keys?.length) {
        return;
      }

      for (const queryKey of keys) {
        client!.invalidateQueries({ queryKey });
      }
    }
  });

  client = new QueryClient({ defaultOptions: queryConfig, mutationCache });

  return client;
}

export const queryClient = createQueryClient();

export type ApiFnReturnType<FnType extends (...args: unknown[]) => Promise<unknown>> = Awaited<
  ReturnType<FnType>
>;

export type QueryConfig<TQueryOptionsFn extends (...args: any[]) => any> = Partial<
  Omit<ReturnType<TQueryOptionsFn>, 'queryKey' | 'queryFn'>
>;

export type MutationConfig<MutationFnType extends (...args: any[]) => any> = UseMutationOptions<
  ApiFnReturnType<MutationFnType>,
  Error,
  Parameters<MutationFnType>[0]
>;
