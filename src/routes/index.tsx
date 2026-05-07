import { LayoutClient } from "@/layouts/LayoutClient";
import { createBrowserRouter } from "react-router-dom";

import LoginPage from "@/pages/auth/LoginPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
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
        element: <LayoutApp>
            <LayoutAdmin />
        </LayoutApp>,
        errorElement: <Error404 />,
        children: [
            {
                index: true,
                element: <ProtectedRoute><AdminHome /></ProtectedRoute>
            },
            {
                path: "table-users",
                element: <ProtectedRoute><UserPage /></ProtectedRoute>
            },
            {
                path: "table-role",
                element: <ProtectedRoute><RolePage /></ProtectedRoute>
            },
            {
                path: "table-permission",
                element:
                    <ProtectedRoute><PermissionPage /></ProtectedRoute>
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
]);
export default router
