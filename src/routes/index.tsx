import { LayoutClient } from "@/layouts/LayoutClient";
import { createBrowserRouter } from "react-router-dom";
import { PatientProvider } from "@/context/PatientContext";
import LoginPage from "@/pages/auth/LoginPage";
import AiDiagnosisSuggestion from "@/pages/user/AiDiagnoseSuggestion";
import Error404 from "@/pages/errors/NotFoundPage";
import PatientTable from "@/pages/user/PatientTable";
import ChartTesting from "@/pages/user/ChartTesting";
import CompareResult from "@/pages/user/CompareResult";

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
    // {
    //     path: "/admin",
    //     element: <LayoutApp><LayoutAdmin /></LayoutApp>,
    //     errorElement: <Error404 />,
    //     children: [
    //         {
    //             index: true,
    //             element:
    //                 <ProtectedRoute>
    //                     <AdminHome />
    //                 </ProtectedRoute>

    //         },
    //         {
    //             path: "table-patients",
    //             element:
    //                 <ProtectedRoute>
    //                     <PatientTable />
    //                 </ProtectedRoute>

    //         },

    //         {
    //             path: "table-users",
    //             element:
    //                 <ProtectedRoute>
    //                     <UserPage />
    //                 </ProtectedRoute>

    //         },
    //         {
    //             path: "table-role",
    //             element:
    //                 <ProtectedRoute>
    //                     <RolePage />
    //                 </ProtectedRoute>

    //         },
    //         {
    //             path: "table-permission",
    //             element:
    //                 <ProtectedRoute>
    //                     <PermissionPage />
    //                 </ProtectedRoute>

    //         },
    //     ]
    // },
    {
        path: "/login",
        element: <LoginPage />,
    },
]);
export default router