import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
    Layout, Menu, Button, Row, Col, Form, Input, Switch, message, notification, Typography,
} from "antd";
import signinbg from "../../../public/bvien108.jfif";
import { GithubOutlined, TwitterOutlined } from "@ant-design/icons";
import { useState } from "react";
import { runLoginAction } from "../../redux/slice/accountSlice";
import { loginAPI } from "@/apis/api";
import "../../../public/main.scss"
const { Title } = Typography;
const { Header, Footer, Content } = Layout;

const template = [
    <svg
        data-v-4ebdc598=""
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            data-v-4ebdc598=""
            d="M3 4C3 3.44772 3.44772 3 4 3H16C16.5523 3 17 3.44772 17 4V6C17 6.55228 16.5523 7 16 7H4C3.44772 7 3 6.55228 3 6V4Z"
            fill="#111827"
            className="fill-muted"
        ></path>
        <path
            data-v-4ebdc598=""
            d="M3 10C3 9.44771 3.44772 9 4 9H10C10.5523 9 11 9.44771 11 10V16C11 16.5523 10.5523 17 10 17H4C3.44772 17 3 16.5523 3 16V10Z"
            fill="#111827"
            className="fill-muted"
        ></path>
        <path
            data-v-4ebdc598=""
            d="M14 9C13.4477 9 13 9.44771 13 10V16C13 16.5523 13.4477 17 14 17H16C16.5523 17 17 16.5523 17 16V10C17 9.44771 16.5523 9 16 9H14Z"
            fill="#111827"
            className="fill-muted"
        ></path>
    </svg>,
];
const profile = [
    <svg
        data-v-4ebdc598=""
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            data-v-4ebdc598=""
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10ZM12 7C12 8.10457 11.1046 9 10 9C8.89543 9 8 8.10457 8 7C8 5.89543 8.89543 5 10 5C11.1046 5 12 5.89543 12 7ZM9.99993 11C7.98239 11 6.24394 12.195 5.45374 13.9157C6.55403 15.192 8.18265 16 9.99998 16C11.8173 16 13.4459 15.1921 14.5462 13.9158C13.756 12.195 12.0175 11 9.99993 11Z"
            fill="#111827"
            className="fill-muted"
        ></path>
    </svg>,
];


const LoginPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    // const navigate = useNavigate();
    // const dispatch = useDispatch();

    const onFinish = async (values) => {
        const { username, password } = values;
        setIsLoading(true);
        const res = await loginAPI(username, password);
        setIsLoading(false);
        if (res?.data) {
            localStorage.setItem('access_token', res.data.access_token);
            dispatch(runLoginAction(res.data.user))
            message.success("Đăng nhập thành công");
            navigate("/")
        } else {
            notification.error({
                message: "Có lỗi xảy ra",
                description: "Thông tin đăng nhập chưa chính xác!",
            })
        }
    };

    return (
        <>
            <Layout className="layout-default layout-signin">
                <Header style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="header-col header-brand">
                        <h5>108 PJI Clinical Decision Support</h5>
                    </div>
                    <div className="header-col header-nav ">
                        <Menu mode="horizontal" defaultSelectedKeys={["1"]}>
                            <Menu.Item key="1">
                                <Link to="/">
                                    {template}
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="2">
                                <Link to="/profile">
                                    {profile}
                                </Link>
                            </Menu.Item>
                        </Menu>
                    </div>
                    <div className="header-col header-btn">
                        <Button type="primary">Hệ thống hỗ trợ chẩn đoán với AI</Button>
                    </div>
                </Header>
                <Content className="signin">
                    <Row gutter={[24, 0]} justify="space-around">
                        <Col
                            xs={{ span: 24, offset: 0 }}
                            lg={{ span: 6, offset: 2 }}
                            md={{ span: 12 }}
                        >
                            <Title className="mb-15">Đăng nhập</Title>
                            <Title className="font-regular text-muted" level={5}>
                                Nhập thông tin tài khoản đã được cung cấp
                            </Title>
                            <Form
                                onFinish={onFinish}
                                layout="vertical"
                                className="row-col"
                                initialValues={{
                                    remember: true
                                }}
                            >
                                <Form.Item
                                    className="username"
                                    label="Email/username"
                                    name="username"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Hãy nhập chính xác email!",
                                        },
                                    ]}
                                >
                                    <Input placeholder="Email" />
                                </Form.Item>

                                <Form.Item
                                    className="username"
                                    label="Password"
                                    name="password"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Không để trống mật khẩu!",
                                        },
                                    ]}
                                >
                                    <Input.Password placeholder="Password" />
                                </Form.Item>

                                <Form.Item
                                    name="remember"
                                    className="aligin-center"
                                    valuePropName="checked"
                                >
                                    <Switch defaultChecked />
                                    Remember me
                                </Form.Item>

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        style={{ width: "100%" }}
                                    >
                                        Đăng nhập ngay
                                    </Button>
                                </Form.Item>
                                <p className="font-semibold text-muted">
                                    Tài khoản chỉ được cấp cho các bác sĩ.{" "}
                                    Không tự đăng ký.
                                </p>
                            </Form>
                        </Col>
                        <Col
                            className="sign-img"
                            style={{ padding: 12 }}
                            xs={{ span: 24 }}
                            lg={{ span: 12 }}
                            md={{ span: 12 }}
                        >
                            <img style={{ height: "300px", maxWidth: "90%" }} src={signinbg} alt="" />
                        </Col>
                    </Row>
                </Content>
                <Footer>
                    <Menu mode="horizontal">
                        <Menu.Item>About 108 PJI Clinical Decision Support</Menu.Item>
                        <Menu.Item>Teams</Menu.Item>
                        <Menu.Item>Blogs</Menu.Item>
                    </Menu>
                    <Menu mode="horizontal" className="menu-nav-social">
                        <Menu.Item>
                            <Link to="#">{<TwitterOutlined />}</Link>
                        </Menu.Item>
                        <Menu.Item>
                            <Link to="#">{<GithubOutlined />}</Link>
                        </Menu.Item>
                    </Menu>
                    <p className="copyright">
                        {" "}
                        Copyright © 2026 An production of HUST, developed by <a href="#pablo">HieuPahm-R2</a>.{" "}
                    </p>
                </Footer>
            </Layout>
        </>
    )
}

export default LoginPage