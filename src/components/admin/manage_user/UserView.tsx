import { IUser } from "@/types/backend";
import { Badge, Descriptions, Drawer, Tag } from "antd";
import dayjs from "dayjs";

interface IProps {
    onClose: (v: boolean) => void;
    open: boolean;
    dataInit: IUser | null;
    setDataInit: (v: any) => void;
}

const statusColor: Record<string, string> = {
    ACTIVE: "green",
    INACTIVE: "red",
    NONE: "default",
};

const ViewDetailUser = (props: IProps) => {
    const { onClose, open, dataInit, setDataInit } = props;

    return (
        <>
            <Drawer
                title="Thông Tin User"
                placement="right"
                onClose={() => {
                    onClose(false);
                    setDataInit(null);
                }}
                open={open}
                width={"40vw"}
                maskClosable={false}
            >
                <Descriptions title="" bordered column={2} layout="vertical">
                    <Descriptions.Item label="Họ và tên">
                        {dataInit?.fullName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">{dataInit?.email}</Descriptions.Item>

                    <Descriptions.Item label="Số điện thoại">
                        {dataInit?.phone || "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Khoa / Phòng ban">
                        {dataInit?.department || "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Vai trò">
                        <Badge status="processing" text={<>{dataInit?.role?.name}</>} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        {dataInit?.status ? (
                            <Tag color={statusColor[dataInit.status] || "default"}>
                                {dataInit.status}
                            </Tag>
                        ) : (
                            "—"
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Đăng nhập gần nhất">
                        {dataInit?.lastLogin
                            ? dayjs(dataInit.lastLogin).format("DD-MM-YYYY HH:mm:ss")
                            : "Chưa đăng nhập"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">
                        {dataInit?.createdAt
                            ? dayjs(dataInit.createdAt).format("DD-MM-YYYY HH:mm:ss")
                            : ""}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày sửa">
                        {dataInit?.updatedAt
                            ? dayjs(dataInit.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                            : ""}
                    </Descriptions.Item>
                </Descriptions>
            </Drawer>
        </>
    );
};

export default ViewDetailUser;
