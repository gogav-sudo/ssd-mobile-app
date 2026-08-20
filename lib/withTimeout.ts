// Guards against a stalled network request (e.g. a tunnelled dev preview,
// or a flaky connection) leaving a screen stuck on a loading state forever
// with no feedback, even though the server may have already responded.
//
// IMPORTANT: Promise.race alone does NOT cancel the underlying request —
// it just stops *waiting* on it. If the caller is a Supabase PostgrestBuilder
// (a "thenable", not a real Promise until you call .then()), an AbortController
// signal is threaded through so the actual fetch() is aborted too, not just
// abandoned in the background.
export function withTimeout<T>(
  builder: { abortSignal: (signal: AbortSignal) => PromiseLike<T> },
  ms: number,
  timeoutMessage = 'Сервер не отвечает. Проверьте подключение и попробуйте снова.'
): Promise<T> {
  const controller = new AbortController();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      console.warn(`[withTimeout] Timed out after ${ms}ms — aborting request.`);
      controller.abort();
      reject(new Error(timeoutMessage));
    }, ms);

    Promise.resolve(builder.abortSignal(controller.signal)).then(
      (value) => {
        clearTimeout(timer);
        console.log('[withTimeout] Request resolved before timeout.');
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        console.warn('[withTimeout] Request rejected:', err?.message ?? err);
        reject(err);
      }
    );
  });
}
