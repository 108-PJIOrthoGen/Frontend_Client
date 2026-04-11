import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { runLogoutAction, setRefreshTokenAction } from "@/redux/slice/accountSlice";
import { message } from "antd";
import { useEffect } from "react";

interface IProps {
    children: React.ReactNode
}
const LayoutApp = (props: IProps) => {
    const isRefreshToken = useAppSelector(state => state.account.isRefreshToken);
    const errorRefreshToken = useAppSelector(state => state.account.errorRefreshToken);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (isRefreshToken === true) {
            message.error(errorRefreshToken);
            dispatch(setRefreshTokenAction({ status: false, message: "" }));
            // Clear auth state — ProtectedRoute will handle the redirect to /login
            // and preserve the current location so the user returns after re-login
            dispatch(runLogoutAction({}));
        }
    }, [isRefreshToken]);

    return (
        <>
            {props.children}
        </>
    )
}
export default LayoutApp
