import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Space,
  Table,
  Tag,
  Button,
  Form,
  Input,
  Select,
  message,
  Spin,
  Modal,
  Row,
  Col,
  Tabs,
  Divider,
  DatePicker,
  Radio,
  RadioChangeEvent,
} from "antd";
import type { TabsProps } from "antd";
import {
  getPlanList,
  getSubDetail,
  createPreviewReq,
  updateSubscription,
  terminateSub,
  getCountryList,
  extendDueDate,
  resumeSub,
  // saveProfile,
} from "../requests";
import * as dayjs from "dayjs";
import { SUBSCRIPTION_STATUS } from "../constants";
import { ISubscriptionType, IPlan, IProfile, Country } from "../shared.types";
import update from "immutability-helper";
import Plan from "./plan";
import { daysBetweenDate, showAmount } from "../helpers";
import { SyncOutlined } from "@ant-design/icons";

const APP_PATH = import.meta.env.BASE_URL;

interface IPreview {
  totalAmount: number;
  prorationDate: number;
  currency: string;
  invoices: {
    amount: number;
    currency: string;
    description: string;
    probation: boolean;
  }[];
}

const Index = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<IProfile | null>(null);
  const { TextArea } = Input;

  const tabItems: TabsProps["items"] = [
    {
      key: "Subscription",
      label: "Subscription",
      children: <SubscriptionTab setUserProfile={setUserProfile} />,
    },
    {
      key: "Account",
      label: "Account",
      children: <UserTab user={userProfile} />,
    },
    {
      key: "Invoices",
      label: "Invoices",
      children: "Content of invoices",
    },
    {
      key: "Payment",
      label: "Payment",
      children: "content of payment",
    },
    /* {
      key: "Timeline",
      label: "Timeline",
      children: "content of timeline",
    },
    {
      key: "Custom",
      label: "Custom",
      children: "content of custom",
    },
    */
  ];
  const onTabChange = (key: string) => {
    console.log(key);
  };
  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "80%" }}>
        <Tabs defaultActiveKey="1" items={tabItems} onChange={onTabChange} />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "64px",
          }}
        >
          <Button onClick={() => navigate(-1)}>Back</Button>
        </div>
      </div>
      <div
        style={{
          width: "20%",
          border: "1px solid #EEE",
          borderRadius: "4px",
          marginLeft: "24px",
          padding: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "gray",
          }}
        >
          admin side note
        </div>
        <div
          style={{
            height: "70%",
            marginBottom: "18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "gray",
          }}
        >
          <div>main content</div>
          <div>side note1</div>
          <div>side note2</div>
        </div>
        <TextArea rows={4} />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "48px",
          }}
        >
          <Button>Submit</Button>
        </div>
      </div>
    </div>
  );
};

