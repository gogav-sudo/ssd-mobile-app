// Proven pattern (confirmed working via adb logcat on real devices): on some
// networks the Supabase request never resolves at the transport level at
// all — no error, no response, nothing. AbortController does not help here
// because the stall is below the fetch layer. The only reliable fix is a
// plain, independent setTimeout race: whichever finishes first (the real
// request, or the timeout) wins, and the loser is ignored.
//
// This does NOT cancel the underlying request — it just stops the SCREEN
// from waiting on it forever. If the real response arrives later, it is
// simply discarded (the caller has already moved on to a fallback state).
//
// Built specifically for Supabase's `{ data, error }` / `{ count, error }`
// response shape, since that's every call site in this app. On timeout,
// `timedOut` is true and both data/count are null — callers just check
// `timedOut` first and use their own empty fallback (null, [], or 0).
export type SupabaseLikeResponse = { error: unknown } & Record<string, unknown>;

export type RaceResult<T extends SupabaseLikeResponse> =
  | ({ timedOut: true } & { [K in keyof T]: null })
  | ({ timedOut: false } & T);

export function raceWithTimeout<T extends SupabaseLikeResponse>(
  promise: PromiseLike<T>,
  ms: number,
  label = 'query'
): Promise<RaceResult<T>> {
  return new Promise((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.warn(`[raceWithTimeout] "${label}" timed out after ${ms}ms — falling back.`);
      resolve({ timedOut: true, data: null, error: null, count: null } as unknown as RaceResult<T>);
    }, ms);

    Promise.resolve(promise).then(
      (response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ timedOut: false, ...response });
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        console.warn(`[raceWithTimeout] "${label}" threw:`, err?.message ?? err);
        resolve({ timedOut: false, data: null, error: err } as unknown as RaceResult<T>);
      }
    );
  });
}

export const DEFAULT_QUERY_TIMEOUT_MS = 8000;
