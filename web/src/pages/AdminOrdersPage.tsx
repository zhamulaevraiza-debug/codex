import { useState } from "react";
import { useOrders } from "../hooks/useOrders";
import { OrderCard } from "../components/OrderCard";
import { OrderDetail } from "../components/OrderDetail";
import { STATUS_LABEL, type Order, type OrderStatus } from "../types";

export function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const { items, loading, error, replace } = useOrders({
    status: (status || undefined) as OrderStatus | undefined,
    search: search || undefined,
  });
  const [selected, setSelected] = useState<Order | null>(null);

  return (
    <>
      <div className="page-header">
        <h1>Все заявки</h1>
      </div>

      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "")}>
          <option value="">Все статусы</option>
          {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <input
          placeholder="Поиск по имени/телефону/адресу"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="empty">Загрузка…</div> : null}
      {!loading && items.length === 0 ? <div className="empty">Заявки не найдены</div> : null}

      <div className="orders-grid grid">
        {items.map((order) => (
          <OrderCard key={order.id} order={order} onOpen={setSelected} />
        ))}
      </div>

      {selected ? (
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onChanged={(next) => {
            replace(next);
            setSelected(next);
          }}
        />
      ) : null}
    </>
  );
}
