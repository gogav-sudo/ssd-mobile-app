// Guards against a stalled network request (e.g. a tunnelled dev preview,
// or a flaky connection) leaving a screen stuck on a loading state forever
// with no feedback, even though the server may have already responded.
export function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  timeoutMessage = 'Сервер не отвечает. Проверьте подключение и попробуйте снова.'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}
