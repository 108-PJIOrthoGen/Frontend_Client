import { LayoutClient } from "@/layouts/LayoutClient";
import { createBrowserRouter } from "react-router-dom";

import LoginPage from "@/pages/auth/LoginPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import VerifyDevicePage from "@/pages/auth/VerifyDevicePage";
import AiDiagnosisSuggestion from "@/pages/user/AiDiagnoseSuggestion";
import Error404 from "@/pages/errors/NotFoundPage";
import PatientTable from "@/pages/user/PatientTable";
import ChartTesting from "@/pages/user/ChartTesting";
import CompareResult from "@/pages/user/CompareResult";
import LayoutApp from "@/components/common/LayoutApp";
import AdminHome from "@/pages/admin/AdminHome";
import UserPage from "@/pages/admin/UserTable";
import RolePage from "@/pages/admin/RoleTable";
import PermissionPage from "@/pages/admin/PermissionTable";
import LayoutAdmin from "@/layouts/LayoutAdmin";
import ProtectedRoute from "@/components/common/protected/RouteProtected";

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
                path: "compare-result",
                element: <ProtectedRoute><CompareResult /></ProtectedRoute>
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
]);
export default router
