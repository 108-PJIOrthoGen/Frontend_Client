import { Form, Input, Modal, message, notification } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/redux/hook";
import { runLogoutAction } from "@/redux/slice/accountSlice";
import { callChangeOwnPassword } from "@/apis/api";

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
}

/**
 * Self-service password change. Backend (POST /auth/change-password) yêu cầu
 * mật khẩu hiện tại và revoke toàn bộ refresh token / session sau khi đổi,
 * nên submit thành công sẽ logout cục bộ và đưa user về trang đăng nhập.
 */
const ChangePasswordModal = ({ open, setOpen }: IProps) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

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
            const res = await callChangeOwnPassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });
            if (+res?.status === 200) {
                handleClose();
                // Backend đã revoke refresh token + xoá cookie — chỉ cần dọn state local.
                dispatch(runLogoutAction(null));
                message.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
                navigate("/login");
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
        <Modal
            title="Đổi mật khẩu"
            open={open}
            onCancel={handleClose}
            onOk={handleSubmit}
            okText="Đổi mật khẩu"
            cancelText="Hủy"
            confirmLoading={submitting}
            width={480}
            maskClosable={false}
            destroyOnClose
        >
            <p style={{ color: "#64748b", marginBottom: 16 }}>
                Sau khi đổi mật khẩu, bạn sẽ bị đăng xuất khỏi tất cả các thiết bị
                và cần đăng nhập lại.
            </p>
            <Form form={form} layout="vertical" preserve={false}>
                <Form.Item
                    label="Mật khẩu hiện tại"
                    name="currentPassword"
                    rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu hiện tại" />
                </Form.Item>
                <Form.Item
                    label="Mật khẩu mới"
                    name="newPassword"
                    rules={[
                        { required: true, message: "Vui lòng nhập mật khẩu mới" },
                        { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" },
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Ít nhất 8 ký tự" />
                </Form.Item>
                <Form.Item
                    label="Xác nhận mật khẩu mới"
                    name="confirmPassword"
                    dependencies={["newPassword"]}
                    rules={[
                        { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue("newPassword") === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                            },
                        }),
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ChangePasswordModal;
