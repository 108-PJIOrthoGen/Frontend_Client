import Error403 from "@/pages/errors/ForbiddenPage"
import { useAppSelector } from "@/redux/hook"
import { Navigate, useLocation } from "react-router-dom"
import { Spin } from "antd"

/** Các role được phép dùng khu vực client ("/"). Khu vực /admin chỉ dành cho ADMIN. */
const CLIENT_ROLES = ['USER', 'ADMIN', 'DOCTOR', 'NURSE'];

const RoleCheck = (props) => {
    // Dùng useLocation thay vì window.location để re-render đúng khi SPA navigate.
    const { pathname } = useLocation();
    const isAdminPath = pathname.startsWith("/admin");
    const user = useAppSelector((state) => state.account.user)
    const userRole = user?.role?.name

    const allowed = isAdminPath
        ? userRole === 'ADMIN'
        : CLIENT_ROLES.includes(userRole);

    return allowed ? <>{props.children}</> : <Error403 />;
}

/**
 * Bọc quanh **layout cha** của một nhánh route (không chỉ page con) để khi
 * thiếu quyền thì cả layout (sider/header) không mount — 403 thay thế fullpage.
 */
const ProtectedRoute = (props) => {
    const isAuthenticated = useAppSelector((state) => state.account.isAuthenticated)
    const isLoading = useAppSelector((state) => state.account.isLoading)
    const location = useLocation();

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>
    }

    return (
        <>
            {isAuthenticated === true ?
                <>
                    <RoleCheck>{props.children}</RoleCheck>
                </> : <Navigate to="/login" state={{ from: location }} replace={true} />
            }
        </>
    )
}
export default ProtectedRoute;
