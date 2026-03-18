import { useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { Layout, Drawer, Affix, Result } from "antd";

import { useSelector } from "react-redux";
import "../../public/main.scss";
import "../../public/responsive.scss";
import SideNav from "@/components/admin/SideNav";
import HeaderAdmin from "@/components/admin/HeaderAdmin";
import FooterAdmin from "@/components/admin/FooterAdmin";

const { Header: AntHeader, Content, Sider } = Layout;

const LayoutAdmin = () => {
    const [visible, setVisible] = useState(false);
    const [sidenavColor, setSideNavColor] = useState("#1890ff");
    const isAdminRoute = window.location.pathname.startsWith('/admin')
    const user = useSelector((state: any) => state.account.user);
    const isLoading = useSelector((state: any) => state.account.isLoading)
    const userRole = user?.role?.name;
    const [fixed, setFixed] = useState(false);


    const openDrawer = () => setVisible(!visible);
    const handleSidenavColor = (color: string) => setSideNavColor(color);
    const handleFixedNavbar = (type: boolean) => setFixed(type);

    let { pathname } = useLocation();
    pathname = pathname.replace("/", "");
    return isAdminRoute && (userRole === 'ADMIN' || userRole === 'NURSE' || userRole === 'DOCTOR' || userRole === 'RECEPTIONIST') ? (
        <Layout
            className={`layout-dashboard ${pathname === "profile" ? "layout-profile" : ""} `}
        >
            <Drawer
                title={false}
                placement={"right"}
                closable={false}
                onClose={() => setVisible(false)}
                key={"right"}
                width={250}
                className={`drawer-sidebar`}
            >
                <Layout
                    className={`layout-dashboard`}
                >
                    <Sider
                        trigger={null}
                        width={250}
                        theme="light"
                        className={`sider-primary ant-layout-sider-primary `}
                        style={{ background: "transparent" }}
                    >
                        <SideNav color={sidenavColor} />
                    </Sider>
                </Layout>
            </Drawer>


            <Sider
                breakpoint="lg"
                collapsedWidth="0"
                onCollapse={(collapsed, type) => {
                    console.log(collapsed, type);
                }}
                trigger={null}
                width={250}
                theme="light"
                className={`sider-primary ant-layout-sider-primary`}
                style={{ background: "transparent" }}
            >
                <SideNav color={sidenavColor} />
            </Sider>


            <Layout>
                <Affix>
                    <AntHeader className={`${fixed ? "ant-header-fixed" : ""}`}>
                        <HeaderAdmin
                            onPress={openDrawer}
                            name={pathname}
                            subName={pathname}
                            handleSidenavColor={handleSidenavColor}
                            handleFixedNavbar={handleFixedNavbar}
                        />
                    </AntHeader>
                </Affix>

                <Content className="content-ant">
                    <Outlet />
                </Content>

                <FooterAdmin />

            </Layout>
        </Layout>
    ) : <>
        {isLoading === false ?
            <Result
                status="403"
                title="Truy cập bị từ chối"
                subTitle="Xin lỗi, bạn không có quyền hạn (permission) truy cập thông tin này"
            />
            :
            <>
                {/* render nothing */}
            </>
        }
    </>;
}

export default LayoutAdmin