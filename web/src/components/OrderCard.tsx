import type { Order } from "../types";
import { StatusBadge } from "./StatusBadge";

export function OrderCard({ order, onOpen }: { order: Order; onOpen: (o: Order) => void }) {
  return (
    <div className="order-card" onClick={() => onOpen(order)}>
      <div className="order-card-head">
        <span className="order-card-number">#{order.number}</span>
        <StatusBadge status={order.status} />
      </div>
      <div className="order-card-customer">{order.customerName}</div>
      <div className="order-card-meta">
        <span>{order.customerPhone}</span>
        <span>{[order.city, order.address].filter(Boolean).join(", ")}</span>
        {order.apartment ? <span>кв. {order.apartment}</span> : null}
      </div>
      <div className="order-card-total">
        {order.totalAmount > 0 ? <>Сумма: <b>{order.totalAmount}</b></> : "Изделия ещё не обмерены"}
        {order.items.length > 0 ? ` · ${order.items.length} шт.` : ""}
      </div>
    </div>
  );
}
