import DataTable from '@/components/DataTable';
import { IModelPaginate, IPatient } from '@/types/backend';
import { DeleteOutlined, EditOutlined, HomeOutlined, PlusOutlined, UserOutlined, UserSwitchOutlined } from "@ant-design/icons";
import { ActionType, ProColumns } from "@ant-design/pro-components";
import { Breadcrumb, Button, Card, message, notification, Popconfirm, Space } from "antd";
import dayjs from "dayjs";
import queryString from "query-string";
import { useRef, useState } from "react";
import { sfLike } from "spring-filter-query-builder";

const PatientTable = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [dataInit, setDataInit] = useState<IPatient | null>(null);
    const [openModalCreate, setOpenModalCreate] = useState<boolean>(false);
    const [openModalMex, setOpenModalMex] = useState<boolean>(false);

    const tableRef = useRef<ActionType>(null);

    // const isFetching = useAppSelector((state) => state.patient.isFetching);
    // const meta = useAppSelector((state) => state.patient.meta);
    // const users = useAppSelector((state) => state.patient.result);
    // const dispatch = useAppDispatch();

    // const handleDeleteUser = async (id: string | undefined) => {
    //     if (id) {
    //         const res = await callDeletePatient(id);
    //         if (+res.statusCode === 200) {
    //             message.success("Xóa User thành công");
    //             reloadTable();
    //         } else {
    //             notification.error({
    //                 message: "Có lỗi xảy ra",
    //                 description: res.message,
    //             });
    //         }
    //     }
    // };

    const reloadTable = () => {
        tableRef?.current?.reload();
    };

    const columns: ProColumns<IPatient>[] = [
        {
            title: "STT",
            key: "index",
            width: 20,
            align: "center",
            // render: (text, record, index) => {
            //     return <>{index + 1 + (meta.page - 1) * meta.pageSize}</>;
            // },
            hideInSearch: true,
        },
        {
            title: "Tìm CCCD",
            dataIndex: "indetityCard",
            hidden: true
        },
        {
            title: "SĐT",
            dataIndex: "phone",
            sorter: true,
        },
        {
            title: "Họ & Tên",
            dataIndex: "fullName",
            sorter: true,
        },
        {
            title: "id",
            dataIndex: "id",
            hideInSearch: true,
            hidden: true
        },
        {
            title: "Mã bệnh nhân",
            dataIndex: "patientCode",
            sorter: true,
        },

        {
            title: "Quốc tịnh",
            dataIndex: "nationality",
            hidden: true
        },

        {
            title: "Secret",
            dataIndex: "relativeName",
            hidden: true
        },
        {
            title: "Secret",
            dataIndex: "relativePhone",
            hidden: true
        },
        {
            title: "Địa chỉ",
            dataIndex: "address",
            sorter: true,
        },
        {
            title: "Insurance",
            dataIndex: "insuranceExpired",
            hidden: true
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

                    <UserSwitchOutlined
                        style={{
                            fontSize: 20,
                            color: "blue",
                        }}
                        type=""
                        onClick={() => {
                            setOpenModalCreate(true)
                            setDataInit(entity);
                        }}
                    />


                    <Popconfirm
                        placement="leftTop"
                        title={"Xác nhận xóa user"}
                        description={"Bạn có chắc chắn muốn xóa user này ?"}
                        // onConfirm={() => handleDeleteUser(entity.id)}
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
        if (clone.fullName) q.filter = `${sfLike("fullName", clone.fullName)}`;
        if (clone.identityCard) {
            q.filter = clone.fullName
                ? q.filter + " and " + `${sfLike("identityCard", clone.identityCard)}`
                : `${sfLike("identityCard", clone.identityCard)}`;
        }

        if (!q.filter) delete q.filter;
        let temp = queryString.stringify(q);

        let sortBy = "";
        if (sort && sort.fullName) {
            sortBy = sort.fullName === "ascend" ? "sort=fullName,asc" : "sort=fullName,desc";
        }
        if (sort && sort.identityCard) {
            sortBy = sort.identityCard === "ascend" ? "sort=identityCard,asc" : "sort=identityCard,desc";
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
        <div style={{ padding: "0 10px", marginTop: "10px" }}>


            {/* DataTable Card */}
            <Card
                style={{
                    borderRadius: "5px",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)"
                }}
            >
                {/* Header Section */}
                <div style={{ marginBottom: "24px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px"
                    }}>
                        <UserOutlined style={{ fontSize: "28px", color: "#1890ff" }} />
                        <h1 style={{
                            fontSize: "20px",
                            fontWeight: "600",
                            margin: "0",
                            color: "#262626"
                        }}>
                            Quản lý danh sách bệnh nhân
                        </h1>

                    </div>
                    <p style={{
                        marginBottom: "10px",
                        color: "#8c8c8c",
                        fontSize: "14px"
                    }}>
                        Quản lý thông tin và hồ sơ bệnh nhân, cập nhật dữ liệu y tế
                    </p>
                    <Breadcrumb
                        items={[
                            {
                                href: "/",
                                title: <HomeOutlined />,
                            },
                            {
                                title: "Quản lý bệnh án"
                            }
                        ]}
                        style={{ marginBottom: "16px" }}
                    />
                </div>

                <DataTable<IPatient>
                    actionRef={tableRef}
                    headerTitle="Danh sách bệnh nhân"
                    rowKey="id"
                    // loading={isFetching}
                    columns={columns}
                    // dataSource={users}
                    // request={async (params: any, sort: any, filter: any) => {
                    //     const query = buildQuery(params, sort, filter);
                    //     const res = await dispatch(fetchPatient({ query })).unwrap();
                    //     const page = res.data as IModelPaginate<IPatient> | undefined;
                    //     return {
                    //         data: page?.result ?? [],
                    //         total: page?.meta?.total ?? 0,
                    //         success: true,
                    //     };
                    // }}
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
                                onClick={() => setOpenModalCreate(true)}
                            >
                                Thêm mới
                            </Button>

                        );
                    }}
                />
                {/* <ManageMedical
                    openModal={openModal}
                    setOpenModal={setOpenModal}
                    setOpenModalCreate={setOpenModalCreate}
                    reloadTable={reloadTable}
                    dataInit={dataInit}
                    setDataInit={setDataInit}
                />
                <MPatientCreateAndUpdate
                    openModalCreate={openModalCreate}
                    setOpenModalCreate={setOpenModalCreate}
                    reloadTable={reloadTable}
                    dataInit={dataInit}
                    setDataInit={setDataInit}
                /> */}
            </Card>
        </div>
    );
};

export default PatientTable