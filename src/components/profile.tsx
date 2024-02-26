import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Skeleton, Spin, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailValidate, passwordRegx } from '../helpers';
import { useRelogin } from '../hooks';
import {
  getMerchantInfoReq,
  logoutReq,
  resetPassReq,
  updateMerchantInfoReq,
  uploadLogoReq,
} from '../requests';
import { IProfile, TMerchantInfo } from '../shared.types';
import { useMerchantInfoStore, useProfileStore } from '../stores';

const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const merchantInfoStore = useMerchantInfoStore();
  const [profile, setProfile] = useState<IProfile | null>(null);
  const profileStore = useProfileStore();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false); // page loading
  const [uploading, setUploading] = useState(false); // logo upload
  const [submitting, setSubmitting] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const togglePasswordModal = () => setResetPasswordModal(!resetPasswordModal);
  const [logoUrl, setLogoUrl] = useState('');
  const [merchantInfo, setMerchantInfo] = useState<TMerchantInfo | null>(null);
  const relogin = useRelogin();

  const getInfo = async () => {
    setLoading(true);
    try {
      const res = await getMerchantInfoReq();
      setLoading(false);
      const statusCode = res.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(res.data.message);
      }
      setMerchantInfo(res.data.data.MerchantInfo);
      setLogoUrl(res.data.data.MerchantInfo.companyLogo);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('err getting profile: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  const onFileUplaod = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let file;
    if (event.target.files && event.target.files.length > 0) {
      file = event.target.files[0];
    }
    if (file == null) {
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      message.error('Max logo file size: 4M.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await uploadLogoReq(formData);
      setUploading(false);
      console.log('upload res: ', res);
      const statusCode = res.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(res.data.message);
      }
      const logoUrl = res.data.data.url;
      form.setFieldValue('companyLogo', logoUrl);
      setLogoUrl(logoUrl);
    } catch (err) {
      setUploading(false);
      if (err instanceof Error) {
        console.log('err uploading logo: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  const onSubmit = async () => {
    const info = form.getFieldsValue();
    setSubmitting(true);
    try {
      const res = await updateMerchantInfoReq(info);
      console.log('update info res: ', res);
      setSubmitting(false);
      const statusCode = res.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(res.data.message);
      }
      message.success('Info Updated');
      merchantInfoStore.setMerchantInfo(res.data.data.MerchantInfo);
    } catch (err) {
      setSubmitting(false);
      if (err instanceof Error) {
        console.log('err getting profile: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  useEffect(() => {
    getInfo();
  }, []);

  return (
    <div>
      {resetPasswordModal && (
        <ResetPasswordModal
          closeModal={togglePasswordModal}
          email={profileStore.email}
        />
      )}
      {loading ? (
        <Spin
          spinning={loading}
          indicator={
            <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
          }
          fullscreen
        />
      ) : (
        merchantInfo && (
          <Form
            form={form}
            onFinish={onSubmit}
            name="basic"
            labelCol={{
              span: 10,
            }}
            wrapperCol={{
              span: 16,
            }}
            style={{
              maxWidth: 600,
            }}
            initialValues={merchantInfo}
            autoComplete="off"
          >
            <Form.Item
              label="Company Name"
              name="companyName"
              rules={[
                {
                  required: true,
                  message: 'Please input your company name!',
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Company Logo (< 4M)"
              name="companyLogo"
              rules={[
                {
                  required: true,
                  message: 'Please upload your company logo! (Max size: 4M)',
                },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (value != '') {
                      return Promise.resolve();
                    }
                    return Promise.reject();
                  },
                }),
              ]}
            >
              <label htmlFor="comapnyLogoURL" style={{ cursor: 'pointer' }}>
                {logoUrl == '' ? (
                  <div style={{ width: '48px', height: '48px' }}>
                    <Skeleton.Image
                      active={uploading}
                      style={{ width: '48px', height: '48px' }}
                    />
                  </div>
                ) : (
                  <img src={logoUrl} style={{ maxWidth: '64px' }} />
                )}
              </label>
            </Form.Item>
            <input
              type="file"
              accept="image/png, image/gif, image/jpeg"
              onChange={onFileUplaod}
              id="comapnyLogoURL"
              name="comapnyLogoURL"
              style={{ display: 'none' }}
            />

            <Form.Item
              label="Physical Address"
              name="address"
              rules={[
                {
                  required: true,
                  message: 'Please input your company address!',
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  required: true,
                  message: 'Please input your Email!',
                },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (emailValidate(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Invalid email address');
                  },
                }),
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                {
                  required: true,
                  message: 'Please input company phone!',
                },
              ]}
            >
              <Input />
            </Form.Item>

            <div className="mx-8 my-8 flex justify-center">
              <Button
                onClick={togglePasswordModal}
                disabled={submitting || uploading}
              >
                Change Password
              </Button>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <Button
                type="primary"
                onClick={form.submit}
                loading={submitting || uploading}
                disabled={submitting || uploading}
              >
                {uploading ? 'Uploading' : submitting ? 'Submiting' : 'Save'}
              </Button>
            </div>
          </Form>
        )
      )}
    </div>
  );
};

export default Index;

interface IResetPassProps {
  email: string;
  closeModal: () => void;
}
const ResetPasswordModal = ({ email, closeModal }: IResetPassProps) => {
  const relogin = useRelogin();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    localStorage.removeItem('merchantToken');
    try {
      await logoutReq();
      navigate(`${APP_PATH}login`, {
        state: { msg: 'Password reset succeeded, please relogin.' },
      });
    } catch (err) {
      if (err instanceof Error) {
        console.log('logout err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  const onConfirm = async () => {
    const formValues = form.getFieldsValue();
    setLoading(true);
    try {
      const res = await resetPassReq(
        formValues.oldPassword,
        formValues.newPassword,
      );
      setLoading(false);
      console.log('reset pass res: ', res);
      const code = res.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(res.data.message);
      }
      await logout();
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('reset password err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  return (
    <Modal
      title="Change Password"
      open={true}
      width={'640px'}
      footer={null}
      closeIcon={null}
    >
      <Form
        form={form}
        onFinish={onConfirm}
        //name="reset-password"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        // style={{ maxWidth: 640, width: 360 }}
        className="my-6"
        initialValues={{
          email,
          oldPassword: '',
          newPassword: '',
          newPassword2: '',
        }}
      >
        <Form.Item
          label="Old Password"
          name="oldPassword"
          rules={[
            {
              required: true,
              message: 'Please input your old password!',
            },
          ]}
        >
          <Input.Password />
        </Form.Item>

        {/* <div className="mb-4 flex justify-center text-red-500">{errMsg}</div> */}

        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[
            {
              required: true,
              message: 'Please input your new password!',
            },
            ({ getFieldValue }) => ({
              validator(rule, value) {
                if (getFieldValue('oldPassword') == value) {
                  return Promise.reject(
                    'New password should not be the same as old password.',
                  );
                }
                if (passwordRegx.test(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  '8-15 characters with lowercase, uppercase, numeric and special character(@ $ # ! % ? * &  ^)',
                );
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="New Password Confirm"
          name="newPassword2"
          rules={[
            {
              required: true,
              message: 'Please retype your new password!',
            },
            ({ getFieldValue }) => ({
              validator(rule, value) {
                if (value == getFieldValue('newPassword')) {
                  return Promise.resolve();
                }
                return Promise.reject('please retype the same password');
              },
            }),
          ]}
        >
          <Input.Password onPressEnter={onConfirm} />
        </Form.Item>
      </Form>

      <div className="my-6 flex items-center justify-end">
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Button
          type="primary"
          onClick={form.submit}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
};
