import DataTable from "@/components/DataTable";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchUser } from "@/redux/slice/userSlice";
import { IModelPaginate, IUser } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm, Space, message, notification } from "antd";
import { useState, useRef } from "react";
import dayjs from "dayjs";
import queryString from "query-string";
import ModalUser from "@/components/admin/manage_user/UserModal";
import ViewDetailUser from "@/components/admin/manage_user/UserView";
import Access from "@/components/common/Access";
import { ALL_PERMISSIONS } from "@/constants/permission";
import { sfLike } from "spring-filter-query-builder";
import { callDeleteUser } from "@/apis/api";

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
            if (+res.statusCode === 200) {
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
            hideInSearch: true,
        },
        {
            title: "Username",
            dataIndex: "username",
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
            hideInSearch: true,
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
            hideInSearch: true,
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
            hideInSearch: true,
        },
        {
            title: "Actions",
            hideInSearch: true,
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

    const buildQuery = (params: any, sort: any, filter: any) => {
        const q: any = {
            page: (params.current || 1) - 1,
            size: params.pageSize,
            filter: "",
        };

        const clone = { ...params };
        if (clone.name) q.filter = `${sfLike("name", clone.name)}`;
        if (clone.email) {
            q.filter = clone.name
                ? q.filter + " and " + `${sfLike("email", clone.email)}`
                : `${sfLike("email", clone.email)}`;
        }

        if (!q.filter) delete q.filter;
        let temp = queryString.stringify(q);

        let sortBy = "";
        if (sort && sort.name) {
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";
        }
        if (sort && sort.email) {
            sortBy = sort.email === "ascend" ? "sort=email,asc" : "sort=email,desc";
        }
        if (sort && sort.createdAt) {
            sortBy =
                sort.createdAt === "ascend"
                    ? "sort=createdAt,asc"
                    : "sort=createdAt,desc";
        }
        if (sort && sort.updatedAt) {
            sortBy =
                sort.updatedAt === "ascend"
                    ? "sort=updatedAt,asc"
                    : "sort=updatedAt,desc";
        }

        //mặc định sort theo updated time
        if (Object.keys(sortBy).length === 0) {
            temp = `${temp}&sort=updatedAt,desc`;
        } else {
            temp = `${temp}&${sortBy}`;
        }

        return temp;
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
                        const query = buildQuery(params, sort, filter);
                        const res = await dispatch(fetchUser({ query })).unwrap();
                        const page = res.data as IModelPaginate<IUser> | undefined;
                        return {
                            data: page?.result ?? [],
                            total: page?.meta?.total ?? 0,
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