const UserTab = ({ user }: { user: IProfile | null }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [countryList, setCountryList] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  /*
  const onSave = async () => {
    console.log("form: ", form.getFieldsValue());
    setLoading(true);
    let saveProfileRes;
    try {
      saveProfileRes = await saveProfile(form.getFieldsValue());
      console.log("save profile res: ", saveProfileRes);
      const code = saveProfileRes.data.code;
      if (code != 0) {
        code == 61 && relogin();
        // TODO: save all statu code in a constant
        throw new Error(saveProfileRes.data.message);
      }
      message.success("saved");
      setUserProfile(saveProfileRes.data.data.User);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log("profile update err: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }
  };
  */

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      let profileRes, countryListRes;
      try {
        const res = ([countryListRes] = await Promise.all([
          // getProfile(),
          getCountryList(15621),
        ]));
        console.log("profile/country: ", profileRes, "//", countryListRes);
        res.forEach((r) => {
          const code = r.data.code;
          code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
          if (code != 0) {
            // TODO: save all the code as ENUM in constant,
            throw new Error(r.data.message);
          }
        });
        setLoading(false);
      } catch (err) {
        setLoading(false);
        if (err instanceof Error) {
          console.log("profile update err: ", err.message);
          // setErrMsg(err.message);
          message.error(err.message);
        } else {
          message.error("Unknown error");
        }
        return;
      }
      // setUserProfile(profileRes.data.data.User);
      setCountryList(
        countryListRes.data.data.vatCountryList.map((c: any) => ({
          code: c.countryCode,
          name: c.countryName,
        }))
      );
    };

    fetchData();
  }, []);

  return (
    user != null && (
      <Form
        form={form}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 24 }}
        layout="horizontal"
        // disabled={componentDisabled}
        style={{ maxWidth: 600 }}
        initialValues={user}
      >
        <Form.Item label="ID" name="id" hidden>
          <Input disabled />
        </Form.Item>

        <Form.Item label="First name" name="firstName">
          <Input />
        </Form.Item>

        <Form.Item label="Last name" name="lastName">
          <Input />
        </Form.Item>

        <Form.Item label="Email" name="email">
          <Input disabled />
        </Form.Item>

        <Form.Item label="Billing address" name="address">
          <Input />
        </Form.Item>

        <Form.Item label="Country" name="countryCode">
          <Select
            showSearch
            placeholder="Type to search"
            optionFilterProp="children"
            // value={country}
            // onChange={onCountryChange}
            // onSearch={onSearch}
            filterOption={filterOption}
            options={countryList.map((c) => ({
              label: c.name,
              value: c.code,
            }))}
          />
        </Form.Item>

        <Form.Item label="Country Name" name="countryName" hidden>
          <Input />
        </Form.Item>

        <Form.Item label="Company name" name="companyName">
          <Input />
        </Form.Item>

        <Form.Item label="VAT number" name="vATNumber">
          <Input />
        </Form.Item>

        <Form.Item label="Phone number" name="mobile">
          <Input />
        </Form.Item>

        <Form.Item label="Telegram" name="telegram">
          <Input />
        </Form.Item>

        <Form.Item label="WhatsApp" name="whatsAPP">
          <Input />
        </Form.Item>

        <Form.Item label="WeChat" name="weChat">
          <Input />
        </Form.Item>

        <Form.Item label="LinkedIn" name="linkedIn">
          <Input />
        </Form.Item>

        <Form.Item label="Facebook" name="facebook">
          <Input />
        </Form.Item>

        <Form.Item label="TikTok" name="tikTok">
          <Input />
        </Form.Item>

        <Form.Item label="Other social info" name="otherSocialInfo">
          <Input />
        </Form.Item>

        <Form.Item label="Payment methods" name="paymentMethod">
          <Radio.Group>
            <Radio value="creditCard">Credit Card</Radio>
            <Radio value="crypto">Crypto</Radio>
            <Radio value="paypal">Paypal</Radio>
            <Radio value="wireTransfer">Wire Transfer</Radio>
          </Radio.Group>
        </Form.Item>

        {/* <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "36px",
          }}
        >
          <Button type="primary" onClick={onSave} disabled={loading}>
            Save
          </Button>
        </div> */}
      </Form>
    )
  );
};

