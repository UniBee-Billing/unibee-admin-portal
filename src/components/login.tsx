import React, { ChangeEvent, useEffect, useState } from "react";
import type { RadioChangeEvent } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Tabs,
  Radio,
  message,
  Divider,
} from "antd";
import OtpInput from "react-otp-input";
import axios from "axios";
import AppHeader from "./appHeader";
import AppFooter from "./appFooter";

const APP_PATH = import.meta.env.BASE_URL; // if not specified in build command, default is /
const API_URL = import.meta.env.VITE_API_URL;

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const onEmailChange = (evt: ChangeEvent<HTMLInputElement>) =>
    setEmail(evt.target.value);
  const onPasswordChange = (evt: ChangeEvent<HTMLInputElement>) =>
    setPassword(evt.target.value);
  const [loginType, setLoginType] = useState("password"); // [password, OTP]

  const onLoginTypeChange = (e: RadioChangeEvent) =>
    setLoginType(e.target.value);

  const goSignup = () => navigate(`${APP_PATH}signup`);

  useEffect(() => {
    if (location.state && location.state.msg) {
      message.info(location.state.msg);
    }
  }, []);

  return (
    <div
      style={{
        height: "calc(100vh - 164px)",
        overflowY: "auto",
      }}
    >
      {" "}
      <AppHeader />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "200px",
        }}
      >
        <h1 style={{ marginBottom: "36px" }}>Merchant Login</h1>
        <Radio.Group
          options={[
            { label: "Password", value: "password" },
            { label: "OTP", value: "OTP" },
          ]}
          onChange={onLoginTypeChange}
          value={loginType}
        />
        <div
          style={{
            width: "640px",
            height: "320px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            marginTop: "36px",
            background: "#FFF",
          }}
        >
          {/* <div style={{ height: "36px" }}></div> */}
          {/* <div style={{ height: "48px" }}></div> */}
          {loginType == "password" ? (
            <Login1
              email={email}
              onEmailChange={onEmailChange}
              password={password}
              onPasswordChange={onPasswordChange}
            />
          ) : (
            <Login2 email={email} onEmailChange={onEmailChange} />
          )}
        </div>
        <div
          style={{
            display: "flex",
            color: "#757575",
            justifyContent: "center",
            alignItems: "center",
            // margin: "-48px 0 18px 0",
          }}
        >
          Don't have an account?
          <Button type="link" onClick={goSignup}>
            Free signup
          </Button>
        </div>
      </div>
      <AppFooter />
    </div>
  );
};

export default Index;

