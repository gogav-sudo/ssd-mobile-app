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
        {/*
          PWA scrolling model: the document itself scrolls. expo-router's
          ScrollViewStyleReset pins html/body/#root to height:100% and sets
          body{overflow:hidden}, assuming every screen is a single
          native-style ScrollView with a fully bounded height all the way up
          its ancestor chain. That assumption breaks here: each route is
          wrapped by @react-navigation/native-stack in a
          position:absolute/inset:0 box (sized to the viewport, not to
          content), and our own screens size themselves to their content
          (minHeight, not height/flex, in ScreenBackground) - so nothing in
          that chain ever resolves to a definite, shorter-than-content
          height for a nested ScrollView to clip and scroll within. Letting
          body scroll instead works regardless: overflowing content is
          picked up by body's scrollable overflow with no dependency on a
          definite height anywhere above it.
        */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                min-height: 100%;
              }

              #root {
                display: flex;
                flex: 1;
              }

              body {
                margin: 0;
                overflow-x: hidden;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
              }
            `,
          }}
        />
        <script src="https://genvibe.pro/inspector-script.js?v=e2b" />
      </head>
      <body>{children}</body>
    </html>
  );
}
