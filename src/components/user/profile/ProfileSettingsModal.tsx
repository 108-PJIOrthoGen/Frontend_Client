import { useEffect, useState } from "react";
import { Button, Form, Input, Modal, message, notification } from "antd";
import { KeyOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/redux/hook";
import { fetchAccount } from "@/redux/slice/accountSlice";
import { callUpdateOwnProfile } from "@/apis/api";
import ChangePasswordModal from "@/components/user/profile/ChangePasswordModal";

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
}

/**
 * Self-service profile editor surfaced from the user menu in LayoutClient.
 * Chỉ sửa fullName / phone / department qua PUT /auth/account — đổi mật khẩu
 * đi qua {@link ChangePasswordModal} (endpoint riêng, revoke session).
 * UserModal bên admin không còn liên quan tới flow này.
 */
const ProfileSettingsModal = ({ open, setOpen }: IProps) => {
    const dispatch = useAppDispatch();
    const accountUser = useSelector((state: any) => state.account?.user);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);

    useEffect(() => {
        if (open) {
            dispatch(fetchAccount());
        }
    }, [open, dispatch]);

    // Đồng bộ form mỗi khi mở modal hoặc fetchAccount trả dữ liệu mới.
    useEffect(() => {
        if (open && accountUser?.id) {
            form.setFieldsValue({
                fullName: accountUser.name,
                email: accountUser.email,
                phone: accountUser.phone,
                department: accountUser.department,
            });
        }
    }, [open, accountUser, form]);

    const handleClose = () => {
        form.resetFields();
        setOpen(false);
    };

    const handleSubmit = async () => {
        let values;
        try {
            values = await form.validateFields();
        } catch {
            return; // antd đã hiển thị lỗi từng field
        }
        setSubmitting(true);
        try {
            const res = await callUpdateOwnProfile({
                fullName: values.fullName,
                phone: values.phone,
                department: values.department,
                avatar: accountUser?.avatar,
            });
            if (+res?.status === 200) {
                message.success("Cập nhật thông tin thành công");
                dispatch(fetchAccount());
                handleClose();
            } else {
                notification.error({
                    message: "Có lỗi xảy ra",
                    description: res?.message ?? "Vui lòng thử lại sau.",
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Modal
                title="Cập nhật thông tin tài khoản"
                open={open}
                onCancel={handleClose}
                onOk={handleSubmit}
                okText="Lưu"
                cancelText="Hủy"
                confirmLoading={submitting}
                width={600}
                maskClosable={false}
                destroyOnClose
            >
                <Form form={form} layout="vertical" preserve={false}>
                    <Form.Item label="Email" name="email">
                        <Input disabled />
                    </Form.Item>
                    <Form.Item
                        label="Họ & Tên"
                        name="fullName"
                        rules={[{ required: true, message: "Vui lòng không bỏ trống" }]}
                    >
                        <Input placeholder="Nhập tên hiển thị" />
                    </Form.Item>
                    <Form.Item
                        label="Số điện thoại"
                        name="phone"
                        rules={[
                            { pattern: /^(\+?\d{1,3})?[\s.-]?\d{9,11}$/, message: "Số điện thoại không hợp lệ" },
                        ]}
                    >
                        <Input placeholder="Nhập số điện thoại" />
                    </Form.Item>
                    <Form.Item label="Khoa / Phòng ban" name="department">
                        <Input placeholder="Nhập khoa hoặc phòng ban" />
                    </Form.Item>
                </Form>
                <Button
                    icon={<KeyOutlined />}
                    onClick={() => setPasswordModalOpen(true)}
                >
                    Đổi mật khẩu
                </Button>
            </Modal>

            <ChangePasswordModal
                open={passwordModalOpen}
                setOpen={setPasswordModalOpen}
            />
        </>
    );
};

export default ProfileSettingsModal;
