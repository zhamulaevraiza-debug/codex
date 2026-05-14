export type Role = "ADMIN" | "OPERATOR" | "DRIVER" | "WORKSHOP" | "USER";

export type OrderStatus =
  | "NEW_PICKUP"
  | "PICKED_UP"
  | "IN_WORKSHOP"
  | "MEASURED"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "CANCELLED";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW_PICKUP: "Заявка на забор",
  PICKED_UP: "Забор выполнен",
  IN_WORKSHOP: "В цехе",
  MEASURED: "Обмеряно",
  AWAITING_PAYMENT: "Ожидает оплаты",
  PAID: "Оплачено",
  CANCELLED: "Отменено",
};

export type ExpenseCategory =
  | "CHEMISTRY"
  | "PERFUME"
  | "FUEL"
  | "SALARY"
  | "RENT"
  | "OTHER";

export const EXPENSE_LABEL: Record<ExpenseCategory, string> = {
  CHEMISTRY: "Химия",
  PERFUME: "Парфюм",
  FUEL: "Топливо",
  SALARY: "Зарплата",
  RENT: "Аренда",
  OTHER: "Другое",
};

export interface OrderItem {
  id: string;
  label: string | null;
  length: number;
  width: number;
  area: number;
  pricePerSqm: number;
  amount: number;
  defects: string | null;
  note: string | null;
  photos: string[];
}

export interface OrderEvent {
  id: string;
  status: OrderStatus;
  message: string | null;
  createdAt: string;
}

export interface UserBrief {
  id: string;
  email: string;
  profile?: { name?: string | null } | null;
}

export interface Order {
  id: string;
  number: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  city: string | null;
  address: string;
  apartment: string | null;
  entrance: string | null;
  floor: string | null;
  operatorNote: string | null;
  pickupAt: string | null;
  carpetsCount: number | null;
  textilesCount: number | null;
  driverNote: string | null;
  driverPhotos: string[];
  workshopNote: string | null;
  pricePerSqm: number | null;
  totalAmount: number;
  paidAmount: number;
  pickedUpAt: string | null;
  arrivedAt: string | null;
  measuredAt: string | null;
  readyForCashAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  events: OrderEvent[];
  createdBy: UserBrief;
  driver: UserBrief | null;
  workshop: UserBrief | null;
  cashier: UserBrief | null;
}

export interface OrderList {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CashTransaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: ExpenseCategory | null;
  orderId: string | null;
  note: string | null;
  createdAt: string;
  order?: { id: string; number: number; customerName: string } | null;
  createdBy?: UserBrief | null;
}

export interface CashBalance {
  income: number;
  expense: number;
  balance: number;
  expenseByCategory: Partial<Record<ExpenseCategory, number>>;
}

export interface ReportsOverview {
  range: { from?: string; to?: string };
  orders: {
    total: number;
    totalAmount: number;
    paidAmount: number;
    outstanding: number;
    byStatus: Record<OrderStatus, number>;
    amountByStatus: Record<OrderStatus, number>;
  };
  cash: CashBalance;
}

export interface StaffUser {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  profile?: { name?: string | null } | null;
}
