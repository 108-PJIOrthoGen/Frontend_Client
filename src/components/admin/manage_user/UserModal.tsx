import { ModalForm, ProForm, ProFormSelect, ProFormText } from "@ant-design/pro-components";
import { Col, Form, Row, message, notification } from "antd";
import { useState, useEffect } from "react";
import { callCreateUser, callFetchRole, callUpdateUser } from "@/apis/api";
import { DebounceSelect } from "./debounce.select";
import { IBackendRes, IUser } from "@/types/backend";


export type ModalUserMode = "admin" | "self";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IUser | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
    /**
     * "admin" (default) — full form, calls callCreateUser / callUpdateUser.
     * "self"  — restricted form (no role / status / email), routes the
     *           submit through {@link onSelfSubmit} instead of the admin API.
     */
    mode?: ModalUserMode;
    onSelfSubmit?: (payload: {
        fullName: string;
        phone?: string;
        department?: string;
        avatar?: string;
        currentPassword?: string;
        newPassword?: string;
    }) => Promise<IBackendRes<any>>;
}

export interface ISelect {
    label: string;
    value: string;
    key?: string;
}
const ModalUser = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit, onSelfSubmit } = props;
    const mode: ModalUserMode = props.mode ?? "admin";
    const isSelf = mode === "self";
    const [roles, setRoles] = useState<ISelect[]>([]);

    const [form] = Form.useForm();

    useEffect(() => {
        if (!isSelf && dataInit?.id) {
            if (dataInit.role) {
                setRoles([
                    {
                        label: dataInit.role?.name,
                        value: dataInit.role?.id,
                        key: dataInit.role?.id,
                    }
                ])
            }
        }
    }, [dataInit, isSelf]);

    const submitUser = async (valuesForm: any) => {
        if (isSelf) {
            const { fullName, phone, department, avatar, currentPassword, newPassword } = valuesForm;
            if (!onSelfSubmit) return;
            const res = await onSelfSubmit({
                fullName,
                phone,
                department,
                avatar,
                ...(newPassword ? { currentPassword, newPassword } : {}),
            });
            if (+res?.status === 200) {
                message.success("Cập nhật thông tin thành công");
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res?.message ?? 'Vui lòng thử lại sau.',
                });
            }
            return;
        }

        const { fullName, email, password, phone, department, status, role } = valuesForm;
        const basePayload = {
            fullName,
            email,
            phone,
            department,
            status: status ?? "ACTIVE",
            role: { id: role.value, name: "" },
        };
        if (dataInit?.id) {
            const user = {
                id: dataInit.id,
                ...basePayload,
                ...(password ? { password } : {}),
            }

            const res = await callUpdateUser(user as any);
            if (res.status) {
                message.success("Cập nhật user thành công");
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        } else {
            const user = {
                ...basePayload,
                password,
            }
            const res = await callCreateUser(user as any);
            if (res.data) {
                message.success("Thêm mới user thành công");
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        }
    }

    const handleReset = async () => {
        form.resetFields();
        setDataInit(null);
        setRoles([]);
        setOpenModal(false);
    }

    async function fetchRoleList(name: string): Promise<ISelect[]> {
        const res = await callFetchRole(`page=0&size=100&name=/${name}/i`);
        if (res && res.data) {
            const list = res.data.result;
            const temp = list.map(item => {
                return {
                    label: item.name as string,
                    value: item.id as string
                }
            })
            return temp;
        } else return [];
    }

    const title = isSelf
        ? "Cập nhật thông tin tài khoản"
        : (dataInit?.id ? "Cập nhật User" : "Tạo mới User");
    const okText = isSelf
        ? "Lưu"
        : (dataInit?.id ? "Cập nhật" : "Tạo mới");

    return (
        <>
            <ModalForm
                title={title}
                open={openModal}
                modalProps={{
                    onCancel: () => { handleReset() },
                    afterClose: () => handleReset(),
                    destroyOnClose: true,
                    width: isSelf ? 600 : 900,
                    keyboard: false,
                    maskClosable: false,
                    okText,
                    cancelText: "Hủy"
                }}
                scrollToFirstError={true}
                preserve={false}
                form={form}
                onFinish={submitUser}
                initialValues={dataInit?.id
                    ? {
                        ...dataInit,
                        status: dataInit.status ?? "ACTIVE",
                        role: !isSelf && dataInit.role
                            ? { label: dataInit.role.name, value: dataInit.role.id, key: dataInit.role.id }
                            : undefined,
                    }
                    : { status: "ACTIVE" }}
            >
                <Row gutter={16}>
                    <Col lg={isSelf ? 24 : 12} md={isSelf ? 24 : 12} sm={24} xs={24}>
                        <ProFormText
                            label="Họ & Tên"
                            name="fullName"
                            rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                            placeholder="Nhập tên hiển thị"
                        />
                    </Col>
                    {!isSelf && (
                        <Col lg={12} md={12} sm={24} xs={24}>
                            <ProFormText
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: 'Vui lòng không bỏ trống' },
                                    { type: 'email', message: 'Vui lòng nhập email hợp lệ' }
                                ]}
                                placeholder="Nhập email"
                            />
                        </Col>
                    )}
                    {!isSelf && (
                        <Col lg={12} md={12} sm={24} xs={24}>
                            <ProFormText.Password
                                disabled={dataInit?.id ? true : false}
                                label="Password"
                                name="password"
                                rules={[{ required: dataInit?.id ? false : true, message: 'Vui lòng không bỏ trống' }]}
                                placeholder="Nhập password"
                            />
                        </Col>
                    )}
                    <Col lg={isSelf ? 24 : 12} md={isSelf ? 24 : 12} sm={24} xs={24}>
                        <ProFormText
                            label="Số điện thoại"
                            name="phone"
                            rules={[
                                { required: !isSelf, message: 'Vui lòng không bỏ trống' },
                                { pattern: /^(\+?\d{1,3})?[\s.-]?\d{9,11}$/, message: 'Số điện thoại không hợp lệ' }
                            ]}
                            placeholder="Nhập số điện thoại"
                        />
                    </Col>
                    <Col lg={isSelf ? 24 : 12} md={isSelf ? 24 : 12} sm={24} xs={24}>
                        <ProFormText
                            label="Khoa / Phòng ban"
                            name="department"
                            rules={[{ required: !isSelf, message: 'Vui lòng không bỏ trống' }]}
                            placeholder="Nhập khoa hoặc phòng ban"
                        />
                    </Col>
                    {!isSelf && (
                        <Col lg={6} md={6} sm={24} xs={24}>
                            <ProFormSelect
                                name="status"
                                label="Trạng thái"
                                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                                options={[
                                    { label: 'Đang hoạt động', value: 'ACTIVE' },
                                    { label: 'Ngưng hoạt động', value: 'INACTIVE' },
                                    { label: 'Chưa kích hoạt', value: 'NONE' },
                                ]}
                            />
                        </Col>
                    )}
                    {!isSelf && (
                        <Col lg={6} md={6} sm={24} xs={24}>
                            <ProForm.Item
                                name="role"
                                label="Vai trò"
                                rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                            >
                                <DebounceSelect
                                    allowClear
                                    showSearch
                                    defaultValue={roles}
                                    value={roles}
                                    placeholder="Chọn vai trò"
                                    fetchOptions={fetchRoleList}
                                    onChange={(newValue: any) => {
                                        if (newValue?.length === 0 || newValue?.length === 1) {
                                            setRoles(newValue as ISelect[]);
                                        }
                                    }}
                                    style={{ width: '100%' }}
                                />
                            </ProForm.Item>
                        </Col>
                    )}
                    {isSelf && (
                        <>
                            <Col span={24}>
                                <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 500, color: '#475569' }}>
                                    Đổi mật khẩu (tùy chọn)
                                </div>
                            </Col>
                            <Col lg={12} md={12} sm={24} xs={24}>
                                <ProFormText.Password
                                    label="Mật khẩu hiện tại"
                                    name="currentPassword"
                                    placeholder="Để trống nếu không đổi mật khẩu"
                                />
                            </Col>
                            <Col lg={12} md={12} sm={24} xs={24}>
                                <ProFormText.Password
                                    label="Mật khẩu mới"
                                    name="newPassword"
                                    rules={[{ min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' }]}
                                    placeholder="Để trống nếu không đổi mật khẩu"
                                />
                            </Col>
                        </>
                    )}
                </Row>
            </ModalForm >
        </>
    )
}

export default ModalUser;