const SubscriptionTab = ({
  setUserProfile,
}: {
  setUserProfile: (user: IProfile) => void;
}) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<IPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<null | number>(null); // null: not selected
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [confirmming, setConfirming] = useState(false);
  const [dueDateModal, setDueDateModal] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [changePlanModal, setChangePlanModal] = useState(false);
  const [preview, setPreview] = useState<IPreview | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [terminateModal, setTerminateModal] = useState(false);
  const [resumeModal, setResumeModal] = useState(false);
  const [activeSub, setActiveSub] = useState<ISubscriptionType | null>(null); // null: when page is loading, no data is ready yet.
  const [endSubMode, setEndSubMode] = useState<1 | 2>(1); // 1: immediate, 2: end of this billing cycole

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  // select immediate or end of this billing cycle
  const onEndSubModeChange = (e: RadioChangeEvent) => {
    console.log("radio checked", e.target.value);
    setEndSubMode(e.target.value);
  };

  const onAddonChange = (
    addonId: number,
    quantity: number | null, // null means: don't update this field, keep its original value
    checked: boolean | null // ditto
  ) => {
    const planIdx = plans.findIndex((p) => p.id == selectedPlan);
    if (planIdx == -1) {
      return;
    }
    const addonIdx = plans[planIdx].addons!.findIndex((a) => a.id == addonId);
    if (addonIdx == -1) {
      return;
    }

    let newPlans = plans;
    if (quantity == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { checked: { $set: checked as boolean } } },
        },
      });
    } else if (checked == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { quantity: { $set: quantity as number } } },
        },
      });
    }
    setPlans(newPlans);
  };

  const togglePreviewModal = () => setPreviewModalOpen(!previewModalOpen);
  const openPreviewModal = () => {
    const plan = plans.find((p) => p.id == selectedPlan);
    let valid = true;
    if (plan?.addons != null && plan.addons.length > 0) {
      for (let i = 0; i < plan.addons.length; i++) {
        if (plan.addons[i].checked) {
          const q = Number(plan.addons[i].quantity);
          console.log("q: ", q);
          if (!Number.isInteger(q) || q <= 0) {
            valid = false;
            break;
          }
        }
      }
    }
    if (!valid) {
      message.error("Addon quantity must be greater than 0.");
      return;
    }
    togglePreviewModal();
    createPreview();
  };

  const createPreview = async () => {
    setPreview(null); // clear the last preview, otherwise, users might see the old value before the new value return
    const plan = plans.find((p) => p.id == selectedPlan);
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];
    console.log("active sub addon bfr preview: ", addons);
    let previewRes;
    try {
      previewRes = await createPreviewReq(
        activeSub!.subscriptionId,
        selectedPlan as number,
        addons.map((a) => ({
          quantity: a.quantity as number,
          addonPlanId: a.id,
        }))
      );
      console.log("subscription update preview res: ", previewRes);
      const code = previewRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(previewRes.data.message);
      }
    } catch (err) {
      setPreviewModalOpen(false);
      if (err instanceof Error) {
        console.log("err creating preview: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }

    const p: IPreview = {
      totalAmount: previewRes.data.data.totalAmount,
      currency: previewRes.data.data.currency,
      prorationDate: previewRes.data.data.prorationDate,
      invoices: previewRes.data.data.invoice.lines,
    };
    setPreview(p);
  };

  const onConfirm = async () => {
    const plan = plans.find((p) => p.id == selectedPlan);
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];
    let updateSubRes;
    try {
      setConfirming(true);
      updateSubRes = await updateSubscription(
        activeSub?.subscriptionId as string,
        selectedPlan as number,
        addons.map((a) => ({
          quantity: a.quantity as number,
          addonPlanId: a.id,
        })),
        preview?.totalAmount as number,
        preview?.currency as string,
        preview?.prorationDate as number
      );
      console.log("update subscription submit res: ", updateSubRes);
      const code = updateSubRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(updateSubRes.data.message);
      }
    } catch (err) {
      setConfirming(false);
      setPreviewModalOpen(false);
      if (err instanceof Error) {
        console.log("err creating preview: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }

    if (updateSubRes.data.data.paid) {
      /*
      navigate(`${APP_PATH}profile/subscription`, {
        state: { msg: "Subscription updated" },
      });
      */
      // navigate(-1);
      togglePreviewModal();
      setChangePlanModal(false);
      setConfirming(false);
      fetchData();
      message.success("Plan updated");
      return;
    }
    setConfirming(false);
    togglePreviewModal();
    // ??????????????????
    // what if checkout form is opened, you can't ask admin to pay user's subscription fee.
    window.open(updateSubRes.data.data.link, "_blank");
  };

  const onTerminateSub = async () => {
    try {
      setLoading(true);
      const terminateRes = await terminateSub(
        activeSub?.subscriptionId as string,
        endSubMode == 1
      );
      console.log("terminate sub res: ", terminateRes);
      const code = terminateRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(terminateRes.data.message);
      }
      setLoading(false);
      setTerminateModal(false);
      message.success(
        endSubMode == 1
          ? "Subscription ended"
          : "Subscription will end on the end of this billing cycle"
      );
      fetchData();
    } catch (err) {
      setLoading(false);
      setTerminateModal(false);
      if (err instanceof Error) {
        console.log("err terminating sub: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  const onResumeSub = async () => {
    try {
      setLoading(true);
      const resumeRes = await resumeSub(activeSub?.subscriptionId as string);
      console.log("resume sub res: ", resumeRes);
      const code = resumeRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(resumeRes.data.message);
      }
      setLoading(false);
      setResumeModal(false);
      message.success("Subscription resumed.");
      fetchData();
    } catch (err) {
      setLoading(false);
      setResumeModal(false);
      if (err instanceof Error) {
        console.log("err resuming sub: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  const onSelectPlanChange = (value: number) => {
    console.log("value change: ", value);
    setSelectedPlan(value);
  };

  const fetchData = async () => {
    let subDetailRes, planListRes;
    // const subId = location.state && location.state.subscriptionId;
    const pathName = window.location.pathname.split("/");
    const subId = pathName.pop();
    if (subId == null) {
      // TODO: show page not exit, OR invalid subscription
      return;
    }

    setLoading(true);
    try {
      const res = ([subDetailRes, planListRes] = await Promise.all([
        getSubDetail(subId),
        getPlanList(1),
      ]));
      console.log("subDetail/planList: ", subDetailRes, "//", planListRes);
      res.forEach((r) => {
        const code = r.data.code;
        code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
        if (code != 0) {
          // TODO: save all the code as ENUM in constant,
          throw new Error(r.data.message);
        }
      });
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log("err: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }

    setLoading(false);
    const s: any = subDetailRes.data.data;
    const localActiveSub: ISubscriptionType = { ...s.subscription };
    localActiveSub.addons = s.addons?.map((a: any) => ({
      ...a.AddonPlan,
      quantity: a.quantity,
      addonPlanId: a.addonPlan.id,
    }));
    localActiveSub.user = s.user;
    console.log("active sub: ", localActiveSub);

    setSelectedPlan(s.planId.id);
    setUserProfile(s.user);

    let plans: IPlan[] = planListRes.data.data.Plans.map((p: any) => {
      const p2 = p.plan;
      if (p.plan.type == 2) {
        // addon plan
        return null;
      }
      if (
        p.plan.id != 31 &&
        p.plan.id != 37 &&
        p.plan.id != 38 &&
        p.plan.id != 32 &&
        p.plan.id != 41
      ) {
        return null;
      }
      return {
        id: p2.id,
        planName: p2.planName,
        description: p2.description,
        type: p2.type,
        amount: p2.amount,
        currency: p2.currency,
        intervalUnit: p2.intervalUnit,
        intervalCount: p2.intervalCount,
        status: p2.status,
        addons: p.addons,
      };
    });
    plans = plans.filter((p) => p != null);
    const planIdx = plans.findIndex((p) => p.id == s.planId.id);
    // let's say we have planA(which has addonA1, addonA2, addonA3), planB, planC, user has subscribed to planA, and selected addonA1, addonA3
    // I need to find the index of addonA1,3 in planA.addons array,
    // then set their {quantity, checked: true} props on planA.addons, these props value are from subscription.addons array.
    if (planIdx != -1 && plans[planIdx].addons != null) {
      for (let i = 0; i < plans[planIdx].addons!.length; i++) {
        const addonIdx =
          localActiveSub.addons == null
            ? -1
            : localActiveSub.addons.findIndex(
                (subAddon) =>
                  subAddon.addonPlanId == plans[planIdx].addons![i].id
              );
        if (addonIdx != -1) {
          plans[planIdx].addons![i].checked = true;
          plans[planIdx].addons![i].quantity =
            localActiveSub.addons[addonIdx].quantity;
        }
      }
    }
    setPlans(plans);
    localActiveSub.plan = plans.find((p) => p.id == localActiveSub.planId);
    setActiveSub(localActiveSub);
  };

  const onDueDateChange = (date, dateStr) => {
    console.log(date, "//", dateStr, "///", activeSub?.currentPeriodEnd);
    const days = daysBetweenDate(
      dateStr,
      (activeSub?.currentPeriodEnd as number) * 1000
    );
    setDueDateModal(true);
    setDueDate(dateStr);
    // console.log("days between: ", days);
  };

  const onExtendDueDate = async () => {
    setLoading(true);
    let extendRes;
    try {
      const hours =
        daysBetweenDate(activeSub!.currentPeriodEnd * 1000, dueDate) * 24;
      extendRes = await extendDueDate(activeSub!.subscriptionId, hours);
      console.log("extend res: ", extendRes);
      const code = extendRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(extendRes.data.message);
      }
    } catch (err) {
      setLoading(false);
      setDueDateModal(false);
      if (err instanceof Error) {
        console.log("err: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }
    setLoading(false);
    message.success("Due date extended");
    setDueDateModal(false);
    setDueDate("");
    fetchData(); // better to call message.success in fetchData cb(add a cb parameter to fetchData)
  };

  useEffect(() => {
    fetchData();
  }, []);

  const p = plans.find((p) => p.id == selectedPlan);
  return (
    <>
      <Spin spinning={loading} fullscreen />
      {contextHolder}

      <Modal
        title="Terminate Subscription"
        width={"640px"}
        open={terminateModal}
        footer={null}
      >
        <div style={{ margin: "16px 0" }}>
          Are you sure you want to end this subscription{" "}
          <span style={{ color: "red" }}>
            {endSubMode == 1 ? "immediately" : "at the end of billing cycle"}
          </span>
          ?
        </div>
        <Row>
          <Col span={6}>
            <span style={{ fontWeight: "bold" }}>First name</span>
          </Col>
          <Col span={6}>{activeSub?.user?.firstName}</Col>
          <Col span={5}>
            <span style={{ fontWeight: "bold" }}> Lastname</span>
          </Col>
          <Col span={6}>{activeSub?.user?.lastName}</Col>
        </Row>
        <Row>
          <Col span={6}>
            <span style={{ fontWeight: "bold" }}>Plan</span>
          </Col>
          <Col span={6}>{activeSub?.plan?.planName}</Col>
          <Col span={5}>
            <span style={{ fontWeight: "bold" }}>Amount</span>
          </Col>
          <Col span={6}>
            {activeSub?.plan?.amount &&
              showAmount(activeSub?.plan?.amount, activeSub?.plan?.currency)}
          </Col>
        </Row>
        <Row>
          <Col span={6}>
            <span style={{ fontWeight: "bold" }}>Current due date</span>
          </Col>
          <Col span={6}>
            {new Date(
              (activeSub?.currentPeriodEnd as number) * 1000
            ).toDateString()}
          </Col>
        </Row>
        <div
          style={{
            display: "flex",
            justifyContent: "end",
            alignItems: "center",
            gap: "18px",
            marginTop: "24px",
          }}
        >
          <Button
            onClick={() => {
              setTerminateModal(false);
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={onTerminateSub}
            loading={loading}
            disabled={loading}
          >
            OK
          </Button>
        </div>
      </Modal>

      <Modal
        title="Resume Subscription"
        width={"640px"}
        open={resumeModal}
        footer={null}
      >
        <div style={{ margin: "16px 0" }}>
          Are you sure you want to resume this subscription?
        </div>
        <Row>
          <Col span={6}>
            <span style={{ fontWeight: "bold" }}>First name</span>
          </Col>
          <Col span={6}>{activeSub?.user?.firstName}</Col>
          <Col span={5}>
            <span style={{ fontWeight: "bold" }}> Lastname</span>
          </Col>
          <Col span={6}>{activeSub?.user?.lastName}</Col>
        </Row>
        <Row>
          <Col span={6}>
            <span style={{ fontWeight: "bold" }}>Plan</span>
          </Col>
          <Col span={6}>{activeSub?.plan?.planName}</Col>
          <Col span={5}>
            <span style={{ fontWeight: "bold" }}>Amount</span>
          </Col>
          <Col span={6}>
            {activeSub?.plan?.amount &&
              showAmount(activeSub?.plan?.amount, activeSub?.plan?.currency)}
          </Col>
        </Row>
        <Row>
          <Col span={6}>
            <span style={{ fontWeight: "bold" }}>Current due date</span>
          </Col>
          <Col span={6}>
            {new Date(
              (activeSub?.currentPeriodEnd as number) * 1000
            ).toDateString()}
          </Col>
        </Row>
        <div
          style={{
            display: "flex",
            justifyContent: "end",
            alignItems: "center",
            gap: "18px",
            marginTop: "24px",
          }}
        >
          <Button
            onClick={() => {
              setResumeModal(false);
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={onResumeSub}
            loading={loading}
            disabled={loading}
          >
            OK
          </Button>
        </div>
      </Modal>
      <Modal
        title="Extend due date"
        open={dueDateModal}
        width={"640px"}
        footer={null}
      >
        <div style={{ margin: "16px 0" }}>
          Are you sure you want to extend the due date?
        </div>
        <Row>
          <Col span={6}>
            <span style={{ fontWeight: "bold" }}>First name</span>
          </Col>
          <Col span={6}>{activeSub?.user?.firstName}</Col>
          <Col span={5}>
            <span style={{ fontWeight: "bold" }}> Lastname</span>
          </Col>
          <Col span={6}>{activeSub?.user?.lastName}</Col>
        </Row>
        <Row>
          <Col span={6}>
            <span style={{ fontWeight: "bold" }}>Plan</span>
          </Col>
          <Col span={6}>{activeSub?.plan?.planName}</Col>
          <Col span={5}>
            <span style={{ fontWeight: "bold" }}>Amount</span>
          </Col>
          <Col span={6}>
            {activeSub?.plan?.amount &&
              showAmount(activeSub?.plan?.amount, activeSub?.plan?.currency)}
          </Col>
        </Row>
        <Row>
          <Col span={6}>
            <span style={{ fontWeight: "bold" }}>Current due date</span>
          </Col>
          <Col span={6}>
            {new Date(
              (activeSub?.currentPeriodEnd as number) * 1000
            ).toDateString()}
          </Col>
          <Col span={5}>
            <span style={{ fontWeight: "bold" }}>New due date</span>
          </Col>
          <Col span={7}>
            {dueDate}{" "}
            <span style={{ color: "red" }}>
              {`(+ ${daysBetweenDate(
                dueDate,
                (activeSub?.currentPeriodEnd as number) * 1000
              )} days)`}
            </span>
          </Col>
        </Row>
        <div
          style={{
            display: "flex",
            justifyContent: "end",
            alignItems: "center",
            gap: "18px",
            marginTop: "24px",
          }}
        >
          <Button
            onClick={() => {
              setDueDateModal(false);
              setDueDate("");
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={onExtendDueDate}
            loading={loading}
            disabled={loading}
          >
            OK
          </Button>
        </div>
      </Modal>

      {selectedPlan != null && (
        <Modal
          title="Subscription Update Preview"
          open={previewModalOpen}
          // onOk={onConfirm}
          // onCancel={togglePreviewModal}
          width={"640px"}
          footer={null}
        >
          {preview == null ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Spin />
            </div>
          ) : (
            <>
              {preview.invoices.map((i, idx) => (
                <Row key={idx} gutter={[16, 16]}>
                  <Col span={6}>{`${showAmount(i.amount, i.currency)}`}</Col>
                  <Col span={18}>{i.description}</Col>
                </Row>
              ))}
              <hr />
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <span style={{ fontSize: "18px" }}>Total</span>
                </Col>
                <Col span={18}>
                  <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                    {`${showAmount(preview.totalAmount, preview.currency)}`}
                  </span>
                </Col>
              </Row>
              <div
                style={{
                  display: "flex",
                  justifyContent: "end",
                  gap: "16px",
                  margin: "16px 0",
                }}
              >
                <Button disabled={confirmming} onClick={togglePreviewModal}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={onConfirm}
                  loading={confirmming}
                  disabled={confirmming}
                >
                  Confirm
                </Button>
              </div>
            </>
          )}
        </Modal>
      )}
      {
        <Modal
          title="Change plan"
          open={changePlanModal}
          width={"480px"}
          onOk={() => {
            // setChangePlanModal(false);
            openPreviewModal();
          }}
          onCancel={() => setChangePlanModal(false)}
        >
          <Divider>Choose a new subscription plan</Divider>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "12px",
            }}
          >
            <Select
              style={{ width: 120 }}
              value={selectedPlan}
              onChange={onSelectPlanChange}
              options={plans.map((p) => ({
                label: p.planName,
                value: p.id,
              }))}
            />
          </div>

          {p != undefined && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "48px",
              }}
            >
              <Plan
                plan={p}
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                onAddonChange={onAddonChange}
                isActive={p.id == activeSub?.planId}
              />
            </div>
          )}
        </Modal>
      }
      <div>
        <Divider orientation="left" style={{ margin: "16px 0" }}>
          User info
        </Divider>
        <Row>
          <Col span={4}>
            <span style={{ fontWeight: "bold" }}>First name</span>
          </Col>
          <Col span={6}>{activeSub?.user?.firstName}</Col>
          <Col span={4}>
            <span style={{ fontWeight: "bold" }}> Lastname</span>
          </Col>
          <Col span={6}>{activeSub?.user?.lastName}</Col>
        </Row>
        <Row>
          <Col span={4}>
            <span style={{ fontWeight: "bold" }}>Email</span>
          </Col>
          <Col span={6}>
            <a href={activeSub?.user?.email}>{activeSub?.user?.email} </a>
          </Col>
          <Col span={4}>
            <span style={{ fontWeight: "bold" }}>Phone</span>
          </Col>
          <Col span={6}>{activeSub?.user?.phone}</Col>
        </Row>
        <Row>
          <Col span={4}>
            <span style={{ fontWeight: "bold" }}>Country</span>
          </Col>
          <Col span={6}>{activeSub?.user?.countryName}</Col>
          <Col span={4}>
            <span style={{ fontWeight: "bold" }}>Billing address</span>
          </Col>
          <Col span={6}>{activeSub?.user?.adress}</Col>
        </Row>
        <Row>
          <Col span={4}>
            <span style={{ fontWeight: "bold" }}>Payment method</span>
          </Col>
          <Col span={6}>{activeSub?.user?.paymentMethod}</Col>
          <Col span={4}>
            <span style={{ fontWeight: "bold" }}>VAT number</span>
          </Col>
          <Col span={6}>{activeSub?.user?.vATNumber}</Col>
        </Row>
      </div>
      <Divider orientation="left" style={{ margin: "32px 0" }}>
        Subscription info
      </Divider>
      <Row>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Plan</span>
        </Col>
        <Col span={6}>{activeSub?.plan?.planName}</Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Plan description</span>
        </Col>
        <Col span={6}>{activeSub?.plan?.description}</Col>
      </Row>
      <Row>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Status</span>
        </Col>
        <Col span={6}>
          {activeSub && SUBSCRIPTION_STATUS[activeSub.status]}{" "}
          <span
            style={{ cursor: "pointer", marginLeft: "8px" }}
            onClick={fetchData}
          >
            <SyncOutlined />
          </span>
        </Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Subscription Id</span>
        </Col>
        <Col span={6}>{activeSub?.subscriptionId}</Col>
      </Row>
      <Row>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Plan price</span>
        </Col>
        <Col span={6}>
          {activeSub?.plan?.amount &&
            showAmount(activeSub?.plan?.amount, activeSub?.plan?.currency)}
        </Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Addons</span>
        </Col>
        <Col span={6}>{"*******"}</Col>
      </Row>
      <Row>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Total amount</span>
        </Col>
        <Col span={6}>
          {activeSub?.amount &&
            showAmount(activeSub.amount, activeSub.currency)}
        </Col>

        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Bill period</span>
        </Col>
        <Col span={6}>{`${activeSub?.plan && activeSub?.plan?.intervalCount} ${
          activeSub?.plan && activeSub?.plan?.intervalUnit
        }`}</Col>
      </Row>
      <Row>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>First pay</span>
        </Col>
        <Col span={6}>{activeSub?.firstPayTime}</Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Next due date</span>
          <DatePicker
            onChange={onDueDateChange}
            disabledDate={(d) =>
              d.isBefore(
                new Date(
                  activeSub != null
                    ? activeSub.currentPeriodEnd * 1000 + 1000 * 60 * 60 * 24
                    : Date.now()
                )
              )
            }
          />
        </Col>
        <Col span={6}>
          {activeSub?.currentPeriodEnd &&
            new Date(activeSub?.currentPeriodEnd * 1000).toLocaleDateString()}
        </Col>
      </Row>

      {activeSub && activeSub.status == 2 && (
        <div
          style={{
            margin: "24px 0",
            display: "flex",
            justifyContent: "start",
            alignItems: "center",
            gap: "36px",
          }}
        >
          <Button onClick={() => setChangePlanModal(true)}>Change plan</Button>
          {activeSub.cancelAtPeriodEnd == 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Button onClick={() => setTerminateModal(true)}>
                End subscription
              </Button>
              <Radio.Group onChange={onEndSubModeChange} value={endSubMode}>
                <Radio value={1}>immediately</Radio>
                <Radio value={2}>end of this cycle</Radio>
              </Radio.Group>
            </div>
          ) : (
            <div>
              <span>Subscription will end on </span>
              <span style={{ color: "red", marginRight: "8px" }}>
                {activeSub &&
                  new Date(activeSub!.trialEnd * 1000).toLocaleString()}
              </span>
              <Button onClick={() => setResumeModal(true)}>Resume</Button>
            </div>
          )}
        </div>
      )}

      {/* <div style={{ display: "flex", gap: "18px" }}>
        {plans.map((p) => (
          <Plan
            key={p.id}
            plan={p}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            onAddonChange={onAddonChange}
            isActive={p.id == activeSub?.planId}
          />
        ))}
        </div> */}
      <Divider orientation="left" style={{ margin: "32px 0" }}>
        Subscription History
      </Divider>

      <Divider orientation="left" style={{ margin: "32px 0" }}>
        Addon History
      </Divider>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "68px",
        }}
      >
        {/* plans.length != 0 && (
          <>
            <Button
              type="primary"
              onClick={openPreviewModal}
              disabled={selectedPlan == null}
            >
              Confirm
            </Button>
          </>
        ) */}
      </div>
    </>
  );
};

export default Index;
