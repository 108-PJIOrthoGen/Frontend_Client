import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Avatar, Button, Form, Input, Modal, message, notification } from "antd";
import { CameraOutlined, KeyOutlined, UserOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/redux/hook";
import { fetchAccount } from "@/redux/slice/accountSlice";
import { callUpdateOwnProfile, callUpdateOwnProfileWithAvatar } from "@/apis/auth";
import ChangePasswordModal from "@/components/user/profile/ChangePasswordModal";

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
}

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Self-service profile editor surfaced from the user menu in LayoutClient.
 * Sửa fullName / phone / department và ảnh đại diện qua PUT /auth/account — đổi mật khẩu
 * đi qua {@link ChangePasswordModal} (endpoint riêng, revoke session).
 * UserModal bên admin không còn liên quan tới flow này.
 */
const ProfileSettingsModal = ({ open, setOpen }: IProps) => {
    const dispatch = useAppDispatch();
    const accountUser = useSelector((state: any) => state.account?.user);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => () => {
        if (avatarPreviewUrl) {
            URL.revokeObjectURL(avatarPreviewUrl);
        }
    }, [avatarPreviewUrl]);

    const resetAvatarSelection = () => {
        setAvatarFile(null);
        setAvatarPreviewUrl(null);
        if (avatarInputRef.current) {
            avatarInputRef.current.value = "";
        }
    };

    const handleClose = () => {
        form.resetFields();
        resetAvatarSelection();
        setOpen(false);
    };

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
            message.error("Ảnh đại diện phải có định dạng JPEG, PNG hoặc WEBP");
            event.target.value = "";
            return;
        }
        if (file.size > MAX_AVATAR_SIZE_BYTES) {
            message.error("Ảnh đại diện không được vượt quá 5 MB");
            event.target.value = "";
            return;
        }

        setAvatarFile(file);
        setAvatarPreviewUrl(URL.createObjectURL(file));
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
            const payload = {
                fullName: values.fullName,
                phone: values.phone,
                department: values.department,
            };
            const res = avatarFile
                ? await callUpdateOwnProfileWithAvatar(payload, avatarFile)
                : await callUpdateOwnProfile(payload);
            if (+res?.status === 200) {
                message.success("Cập nhật thông tin thành công");
                await dispatch(fetchAccount());
                handleClose();
            } else {
                notification.error({
                    message: "Có lỗi xảy ra",
                    description: res?.message ?? "Vui lòng thử lại sau.",
                });
            }
        } catch (error: any) {
            notification.error({
                message: "Không thể cập nhật tài khoản",
                description: error?.response?.data?.message ?? "Vui lòng thử lại sau.",
            });
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
                    <div className="mb-5 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <Avatar
                            size={72}
                            src={avatarPreviewUrl ?? accountUser?.avatar}
                            icon={<UserOutlined />}
                            className="shrink-0 bg-emerald-50 text-emerald-700"
                        />
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-800">Ảnh đại diện</div>
                            <div className="mb-2 text-xs text-slate-500">
                                JPEG, PNG hoặc WEBP, tối đa 5 MB
                            </div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleAvatarChange}
                                className="hidden"
                                aria-label="Chọn ảnh đại diện"
                            />
                            <Button
                                type="default"
                                icon={<CameraOutlined />}
                                onClick={() => avatarInputRef.current?.click()}
                            >
                                {avatarFile ? "Chọn ảnh khác" : "Chọn ảnh"}
                            </Button>
                            {avatarFile ? (
                                <div className="mt-2 truncate text-xs text-slate-600" title={avatarFile.name}>
                                    {avatarFile.name}
                                </div>
                            ) : null}
                        </div>
                    </div>
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
