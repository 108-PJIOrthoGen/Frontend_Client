import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import Error404 from "@/pages/errors/NotFoundPage";
import ProtectedRoute from "@/components/common/protected/RouteProtected";

const LayoutApp = lazy(() => import("@/components/common/LayoutApp"));
const LayoutClient = lazy(() => (
    import("@/layouts/LayoutClient").then(module => ({ default: module.LayoutClient }))
));
const LayoutAdmin = lazy(() => import("@/layouts/LayoutAdmin"));

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const VerifyDevicePage = lazy(() => import("@/pages/auth/VerifyDevicePage"));
const MobileUploadPage = lazy(() => import("@/pages/mobile/MobileUploadPage"));

const AiDiagnosisSuggestion = lazy(() => import("@/pages/user/AiDiagnoseSuggestion"));
const PatientTable = lazy(() => import("@/pages/user/PatientTable"));
const ChartTesting = lazy(() => import("@/pages/user/ChartTesting"));
const ScenarioSimulator = lazy(() => import("@/pages/user/ScenarioSimulator"));
const AntibioticCarePlanner = lazy(() => import("@/pages/user/AntibioticCarePlanner"));

const AdminHome = lazy(() => import("@/pages/admin/AdminHome"));
const UserPage = lazy(() => import("@/pages/admin/UserTable"));
const RolePage = lazy(() => import("@/pages/admin/RoleTable"));
const PermissionPage = lazy(() => import("@/pages/admin/PermissionTable"));

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <LayoutApp>
                <LayoutClient />
            </LayoutApp>

        ),
        errorElement: <Error404 />,
        children: [
            {
                index: true,
                element: <ProtectedRoute><AiDiagnosisSuggestion /></ProtectedRoute>
            },
            {
                path: "table-patients",
                element: <ProtectedRoute><PatientTable /></ProtectedRoute>
            },

            {
                path: "chart-testing",
                element: <ProtectedRoute><ChartTesting /></ProtectedRoute>
            },
            {
                path: "scenario-simulator",
                element: <ProtectedRoute><ScenarioSimulator /></ProtectedRoute>
            },
            {
                path: "antibiotic-planner",
                element: <ProtectedRoute><AntibioticCarePlanner /></ProtectedRoute>
            },

        ]
    },
    {
        path: "/admin",
        // Guard đặt ở layout cha: thiếu quyền ADMIN thì cả sider/header không
        // mount, Error403 chiếm fullpage (children render trong Outlet nên
        // không cần bọc từng trang nữa).
        element: <LayoutApp>
            <ProtectedRoute>
                <LayoutAdmin />
            </ProtectedRoute>
        </LayoutApp>,
        errorElement: <Error404 />,
        children: [
            {
                index: true,
                element: <AdminHome />
            },
            {
                path: "table-users",
                element: <UserPage />
            },
            {
                path: "table-role",
                element: <RolePage />
            },
            {
                path: "table-permission",
                element: <PermissionPage />
            },
        ]
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
    },
    {
        path: "/verify-device",
        element: <VerifyDevicePage />,
    },
    {
        path: "/m/upload/:sessionId",
        element: <MobileUploadPage />,
    },
]);
export default router
