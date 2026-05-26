import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/redux/hook";
import { fetchAccount } from "@/redux/slice/accountSlice";
import { callUpdateOwnProfile } from "@/apis/api";
import { IUser } from "@/types/backend";
import ModalUser from "@/components/admin/manage_user/UserModal";

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
}

/**
 * Self-service profile editor surfaced from the user menu in LayoutClient.
 * Reuses {@link ModalUser} in `mode="self"` so the same form layout/validation
 * powers both the admin user table and end-user profile edits — see UserModal.tsx
 * for the field-visibility logic.
 */
const ProfileSettingsModal = ({ open, setOpen }: IProps) => {
    const dispatch = useAppDispatch();
    const accountUser = useSelector((state: any) => state.account?.user);

    useEffect(() => {
        if (open) dispatch(fetchAccount());
    }, [open, dispatch]);

    const dataInit: IUser | null = accountUser?.id
        ? {
            id: accountUser.id,
            fullName: accountUser.name,
            email: accountUser.email,
            avatar: accountUser.avatar,
            phone: accountUser.phone,
            department: accountUser.department,
            role: accountUser.role,
        }
        : null;

    return (
        <ModalUser
            mode="self"
            openModal={open}
            setOpenModal={setOpen}
            dataInit={dataInit}
            setDataInit={() => { /* no-op for self mode */ }}
            reloadTable={() => { dispatch(fetchAccount()); }}
            onSelfSubmit={callUpdateOwnProfile}
        />
    );
};

export default ProfileSettingsModal;
