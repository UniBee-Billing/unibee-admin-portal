import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Space, Table, Tag, Button, Tooltip, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PLAN_STATUS } from "../constants";
import { showAmount } from "../helpers";
import { getPlanList } from "../requests";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

interface DataType {
  id: number;
  planName: string; // plan name
  description: string;
  type: number; // 1: main plan, 2: add-on
  amount: number;
  currency: string;
  intervalUnit: string;
  intervalCount: number;
  status: number;
  price: string;
  isPublished: boolean;
  // addons?: string;
}

const columns: ColumnsType<DataType> = [
  {
    title: "Name",
    dataIndex: "planName",
    key: "planName",
    // render: (text) => <a>{text}</a>,
  },
  {
    title: "Description",
    dataIndex: "description",
    key: "description",
  },
  {
    title: "Price",
    dataIndex: "price",
    key: "price",
    render: (_, p) => {
      return (
        <span>{` ${showAmount(p.amount, p.currency)} /${
          p.intervalCount == 1 ? "" : p.intervalCount
        }${p.intervalUnit} `}</span>
      );
    },
  },
  {
    title: "Type",
    dataIndex: "type",
    key: "type",
    render: (_, plan) => {
      return plan.type == 1 ? <span>Main plan</span> : <span>Add-on</span>;
    },
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (_, plan) => {
      return <span>{PLAN_STATUS[plan.status]}</span>;
    },
  },
  /* {
    title: "is published",
    dataIndex: "isPublished",
    key: "isPublished",
    render: (_, isPublished) =>
      isPublished ? (
        <CheckCircleOutlined style={{ color: "green" }} />
      ) : (
        <MinusOutlined style={{ color: "red" }} />
      ),
  }, */
  {
    title: "Action",
    key: "action",
    render: (_, record) => (
      <Space size="middle">
        <a>Edit</a>
        {/* <a>Delete</a> */}
      </Space>
    ),
  },
];

const Index = () => {
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<DataType[]>([]);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const normalize = (data: any): DataType[] => {
    // console.log("normalize: ", data);
    const plans = data.map((d: any) => {
      return {
        id: d.plan.id,
        amount: d.plan.amount,
        planName: d.plan.planName,
        type: d.plan.type,
        status: d.plan.status,
        description: d.plan.description,
        currency: d.plan.currency,
        intervalCount: d.plan.intervalCount,
        intervalUnit: d.plan.intervalUnit,
        isPublished: true,
        // addons:
      };
    });
    // console.log("after norM: ", plans);
    return plans;
  };

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const planListRes = await getPlanList({
          type: undefined, // get main plan and addon
          status: undefined, // active, inactive, expired, editing, all of them
        });
        console.log("plan list res: ", planListRes);
        const statusCode = planListRes.data.code;
        if (statusCode != 0) {
          statusCode == 61 && relogin();
          throw new Error(planListRes.data.message);
        }
        setPlan(normalize(planListRes.data.data.Plans));
      } catch (err) {
        if (err instanceof Error) {
          console.log("err getting planlist: ", err.message);
          message.error(err.message);
        } else {
          message.error("Unknown error");
        }
      }
    };
    fetchPlan();
  }, []);

  return (
    <>
      <div
        style={{ padding: "16px 0", display: "flex", justifyContent: "end" }}
      >
        <Button
          type="primary"
          onClick={() => {
            navigate(`${APP_PATH}plan/new`);
          }}
        >
          New plan
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={plan}
        rowKey={"id"}
        pagination={false}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              console.log("row click: ", record, "///", rowIndex);
              navigate(`${APP_PATH}plan/${record.id}`);
            }, // click row
            // onDoubleClick: (event) => {}, // double click row
            // onContextMenu: (event) => {}, // right button click row
            // onMouseEnter: (event) => {}, // mouse enter row
            // onMouseLeave: (event) => {}, // mouse leave row
          };
        }}
      />
    </>
  );
};

export default Index;
