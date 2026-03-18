import { callCreatePatient, callUpdatePatient } from '@/apis/api';
import { IPatient } from '@/types/backend';
import { ModalForm } from '@ant-design/pro-components';
import { Col, DatePicker, DatePickerProps, Divider, Form, Input, message, Modal, notification, Row, Select } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

interface IProps {
    openModalCreate: boolean;
    setOpenModalCreate: (v: boolean) => void;
    dataInit?: IPatient | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

const MPatientCreateAndUpdate = (props: IProps) => {
    const { openModalCreate, setOpenModalCreate, reloadTable, dataInit, setDataInit } = props;
    const [form] = Form.useForm();
    useEffect(() => {
        if (dataInit) {
            form.setFieldsValue({
                dateOfBirth: dayjs(dataInit.dateOfBirth),
                insuranceExpired: dayjs(dataInit.insuranceExpired)
            });
        }
    }, [dataInit]);

    // const [isLoading, setIsLoading] = useState(false);
    const [isSubmit, setIsSubmit] = useState(false);

    const handleReset = async () => {
        form.resetFields();
        setDataInit(null);
        setOpenModalCreate(false);
    }

    const onFinish = async (values: any) => {
        const payload = {
            ...values,
            id: dataInit?.id,
            dateOfBirth: values.dateOfBirth.format("DD-MM-YYYY"),
            insuranceExpired: values.insuranceExpired.format("DD-MM-YYYY")
        }
        setIsSubmit(true);

        if (dataInit?.id) {
            //update
            const user = payload

            const res = await callUpdatePatient(user);
            if (res.data) {
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
            //create
            const user = {
                ...values,
                dateOfBirth: values.dateOfBirth.format("YYYY-MM-DD"),
                insuranceExpired: values.insuranceExpired.format("YYYY-MM-DD")
            }
            const res = await callCreatePatient(user);
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
    const onChangeDate: DatePickerProps['onChange'] = (date, dateString) => {
        console.log(date, dateString);
    };
    return (
        <>
            <ModalForm
                title={<>{dataInit?.id ? "Cập nhật Bệnh nhân" : "Tạo mới Bệnh nhân"}</>}
                open={openModalCreate}
                modalProps={{
                    onCancel: () => { handleReset() },
                    afterClose: () => handleReset(),
                    destroyOnClose: true,
                    width: 900,
                    keyboard: false,
                    maskClosable: false,
                    okText: <>{dataInit?.id ? "Cập nhật" : "Tạo mới"}</>,
                    cancelText: "Hủy"
                }}
                scrollToFirstError={true}
                preserve={false}
                form={form}
                onFinish={onFinish}
                initialValues={dataInit?.id ? dataInit : {}}
            >
                <Divider />

                <Form
                    form={form}
                    name="basic"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Row gutter={15}>
                        <Col span={8}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Họ tên đầy đủ"
                                name="fullName"
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                style={{ borderRadius: "5px" }}
                                label="Ngày sinh"
                                name="dateOfBirth"
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                            >
                                <DatePicker format={"DD/MM/YYYY"} onChange={onChangeDate} needConfirm />
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Số điện thoại"
                                name="phone"
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Quốc tịch"
                                name="nationality"
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Địa chỉ thường trú"
                                name="address"
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Số CCCD"
                                name="identityCard"
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Số thẻ BHYT"
                                name="insuranceNumber"
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="BHYT có giá trị đến ngày"
                                name="insuranceExpired"
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                            >
                                <DatePicker format={"DD/MM/YYYY"} onChange={onChangeDate} needConfirm />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Giới tính"
                                name="gender"
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                            >
                                <Select
                                    // onChange={onChange}
                                    options={[
                                        { value: 'MALE', label: <span>Nam</span> },
                                        { value: 'FEMALE', label: <span>Nữ</span> },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Nghề nghiệp"
                                name="career"
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Tên người thân"
                                name={["relativeInfo", "name"]}
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Số điện thoại người thân"
                                name={["relativeInfo", "phone"]}
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Dân tộc"
                                name="ethnicity"
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>

                    </Row>
                </Form>
            </ModalForm>
        </>
    )
}

export default MPatientCreateAndUpdate