import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchAccount, setRefreshTokenAction } from "@/redux/slice/accountSlice";
import { message } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface IProps {
    children: React.ReactNode
}
const LayoutApp = (props: IProps) => {
    const isRefreshToken = useAppSelector(state => state.account.isRefreshToken);
    const errorRefreshToken = useAppSelector(state => state.account.errorRefreshToken);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (isRefreshToken === true) {
            localStorage.removeItem('access_token');
            message.error(errorRefreshToken);
            dispatch(setRefreshTokenAction({ status: false, message: "" }));
            navigate("/login", { replace: true });
        }
    }, [isRefreshToken]);

    return (
        <>
            {props.children}
        </>
    )
}
export default LayoutApp
