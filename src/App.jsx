import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <React.Fragment />;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
    <Layout currentPageName={currentPageName}>{children}</Layout>
    : <>{children}</>;

// Pages that are publicly browsable without logging in.
// Content inside them still gates premium actions via ContentGate.
const PUBLIC_PAGES = new Set([
    'Home', 'Explore', 'Search', 'PodcastDetail', 'Creators', 'CreatorProfile',
]);

/** Require authentication — redirect to /Login if not signed in */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoadingAuth } = useAuth();

    if (isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#0C100E]">
                <div className="w-8 h-8 border-4 border-[#C2AD90]/30 border-t-[#C2AD90] rounded-full animate-spin" />
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/Login" replace />;
};

/** Auth pages (Login / SignUp) — redirect away if already signed in */
const AuthPageRoute = ({ children }) => {
    const { isAuthenticated, isLoadingAuth } = useAuth();
    if (isLoadingAuth) return null;
    return isAuthenticated ? <Navigate to="/Home" replace /> : children;
};

const AuthenticatedApp = () => {
    const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

    if (isLoadingPublicSettings || isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#0C100E]">
                <div className="w-8 h-8 border-4 border-[#C2AD90]/30 border-t-[#C2AD90] rounded-full animate-spin" />
            </div>
        );
    }

    if (authError && authError.type === 'user_not_registered') {
        return <UserNotRegisteredError />;
    }

    return (
        <Routes>
            {/* ── Public auth routes (no Layout) ────────────────────── */}
            <Route path="/Login" element={<AuthPageRoute><Login /></AuthPageRoute>} />
            <Route path="/SignUp" element={<AuthPageRoute><SignUp /></AuthPageRoute>} />

            {/* ── Root → Home (public) ───────────────────────────────── */}
            <Route
                path="/"
                element={
                    <LayoutWrapper currentPageName={mainPageKey}>
                        <MainPage />
                    </LayoutWrapper>
                }
            />

            {/* ── Registered app pages ───────────────────────────────── */}
            {Object.entries(Pages).map(([path, Page]) => {
                const isPublic = PUBLIC_PAGES.has(path);
                const pageEl = (
                    <LayoutWrapper currentPageName={path}>
                        <Page />
                    </LayoutWrapper>
                );
                return (
                    <Route
                        key={path}
                        path={`/${path}`}
                        element={isPublic ? pageEl : <ProtectedRoute>{pageEl}</ProtectedRoute>}
                    />
                );
            })}

            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};


function App() {
    return (
        <AuthProvider>
            <QueryClientProvider client={queryClientInstance}>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <NavigationTracker />
                    <AuthenticatedApp />
                </Router>
                <Toaster />
            </QueryClientProvider>
        </AuthProvider>
    )
}

export default App
