import Error403 from "@/pages/errors/ForbiddenPage"
import { useAppSelector } from "@/redux/hook"
import { Navigate, useLocation } from "react-router-dom"
import { Spin } from "antd"


const RoleCheck = (props) => {
    const isAdmin = window.location.pathname.startsWith("/admin")
    const user = useAppSelector((state) => state.account.user)
    const userRole = user?.role?.name
    if ((isAdmin && (userRole === 'ADMIN' || userRole === 'DOCTOR' || userRole === 'NURSE'))
        || !isAdmin && (userRole === 'USER' || userRole === 'ADMIN' || userRole === 'DOCTOR' || userRole === 'NURSE')) {
        return (<>{props.children}</>)
    } else {
        return (<Error403 />)
    }
}

const ProtectedRoute = (props) => {
    const isAuthenticated = useAppSelector((state) => state.account.isAuthenticated)
    const isLoading = useAppSelector((state) => state.account.isLoading)
    console.log(isAuthenticated)
    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>
    }

    return (
        <>
            {isAuthenticated === true ?
                <>
                    <RoleCheck>{props.children}</RoleCheck>
                </> : <Navigate to="/login" replace={true} />
            }
        </>
    )
}
export default ProtectedRoute;