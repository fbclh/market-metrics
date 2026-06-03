import { Suspense } from 'react';
import Home from '@/src/pages/Home';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  );
}
