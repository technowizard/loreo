import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

import { Loading } from '@/components/common/loading';

import { App } from './app';
import './lib/i18n';
import './styles.css';

const rootElement = document.getElementById('root');

if (rootElement && !rootElement.innerHTML) {
  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <Suspense fallback={<Loading />}>
        <App />
      </Suspense>
    </StrictMode>
  );
}
