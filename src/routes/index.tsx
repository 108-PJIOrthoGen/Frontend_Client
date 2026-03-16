import { LayoutClient } from "@/layouts/LayoutClient";
import { createBrowserRouter } from "react-router-dom";
import { PatientProvider } from "@/context/PatientContext";
import LoginPage from "@/pages/auth/LoginPage";
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

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <PatientProvider>
                <LayoutClient />
            </PatientProvider>
        ), // thêm layoutApp sau
        errorElement: <Error404 />,
        children: [
            {
                index: true,
                element: <AiDiagnosisSuggestion />
            },
            {
                path: "table-patients",
                element: <PatientTable />
            },

            {
                path: "chart-testing",
                element: <ChartTesting />
            },
            {
                path: "compare-result",
                element: <CompareResult />
            },

        ]
    },
    {
        path: "/admin",
        element: <LayoutAdmin />,
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
                element:
                    <PermissionPage />
            },
        ]
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
]);
export default router