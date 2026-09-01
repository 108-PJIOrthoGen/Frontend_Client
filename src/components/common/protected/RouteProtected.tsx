import Error403 from "@/pages/errors/ForbiddenPage"
import { useAppSelector } from "@/redux/hook"
import { useLocation, useNavigate } from "react-router-dom"
import { Button, Result, Spin } from "antd"

/** Các role được phép dùng khu vực client ("/"). Khu vực /admin chỉ dành cho ADMIN. */
const CLIENT_ROLES = ['USER', 'ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST'];

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const RoleCheck = (props: ProtectedRouteProps) => {
    // Dùng useLocation thay vì window.location để re-render đúng khi SPA navigate.
    const { pathname } = useLocation();
    const isAdminPath = pathname.startsWith("/admin");
    const user = useAppSelector((state) => state.account.user)
    const userRole = user?.role?.name

    const allowed = props.allowedRoles?.length
        ? props.allowedRoles.includes(userRole)
        : isAdminPath
        ? userRole === 'ADMIN'
        : CLIENT_ROLES.includes(userRole);

    return allowed ? <>{props.children}</> : <Error403 />;
}

/**
 * Bọc quanh **layout cha** của một nhánh route (không chỉ page con) để khi
 * thiếu quyền thì cả layout (sider/header) không mount — 403 thay thế fullpage.
 */
const ProtectedRoute = (props: ProtectedRouteProps) => {
    const isAuthenticated = useAppSelector((state) => state.account.isAuthenticated)
    const isLoading = useAppSelector((state) => state.account.isLoading)
    const location = useLocation();
    const navigate = useNavigate();

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>
    }

    if (!isAuthenticated) {
        return (
            <Result
                status="warning"
                title="Yêu cầu đăng nhập"
                subTitle="Bạn phải đăng nhập để tiếp tục sử dụng chức năng này."
                extra={(
                    <Button
                        type="primary"
                        onClick={() => navigate('/login', { state: { from: location } })}
                    >
                        Đăng nhập
                    </Button>
                )}
            />
        );
    }

    return <RoleCheck allowedRoles={props.allowedRoles}>{props.children}</RoleCheck>;
}
export default ProtectedRoute;
