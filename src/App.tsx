import React, { useEffect, useState } from "react";
import {
  DesktopOutlined,
  LogoutOutlined,
  // FileOutlined,
  PieChartOutlined,
  // TeamOutlined,
  // UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  // BrowserRouter as Router,
  Routes,
  Route,
  // Outlet,
  // Link,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Layout, Menu, message, theme } from "antd";

import Dashboard from "./components/dashboard";
import PricePlans from "./components/pricePlans";
import PricePlanList from "./components/pricePlansList";
import PlanNew from "./components/newSubplan";
import PlanDetail from "./components/planDetail";
import SubscriptionList from "./components/subscriptionList";
import SubscriptionDetail from "./components/subscriptionDetail";
import Subscriptions from "./components/subscriptions";

import CustomerEntry from "./components/userEntryPage";
import CustomerDetail from "./components/userDetail";
import CustomerList from "./components/userList";

import InvoiceEntry from "./components/invoiceEntryPage";
import InvoiceList from "./components/invoiceList";
import InvoiceDetail from "./components/invoiceDetail";

import Settings from "./components/settings";
// import Users from "./components/userList";
import Login from "./components/login";
import Signup from "./components/signup";
import Profile from "./components/profile";
import NotFound from "./components/notFound";
import AppSearch from "./components/appSearch";
import { logoutReq } from "./requests";

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem("Plan", "/plan/list", <DesktopOutlined />),
  getItem("Subscription", "/subscription/list", <PieChartOutlined />),
  getItem("Invoice", "/invoice/list", <PieChartOutlined />),
  getItem("Customer", "/customer/list", <PieChartOutlined />),
  getItem("Analytics", "/analytics", <PieChartOutlined />),
  getItem("Profile", "/profile", <PieChartOutlined />),
  getItem("Settings", "/settings", <PieChartOutlined />),
];

const APP_PATH = import.meta.env.BASE_URL; // import.meta.env.VITE_APP_PATH;
const noSiderRoutes = [`${APP_PATH}login`, `${APP_PATH}signup`];

const App: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState<string[]>([
    window.location.pathname,
  ]);
  // const [openKeys, setOpenKeys] = useState<string[]>(["/subscription/list"]);
  // this is the default open keys after successful login.
  // const [openKeys, setOpenKeys] = useState<string[]>(["/subscription"]);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const navigate = useNavigate();

  const onItemClick = ({ key }: { key: string; needNavigate?: boolean }) => {
    console.log("on item click, key: ", key);
    navigate(`${APP_PATH}${key.substring(1)}`); // remove the leading '/' character, coz APP_PATH already has it
    setActiveMenuItem([key]);
  };

  const logout = async () => {
    try {
      const logoutRes = await logoutReq();
      console.log("logout res: ", logoutRes);
      localStorage.removeItem("merchantToken");
      navigate(`${APP_PATH}login`);
    } catch (err) {
      navigate(`${APP_PATH}login`);
      if (err instanceof Error) {
        console.log("err logging out: ", err.message);
        // message.error(err.message);
      } else {
        // message.error("Unknown error");
      }
    }
  };

  useEffect(() => {
    console.log("pathname: ", location.pathname);
    const pathItems = location.pathname.split("/").filter((p) => p != "");
    if (pathItems[0] == "subscription") {
      setActiveMenuItem(["/subscription/list"]);
    } else if (pathItems[0] == "plan") {
      setActiveMenuItem(["/plan/list"]);
    } else if (pathItems[0] == "customer") {
      setActiveMenuItem(["/customer/list"]);
    } else if (pathItems[0] == "invoice") {
      setActiveMenuItem(["/invoice/list"]);
    } else {
      setActiveMenuItem(["/" + pathItems[0]]);
    }
  }, [location, location.pathname]);

  return (
    <>
      {noSiderRoutes.findIndex((r) => r == location.pathname) != -1 ? (
        <Layout style={{ minHeight: "100vh" }}>
          <Routes>
            <Route path={`${APP_PATH}login`} Component={Login} />
            <Route path={`${APP_PATH}signup`} Component={Signup} />
          </Routes>
        </Layout>
      ) : (
        <Layout style={{ minHeight: "100vh" }}>
          <Sider
            // theme="light"
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
          >
            <div className="demo-logo-vertical" />
            <div
              style={{
                color: "#FFF",
                display: "flex",
                justifyContent: "center",
                margin: "16px 0",
              }}
            >
              <img src={`${APP_PATH}multiloginLogo.png`} height={"80px"} />
            </div>
            <Menu
              theme="dark"
              selectedKeys={activeMenuItem}
              mode="inline"
              items={items}
              onClick={onItemClick}
            />
            <div
              onClick={logout}
              style={{
                color: "#FFF",
                position: "absolute",
                bottom: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                cursor: "pointer",
              }}
            >
              <LogoutOutlined />
              &nbsp;&nbsp;Logout
            </div>
          </Sider>
          <Layout>
            <Header style={{ background: colorBgContainer }}>
              <AppSearch />
            </Header>
            <Content
              style={{
                padding: "16px",
                height: "calc(100vh - 180px)",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  padding: 24,
                  minHeight: 360,
                  background: colorBgContainer,
                  borderRadius: borderRadiusLG,
                  // height: "100%",
                }}
              >
                <Routes>
                  <Route path="*" Component={NotFound} />
                  <Route
                    path={APP_PATH}
                    element={<Navigate to={`${APP_PATH}subscription/list`} />} // default page after login
                  />
                  <Route path={`${APP_PATH}profile`} Component={Profile} />
                  <Route path={`${APP_PATH}analytics`} Component={Dashboard} />
                  {/* <Route path={`${APP_PATH}invoice`} Component={Invoices} /> */}
                  <Route path={`${APP_PATH}settings`} Component={Settings} />
                  {/* <Route path={`${APP_PATH}users`} Component={Users} /> */}
                  <Route
                    path={`${APP_PATH}subscription`}
                    Component={Subscriptions}
                  >
                    <Route path="list" element={<SubscriptionList />} />
                    <Route
                      path=":subscriptionId"
                      element={<SubscriptionDetail />}
                    />
                  </Route>
                  <Route path={`${APP_PATH}plan`} Component={PricePlans}>
                    <Route path="list" element={<PricePlanList />} />
                    <Route path="new" element={<PlanNew />} />
                    <Route path=":planId" element={<PlanDetail />} />
                  </Route>

                  <Route path={`${APP_PATH}customer`} Component={CustomerEntry}>
                    <Route path="list" element={<CustomerList />} />
                    {/* <Route path="new" element={<PlanNew />} /> */}
                    <Route path=":userId" element={<CustomerDetail />} />
                  </Route>

                  <Route path={`${APP_PATH}invoice`} Component={InvoiceEntry}>
                    <Route path="list" element={<InvoiceList />} />
                    <Route path=":invoiceId" element={<InvoiceDetail />} />
                  </Route>
                </Routes>
              </div>
            </Content>
            <Footer style={{ textAlign: "center" }}>Multilogin ©2024</Footer>
          </Layout>
        </Layout>
      )}
    </>
  );
};

export default App;
