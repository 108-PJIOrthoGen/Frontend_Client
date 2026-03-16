import { useEffect, useState } from "react";
import { useAppSelector } from '@/redux/hook';
import { Result } from "antd";
import type { ReactNode } from "react";
import { IPermission } from "@/types/backend";

interface AccessProps {
    permission: IPermission;
    hideChildren?: boolean;
    children?: ReactNode;
}

const Access = (props: AccessProps) => {
    //set default: hideChildren = false => vẫn render children
    // hideChildren = true => ko render children, ví dụ hide button (button này check quyền)
    const { permission, hideChildren = false } = props;
    const [allow, setAllow] = useState<boolean>(true);

    const permissions = useAppSelector(state => state.account.user.role.permissions) as IPermission[] | undefined;

    useEffect(() => {
        if (permissions?.length) {
            const check = permissions.find((item: IPermission) =>
                item.apiPath === permission.apiPath
                && item.method === permission.method
                && item.module === permission.module
            )
            if (check) {
                setAllow(true)
            } else
                setAllow(false);
        }
    }, [permissions])

    return (
        <>
            {allow === true || import.meta.env.VITE_ACL_ENABLE === 'false' ?
                <>{props.children}</>
                :
                <>
                    {hideChildren === false ?
                        <Result
                            status="403"
                            title="Truy cập bị từ chối"
                            subTitle="Xin lỗi, bạn không có quyền hạn (permission) truy cập thông tin này"
                        />
                        :
                        <>
                            {/* render nothing */}
                        </>
                    }
                </>
            }
        </>

    )
}
export default Access