import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import HomePage from '@/pages/HomePage';
import { Route, Switch, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

// Adult-facing insights area (teacher/parent) — lazy so the child's game
// bundle never pays for dashboards, charts, or the printable report.
const AdultsPage = lazy(() => import('@/pages/adults/AdultsPage'));
const TeacherDashboard = lazy(() => import('@/pages/adults/TeacherDashboard'));
const ParentDashboard = lazy(() => import('@/pages/adults/ParentDashboard'));
const InsightsReport = lazy(() => import('@/pages/adults/InsightsReport'));

function Router() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-slate-50">
          <p className="text-slate-400 font-bold animate-pulse">Nyaya Nagri…</p>
        </div>
      }
    >
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/adults" component={AdultsPage} />
        <Route path="/adults/teacher" component={TeacherDashboard} />
        <Route path="/adults/parent" component={ParentDashboard} />
        <Route path="/adults/report" component={InsightsReport} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
