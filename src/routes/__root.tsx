import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { motion, MotionConfig } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { useMotionPref } from "../lib/motion-pref";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useAccountSync } from "../services/remote-sync";
import { careerStore } from "../services/career/store";
import { ProofCompanion } from "../components/companion/ProofCompanion";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="kicker">Off the map</p>
        <h1 className="mt-3 font-display text-8xl font-medium text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-teal px-5 py-2 text-ink text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-teal px-5 py-2 text-ink text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Proof — practice the work behind the interview" },
      {
        name: "description",
        content: "Workplace rehearsals for graduates exploring their next career step.",
      },
      { name: "theme-color", content: "#0f141c" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  pendingComponent: () => (
    <div
      role="status"
      className="grid min-h-[50vh] place-items-center font-mono text-xs uppercase tracking-widest text-muted-foreground"
    >
      Loading…
    </div>
  ),
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useAccountSync();
  useEffect(() => careerStore.init(), []);
  const { allowed } = useMotionPref();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    main.current?.focus({ preventScroll: true }); // move focus to new content for keyboard/screen-reader users
  }, [path]);
  const bare = path.startsWith("/present");

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion={allowed ? "never" : "always"}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-teal focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        {!bare && <SiteHeader />}
        <main id="main" ref={main} tabIndex={-1} className="outline-none">
          {/* Only route content is keyed — store, auth and header stay mounted across navigation. */}
          <motion.div
            key={path}
            initial={allowed ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </motion.div>
        </main>
        {!bare && (
          <footer className="mx-auto flex max-w-6xl flex-wrap items-center gap-5 border-t border-border pb-28 pl-5 pr-28 pt-8 text-sm text-muted-foreground">
            <span className="mr-auto font-display text-xl text-foreground">Proof.</span>
            <Link to="/about">About</Link>
            <Link to="/present">Present</Link>
            <Link to="/learn">Sample data case</Link>
          </footer>
        )}
        {!bare && <ProofCompanion />}
      </MotionConfig>
    </QueryClientProvider>
  );
}
