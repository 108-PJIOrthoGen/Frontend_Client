import { callDeletePatient, callFetchPatientById, callFetchEpisodesByPatient } from '@/apis/api';
import DataTable from '@/components/DataTable';
import MPatientCreateAndUpdate from '@/components/user/patient_table/manage/PatientModal';
import ManageMedicalDrawer from '@/components/user/patient_table/manage/ManageMedicalDrawer';
import { ALL_PERMISSIONS } from '@/constants/permission';
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { fetchPatient, setCurrentCase } from '@/redux/features/patients/patientSlice';
import { IModelPaginate, IPatient } from '@/types/backend';
import { DeleteOutlined, EditOutlined, FolderOpenOutlined, LineChartOutlined, MoreOutlined, PlusOutlined, UserOutlined } from "@ant-design/icons";
import { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, Card, Dropdown, message, Modal, notification, type MenuProps } from "antd";
import dayjs from "dayjs";
import queryString from "query-string";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sfLike } from "spring-filter-query-builder";

const PatientTable = () => {

    const [modal, modalContextHolder] = Modal.useModal();
    const [dataInit, setDataInit] = useState<IPatient | null>(null);
    const [openModalCreate, setOpenModalCreate] = useState<boolean>(false);
    const [openMedicalDrawer, setOpenMedicalDrawer] = useState<boolean>(false);
    // Deep-link target from the sidebar pending-tasks notification:
    // /table-patients?patientId&episodeId&tab=pending
    const [deepLink, setDeepLink] = useState<{ episodeId?: number; tab?: string } | null>(null);

    const tableRef = useRef<ActionType>(null);
    const location = useLocation();
    const navigate = useNavigate();

    // const isFetching = useAppSelector((state) => state.patient.isFetching);
    const meta = useAppSelector((state) => state.patient.meta);
    const users = useAppSelector((state) => state.patient.result);
    const permissions = useAppSelector((state) => state.account.user.role.permissions);
    const dispatch = useAppDispatch();

    const aclDisabled = import.meta.env.VITE_ACL_ENABLE === 'false';
    const hasPermission = (required: { apiPath: string; method: string; module: string }) => (
        aclDisabled
        || !permissions?.length
        || permissions.some((permission) => (
            permission.apiPath === required.apiPath
            && permission.method === required.method
            && permission.module === required.module
        ))
    );

    // Open an AI feature scoped to a patient:
    // resolve their most recent episode, load it as the current case, then
    // navigate — the target page reads currentCase and shows the right data.
    const openAiFeatureForPatient = async (patient: IPatient, path: string) => {
        if (!patient?.id) return;
        try {
            const res = await callFetchEpisodesByPatient(
                String(patient.id), 'page=0&size=1&sort=createdAt,desc',
            );
            const episode = res?.data?.result?.[0];
            if (!episode) {
                message.warning('Bệnh nhân này chưa có bệnh án nào.');
                return;
            }
            dispatch(setCurrentCase({ patient, episode }));
            navigate(path);
        } catch {
            message.error('Không thể tải bệnh án của bệnh nhân');
        }
    };

    const handleDeleteUser = async (id: string | undefined) => {
        if (id) {
            const res = await callDeletePatient(id);
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

    const confirmDeletePatient = (patient: IPatient) => {
        modal.confirm({
            title: 'Xác nhận xóa bệnh nhân',
            content: `Bạn có chắc chắn muốn xóa ${patient.fullName || 'bệnh nhân này'}?`,
            icon: <DeleteOutlined className="text-red-500" />,
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: () => handleDeleteUser(patient.id),
        });
    };

    const getPatientActionItems = (patient: IPatient): MenuProps['items'] => {
        const items: MenuProps['items'] = [];

        if (hasPermission(ALL_PERMISSIONS.PATIENTS.UPDATE)) {
            items.push({
                key: 'edit',
                icon: <EditOutlined className="text-amber-600" />,
                label: 'Sửa thông tin bệnh nhân',
                onClick: () => {
                    setOpenModalCreate(true);
                    setDataInit(patient);
                },
            });
        }

        items.push({
            key: 'inflammation-chart',
            icon: <LineChartOutlined className="text-sky-600" />,
            label: 'Chỉ số viêm',
            onClick: () => openAiFeatureForPatient(patient, '/chart-testing'),
        });

        if (hasPermission(ALL_PERMISSIONS.PATIENTS.DELETE)) {
            items.push(
                { type: 'divider' },
                {
                    key: 'delete',
                    danger: true,
                    icon: <DeleteOutlined />,
                    label: 'Xóa bệnh nhân',
                    onClick: () => confirmDeletePatient(patient),
                },
            );
        }

        return items;
    };

    const reloadTable = () => {
        tableRef?.current?.reload();
    };

    // Honour a deep link from the pending-tasks notification: load the patient,
    // open their medical drawer, and ask it to jump straight to the episode +
    // pending tab. The query string is cleared so a reload doesn't re-trigger.
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const patientId = params.get('patientId');
        const episodeId = params.get('episodeId');
        if (!patientId) return;
        (async () => {
            try {
                const res = await callFetchPatientById(patientId);
                if (res?.data) {
                    setDataInit(res.data);
                    setDeepLink({
                        episodeId: episodeId ? Number(episodeId) : undefined,
                        tab: params.get('tab') ?? undefined,
                    });
                    setOpenMedicalDrawer(true);
                }
            } catch {
                message.error('Không thể mở bệnh án từ thông báo');
            } finally {
                navigate('/table-patients', { replace: true });
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    const columns: ProColumns<IPatient>[] = [
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
            title: "CCCD",
            dataIndex: "indetityCard",
            hidden: true
        },
        {
            title: "Họ & Tên",
            dataIndex: "fullName",
            sorter: true,
        },
        {
            title: "Mã BN",
            dataIndex: "patientCode",
            sorter: true,
        },
        {
            title: "id",
            dataIndex: "id",
            hidden: true
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
            title: "Số điện thoại",
            dataIndex: "phone",
            sorter: true,
        },
        {
            title: "Địa chỉ",
            dataIndex: "address",
            hidden: true
        },
        {
            title: "Insurance",
            dataIndex: "insuranceExpired",
            hidden: true
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
            title: "Bệnh án",
            hideInSearch: true,
            width: 118,
            align: "center",
            render: (_value, entity, _index, _action) => (
                <Button
                    type="text"
                    size="small"
                    icon={<FolderOpenOutlined />}
                    className="!inline-flex !items-center !text-blue-600 hover:!bg-blue-50"
                    onClick={() => {
                        setDataInit(entity);
                        setOpenMedicalDrawer(true);
                    }}
                >
                    Mở Bệnh Án
                </Button>
            ),
        },
        {
            title: "Thao tác",
            hideInSearch: true,
            width: 82,
            align: "center",
            render: (_value, entity, _index, _action) => (
                <Dropdown
                    trigger={['click']}
                    placement="bottomRight"
                    menu={{ items: getPatientActionItems(entity) }}
                >
                    <Button
                        type="text"
                        shape="circle"
                        icon={<MoreOutlined />}
                        aria-label={`Mở thao tác cho ${entity.fullName || 'bệnh nhân'}`}
                    />
                </Dropdown>
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
            {modalContextHolder}
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

                </div>

                <DataTable<IPatient>
                    actionRef={tableRef}
                    headerTitle="Danh sách bệnh nhân"
                    rowKey="id"
                    columns={columns}
                    dataSource={users}
                    request={async (params: any, sort: any, filter: any) => {
                        const query = buildQuery(params, sort, filter);
                        const res = await dispatch(fetchPatient({ query })).unwrap();
                        const page = res.data as IModelPaginate<IPatient> | undefined;
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
                                onClick={() => setOpenModalCreate(true)}
                            >
                                Thêm mới
                            </Button>

                        );
                    }}
                />
                <MPatientCreateAndUpdate
                    openModalCreate={openModalCreate}
                    setOpenModalCreate={setOpenModalCreate}
                    reloadTable={reloadTable}
                    dataInit={dataInit}
                    setDataInit={setDataInit}
                />
                <ManageMedicalDrawer
                    open={openMedicalDrawer}
                    onClose={() => {
                        setOpenMedicalDrawer(false);
                        setDataInit(null);
                        setDeepLink(null);
                    }}
                    patient={dataInit}
                    initialEpisodeId={deepLink?.episodeId}
                    initialTab={deepLink?.tab === 'pending' ? '6' : undefined}
                />
            </Card>
        </div>
    );
};

export default PatientTable
