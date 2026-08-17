import { useState, useEffect } from 'preact/hooks';
import { lazy, Suspense } from 'preact/compat';
import type { ComponentChildren } from 'preact';
import Home from '@/pages/home';

// Home stays eager (it is the LCP/first-paint route). Secondary routes are
// code-split so they don't bloat the initial bundle.
const About = lazy(() => import('@/pages/about'));
const Dgbs = lazy(() => import('@/pages/dgbs'));
const Privacy = lazy(() => import('@/pages/privacy'));
const Features = lazy(() => import('@/pages/features').then(m => ({ default: m.Features })));
const Report = lazy(() => import('@/pages/report'));

export function navigate(to: string) {
  history.pushState(null, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function renderRoute(path: string) {
  switch (path) {
    case '/about': return <About />;
    case '/dgbs': return <Dgbs />;
    case '/privacy': return <Privacy />;
    case '/features': return <Features />;
    case '/report': return <Report />;
    default: return <Home />;
  }
}

export function Router() {
  const [path, setPath] = useState(location.pathname);

  useEffect(() => {
    const onNav = () => setPath(location.pathname);
    window.addEventListener('popstate', onNav);
    return () => window.removeEventListener('popstate', onNav);
  }, []);

  return <Suspense fallback={null}>{renderRoute(path)}</Suspense>;
}

export function Link({ href, class: cls, children }: { href: string; class?: string; children: ComponentChildren }) {
  const onClick = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };
  return <a href={href} class={cls} onClick={onClick}>{children}</a>;
}