// email + Pasword
const Login1 = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
}: {
  email: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  password: string;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const onSubmit = () => {
    setErrMsg("");
    axios
      .post(`${API_URL}/merchant/auth/sso/login`, {
        email,
        password,
      })
      .then((res) => {
        console.log("login res: ", res);
        if (res.data.code != 0) {
          throw new Error(res.data.message);
        }
        localStorage.setItem("merchantToken", res.data.data.Token);
        navigate(`${APP_PATH}subscription/list`);
      })
      .catch((err) => {
        console.log("login err: ", err.message);
        setErrMsg(err.message);
      });
  };
  return (
    <Form
      name="basic"
      labelCol={{
        span: 10,
      }}
      wrapperCol={{
        span: 14,
      }}
      style={{
        maxWidth: 640,
      }}
      initialValues={{
        remember: true,
      }}
      autoComplete="off"
    >
      <Form.Item
        label="Email"
        name="email"
        rules={[
          {
            required: true,
            message: "Please input your Email!",
          },
        ]}
      >
        <Input value={email} onChange={onEmailChange} />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[
          {
            required: true,
            message: "Please input your password!",
          },
        ]}
      >
        <Input.Password value={password} onChange={onPasswordChange} />
      </Form.Item>

      {/* <Form.Item
        name="remember"
        valuePropName="checked"
        wrapperCol={{
          offset: 8,
          span: 16,
        }}
      >
        <Checkbox>Remember me</Checkbox>
      </Form.Item>*/}

      <Form.Item
        name="errMsg"
        wrapperCol={{
          offset: 8,
          span: 16,
        }}
      >
        <span style={{ color: "red" }}>{errMsg}</span>
      </Form.Item>

      <Form.Item
        wrapperCol={{
          offset: 8,
          span: 16,
        }}
      >
        <Button type="primary" htmlType="submit" onClick={onSubmit}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

// email + OTP
const Login2 = ({
  email,
  onEmailChange,
}: {
  email: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const [currentStep, setCurrentStep] = useState(0); // 0: input email, 1: input verification code
  const [submitting, setSubmitting] = useState(false);
  const [otp, setOtp] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  const onOTPchange = (value: string) => {
    setOtp(value.toUpperCase());
  };

  const resend = () => {
    setSubmitting(true);
    setOtp("");
    axios
      .post(`${API_URL}/merchant/auth/sso/loginOTP`, {
        email,
      })
      .then((res) => {
        setSubmitting(false);
        console.log("login res: ", res);
        if (res.data.code != 0) {
          setErrMsg(res.data.message);
          throw new Error(res.data.message);
        }
        setCurrentStep(1);
      })
      .catch((err) => {
        setSubmitting(false);
        console.log("login err: ", err.message);
        setErrMsg(err.message);
      });
  };

  const submit = () => {
    setErrMsg("");
    setSubmitting(true);
    console.log("submitting..");
    if (currentStep == 0) {
      axios
        .post(`${API_URL}/merchant/auth/sso/loginOTP`, {
          email,
        })
        .then((res) => {
          setSubmitting(false);
          console.log("login res: ", res);
          if (res.data.code != 0) {
            setErrMsg(res.data.message);
            throw new Error(res.data.message);
          }
          setCurrentStep(1);
        })
        .catch((err) => {
          setSubmitting(false);
          console.log("login err: ", err.message);
          setErrMsg(err.message);
        });
    } else {
      axios
        .post(`${API_URL}/merchant/auth/sso/loginOTPVerify`, {
          email,
          verificationCode: otp,
        })
        .then((res) => {
          console.log("otp loginVerify res: ", res);
          setSubmitting(false);
          if (res.data.code != 0) {
            setErrMsg(res.data.message);
            throw new Error(res.data.message);
          }
          localStorage.setItem("merchantToken", res.data.data.Token);
          navigate(`${APP_PATH}subscription/list`);
        })
        .catch((err) => {
          setSubmitting(false);
          console.log("login err: ", err.message);
          setErrMsg(err.message);
        });
    }
  };

  return (
    <div>
      {currentStep == 0 ? (
        <Form
          name="basic"
          labelCol={{
            span: 6,
          }}
          wrapperCol={{
            span: 18,
          }}
          style={{
            maxWidth: 600,
          }}
          initialValues={{
            remember: true,
          }}
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Please input your Email!",
              },
            ]}
          >
            <Input value={email} onChange={onEmailChange} />
          </Form.Item>

          <Form.Item
            wrapperCol={{
              offset: 8,
              span: 16,
            }}
          >
            <Button
              type="primary"
              htmlType="submit"
              onClick={submit}
              loading={submitting}
              disabled={submitting}
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "78px",
            }}
          >
            <h3>Enter verification code for {email}</h3>
          </div>
          <OtpInput
            value={otp}
            onChange={onOTPchange}
            numInputs={6}
            shouldAutoFocus={true}
            skipDefaultStyles={true}
            inputStyle={{
              height: "80px",
              width: "60px",
              border: "1px solid gray",
              borderRadius: "6px",
              textAlign: "center",
              fontSize: "36px",
            }}
            renderSeparator={<span style={{ width: "36px" }}></span>}
            renderInput={(props) => <input {...props} />}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "48px",
            }}
          >
            <span style={{ marginBottom: "18px", color: "red" }}>{errMsg}</span>
            <Button
              type="primary"
              block
              onClick={submit}
              disabled={submitting}
              loading={submitting}
            >
              OK
            </Button>
            <Button type="link" block onClick={resend}>
              Resend
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
