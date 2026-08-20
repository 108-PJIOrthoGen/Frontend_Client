import DataTable from "@/components/DataTable";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchUser } from "@/redux/features/admin/users/userSlice";
import { IUser } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm, Space, Switch, Tag, message, notification } from "antd";
import { useState, useRef } from "react";
import dayjs from "dayjs";
import ModalUser from "./components/UserModal";
import ViewDetailUser from "./components/UserView";
import { buildTableQuery } from "../shared/tableQuery";
import Access from "@/components/common/Access";
import { ALL_PERMISSIONS } from "@/constants/permission";
import { sfLike } from "spring-filter-query-builder";
import { callDeleteUser, callUpdateUser } from "@/apis/users";

const UserPage = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [dataInit, setDataInit] = useState<IUser | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);

    const tableRef = useRef<ActionType>(null);

    const isFetching = useAppSelector((state) => state.user.isFetching);
    const meta = useAppSelector((state) => state.user.meta);
    const users = useAppSelector((state) => state.user.result);
    const dispatch = useAppDispatch();

    const handleDeleteUser = async (id: string | undefined) => {
        if (id) {
            const res = await callDeleteUser(id);
            if (+res.status === 200) {
                message.success("Xóa User thành công");
                reloadTable();
            } else {
                notification.error({
                    message: "Có lỗi xảy ra",
                    description: res.message,
                });
            }
        }
    };

    const handleToggleActive = async (record: IUser, checked: boolean) => {
        if (!record.id) return;
        const payload: IUser = {
            id: record.id,
            fullName: record.fullName,
            email: record.email,
            phone: record.phone,
            department: record.department,
            avatar: record.avatar,
            status: checked ? "ACTIVE" : "INACTIVE",
            role: record.role
                ? { id: record.role.id, name: record.role.name }
                : undefined,
        };
        const res = await callUpdateUser(payload);
        if (+res.status === 200 || res.data) {
            message.success(checked ? "Đã kích hoạt user" : "Đã ngưng user");
            reloadTable();
        } else {
            notification.error({
                message: "Có lỗi xảy ra",
                description: res.message,
            });
        }
    };

    const reloadTable = () => {
        tableRef?.current?.reload();
    };

    const columns: ProColumns<IUser>[] = [
        {
            title: "STT",
            key: "index",
            width: 20,
            align: "center",
            render: (text, record, index) => {
                return <>{index + 1 + (meta.page - 1) * meta.pageSize}</>;
            },
            search: false,
        },
        {
            title: "Họ và tên",
            dataIndex: "fullName",
            sorter: true,
        },
        {
            title: "Email",
            dataIndex: "email",
            sorter: true,
        },

        {
            title: "Vai trò",
            dataIndex: ["role", "name"],
            sorter: true,
            search: false,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 140,
            search: false,
            align: "center",
            render: (_text, record) => {
                const isActive = record.status === "ACTIVE";
                return (
                    <Space size="small" direction="vertical" align="center">
                        <Switch
                            checked={isActive}
                            onChange={(checked) => handleToggleActive(record, checked)}
                            checkedChildren="ON"
                            unCheckedChildren="OFF"
                        />
                        {record.status === "NONE" && (
                            <Tag color="default">Chưa kích hoạt</Tag>
                        )}
                    </Space>
                );
            },
        },
        {
            title: "Đăng nhập gần nhất",
            dataIndex: "lastLogin",
            width: 200,
            sorter: true,
            search: false,
            render: (_text, record) => (
                <>
                    {record.lastLogin
                        ? dayjs(record.lastLogin).format("DD-MM-YYYY HH:mm:ss")
                        : "Chưa đăng nhập"}
                </>
            ),
        },

        {
            title: "Thời gian tạo",
            dataIndex: "createdAt",
            width: 200,
            sorter: true,
            render: (text, record, index, action) => {
                return (
                    <>
                        {record.createdAt
                            ? dayjs(record.createdAt).format("DD-MM-YYYY HH:mm:ss")
                            : ""}
                    </>
                );
            },
            search: false,
        },
        {
            title: "Thời gian cập nhật",
            dataIndex: "updatedAt",
            width: 200,
            sorter: true,
            render: (text, record, index, action) => {
                return (
                    <>
                        {record.updatedAt
                            ? dayjs(record.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                            : ""}
                    </>
                );
            },
            search: false,
        },
        {
            title: "Actions",
            search: false,
            width: 50,
            render: (_value, entity, _index, _action) => (
                <Space>
                    <Access permission={ALL_PERMISSIONS.USERS.UPDATE} hideChildren>
                        <EditOutlined
                            style={{
                                fontSize: 20,
                                color: "#ffa500",
                            }}
                            type=""
                            onClick={() => {
                                setOpenModal(true);
                                setDataInit(entity);
                            }}
                        />
                    </Access>

                    <Access permission={ALL_PERMISSIONS.USERS.DELETE} hideChildren>
                        <Popconfirm
                            placement="leftTop"
                            title={"Xác nhận xóa user"}
                            description={"Bạn có chắc chắn muốn xóa user này ?"}
                            onConfirm={() => handleDeleteUser(entity.id)}
                            okText="Xác nhận"
                            cancelText="Hủy"
                        >
                            <span style={{ cursor: "pointer", margin: "0 10px" }}>
                                <DeleteOutlined
                                    style={{
                                        fontSize: 20,
                                        color: "#ff4d4f",
                                    }}
                                />
                            </span>
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    const buildQuery = (params: any, sort: any) => {
        const clone = { ...params };
        let filter = "";
        if (clone.name) filter = `${sfLike("name", clone.name)}`;
        if (clone.email) {
            filter = clone.name
                ? filter + " and " + `${sfLike("email", clone.email)}`
                : `${sfLike("email", clone.email)}`;
        }

        return buildTableQuery({
            params,
            sort,
            filter,
            sortableFields: [
                "name",
                "email",
                "createdAt",
                "updatedAt",
                "lastLogin",
            ],
        });
    };

    return (
        <div>
            <Access permission={ALL_PERMISSIONS.USERS.GET_PAGINATE}>
                <DataTable<IUser>
                    actionRef={tableRef}
                    headerTitle="Danh sách Users"
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={users}
                    request={async (params: any, sort: any, filter: any) => {
                        const query = buildQuery(params, sort);
                        const page = await dispatch(fetchUser({ query })).unwrap();
                        return {
                            data: page.result,
                            total: page.meta.total,
                            success: true,
                        };
                    }}
                    scroll={{ x: true }}
                    pagination={{

                        showSizeChanger: true,

                        showTotal: (total, range) => {
                            return (
                                <div>
                                    {" "}
                                    {range[0]}-{range[1]} trên {total} rows
                                </div>
                            );
                        },
                    }}
                    rowSelection={false}
                    toolBarRender={(_action, _rows): any => {
                        return (
                            <Button
                                icon={<PlusOutlined />}
                                type="primary"
                                onClick={() => setOpenModal(true)}
                            >
                                Thêm mới
                            </Button>
                        );
                    }}
                />
            </Access>
            <ModalUser
                openModal={openModal}
                setOpenModal={setOpenModal}
                reloadTable={reloadTable}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
            <ViewDetailUser
                onClose={setOpenViewDetail}
                open={openViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </div>
    );
};

export default UserPage;
