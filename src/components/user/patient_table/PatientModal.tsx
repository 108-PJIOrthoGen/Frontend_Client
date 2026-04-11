import { callCreatePatient, callUpdatePatient } from '@/apis/api';
import { IPatient } from '@/types/backend';
import { ModalForm } from '@ant-design/pro-components';
import {
  Col, DatePicker, Divider, Form, Input,
  message, notification, Row, Select, Typography,
} from 'antd';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/en_US';
import { useEffect } from 'react';

const { Text } = Typography;

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
  const isEdit = !!dataInit?.id;

  useEffect(() => {
    if (dataInit?.id) {
      form.setFieldsValue({
        ...dataInit,
        dateOfBirth: dataInit.dateOfBirth ? dayjs(dataInit.dateOfBirth) : undefined,
        insuranceExpired: dataInit.insuranceExpired ? dayjs(dataInit.insuranceExpired) : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [dataInit]);

  const handleReset = () => {
    form.resetFields();
    setDataInit(null);
    setOpenModalCreate(false);
  };

  const onFinish = async (values: any) => {
    const formatted = {
      ...values,
      dateOfBirth: values.dateOfBirth?.format('DD-MM-YYYY'),
      insuranceExpired: values.insuranceExpired?.format('DD-MM-YYYY'),
    };

    if (isEdit) {
      const res = await callUpdatePatient({ ...formatted, id: dataInit.id });
      if (res.data) {
        message.success('Cập nhật bệnh nhân thành công');
        handleReset();
        reloadTable();
      } else {
        notification.error({ message: 'Có lỗi xảy ra', description: res.message });
      }
    } else {
      const res = await callCreatePatient(formatted);
      if (res.data) {
        message.success('Thêm mới bệnh nhân thành công');
        handleReset();
        reloadTable();
      } else {
        notification.error({ message: 'Có lỗi xảy ra', description: res.message });
      }
    }
  };

  return (
    <ModalForm
      title={isEdit ? 'Cập nhật Bệnh nhân' : 'Tạo mới Bệnh nhân'}
      open={openModalCreate}
      modalProps={{
        onCancel: handleReset,
        afterClose: handleReset,
        destroyOnClose: true,
        width: 900,
        keyboard: false,
        maskClosable: false,
        okText: isEdit ? 'Cập nhật' : 'Tạo mới',
        cancelText: 'Hủy',
      }}
      scrollToFirstError={true}
      preserve={false}
      form={form}
      onFinish={onFinish}
    >
      <Divider orientation="left">
        <Text strong>Thông tin cá nhân</Text>
      </Divider>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            labelCol={{ span: 24 }}
            label="Họ tên đầy đủ"
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
          >
            <Input placeholder="Nhập họ tên" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            labelCol={{ span: 24 }}
            label="Ngày sinh"
            name="dateOfBirth"
            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
          >
            <DatePicker
              locale={locale}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày sinh"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            labelCol={{ span: 24 }}
            label="Giới tính"
            name="gender"
            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
          >
            <Select
              placeholder="Chọn giới tính"
              options={[
                { value: 'male', label: 'Nam' },
                { value: 'female', label: 'Nữ' },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            labelCol={{ span: 24 }}
            label="Số CCCD"
            name="identityCard"
            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
          >
            <Input placeholder="Nhập số CCCD" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            labelCol={{ span: 24 }}
            label="Số điện thoại"
            name="phone"
            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            labelCol={{ span: 24 }}
            label="Nghề nghiệp"
            name="career"
            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
          >
            <Input placeholder="Nhập nghề nghiệp" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            labelCol={{ span: 24 }}
            label="Dân tộc"
            name="ethnicity"
            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
          >
            <Input placeholder="Nhập dân tộc" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            labelCol={{ span: 24 }}
            label="Quốc tịch"
            name="nationality"
            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
          >
            <Input placeholder="Nhập quốc tịch" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            labelCol={{ span: 24 }}
            label="Địa chỉ thường trú"
            name="address"
            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
          >
            <Input placeholder="Nhập địa chỉ" />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">
        <Text strong>Bảo hiểm y tế</Text>
      </Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            labelCol={{ span: 24 }}
            label="Số thẻ BHYT"
            name="insuranceNumber"
            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
          >
            <Input placeholder="Nhập số thẻ BHYT" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            labelCol={{ span: 24 }}
            label="BHYT có giá trị đến ngày"
            name="insuranceExpired"
            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
          >
            <DatePicker
              locale={locale}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày hết hạn"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">
        <Text strong>Thông tin người thân</Text>
      </Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            labelCol={{ span: 24 }}
            label="Tên người thân"
            name={['relativeInfo', 'name']}
            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
          >
            <Input placeholder="Nhập tên người thân" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            labelCol={{ span: 24 }}
            label="Số điện thoại người thân"
            name={['relativeInfo', 'phone']}
            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
          >
            <Input placeholder="Nhập SĐT người thân" />
          </Form.Item>
        </Col>
      </Row>
    </ModalForm>
  );
};

export default MPatientCreateAndUpdate;