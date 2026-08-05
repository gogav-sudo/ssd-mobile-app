import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Custom web HTML shell (web builds only — never used on iOS/Android).
 * The GenVibe inspector script powers element-picking and runtime-error
 * capture in the workbench preview; vite projects get it injected into
 * index.html, but Metro generates this shell, so it lives here instead.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <script src="https://genvibe.pro/inspector-script.js?v=e2b" />
      </head>
      <body>{children}</body>
    </html>
  );
}
