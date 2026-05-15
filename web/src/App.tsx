import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { OperatorPage } from "./pages/OperatorPage";
import { DriverPage } from "./pages/DriverPage";
import { WorkshopPage } from "./pages/WorkshopPage";
import { AdminOrdersPage } from "./pages/AdminOrdersPage";
import { CashPage } from "./pages/CashPage";
import { ReportsPage } from "./pages/ReportsPage";
import { StaffPage } from "./pages/StaffPage";
import type { Role } from "./types";

function defaultPathForRole(role: Role | null): string {
  switch (role) {
    case "ADMIN":
      return "/admin/orders";
    case "OPERATOR":
      return "/operator";
    case "DRIVER":
      return "/driver";
    case "WORKSHOP":
      return "/workshop";
    default:
      return "/login";
  }
}

function RoleGate({ role, allow, children }: { role: Role | null; allow: Role[]; children: JSX.Element }) {
  if (!role) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to={defaultPathForRole(role)} replace />;
  return children;
}

export function App() {
  const { token, role } = useAuth();

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route
          path="/operator"
          element={
            <RoleGate role={role} allow={["OPERATOR", "ADMIN"]}>
              <OperatorPage />
            </RoleGate>
          }
        />
        <Route
          path="/driver"
          element={
            <RoleGate role={role} allow={["DRIVER", "ADMIN"]}>
              <DriverPage />
            </RoleGate>
          }
        />
        <Route
          path="/workshop"
          element={
            <RoleGate role={role} allow={["WORKSHOP", "ADMIN"]}>
              <WorkshopPage />
            </RoleGate>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <RoleGate role={role} allow={["ADMIN"]}>
              <AdminOrdersPage />
            </RoleGate>
          }
        />
        <Route
          path="/admin/cash"
          element={
            <RoleGate role={role} allow={["ADMIN"]}>
              <CashPage />
            </RoleGate>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RoleGate role={role} allow={["ADMIN"]}>
              <ReportsPage />
            </RoleGate>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <RoleGate role={role} allow={["ADMIN"]}>
              <StaffPage />
            </RoleGate>
          }
        />
        <Route path="/login" element={<Navigate to={defaultPathForRole(role)} replace />} />
        <Route path="*" element={<Navigate to={defaultPathForRole(role)} replace />} />
      </Routes>
    </Layout>
  );
}
