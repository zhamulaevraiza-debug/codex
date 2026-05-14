import { useState } from "react";
import { useOrders } from "../hooks/useOrders";
import { OrderCard } from "../components/OrderCard";
import { OrderDetail } from "../components/OrderDetail";
import type { Order } from "../types";

export function WorkshopPage() {
  const { items, loading, error, replace } = useOrders();
  const [selected, setSelected] = useState<Order | null>(null);

  const inWorkshop = items.filter((o) => o.status === "IN_WORKSHOP");
  const measured = items.filter((o) => o.status === "MEASURED");

  return (
    <>
      <div className="page-header">
        <h1>Цех</h1>
      </div>
      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="empty">Загрузка…</div> : null}

      <h3 style={{ marginTop: 16, marginBottom: 8 }}>Новые в цехе ({inWorkshop.length})</h3>
      {inWorkshop.length === 0 && !loading ? (
        <div className="empty">Ожидаем привоза от водителей</div>
      ) : (
        <div className="orders-grid grid">
          {inWorkshop.map((order) => (
            <OrderCard key={order.id} order={order} onOpen={setSelected} />
          ))}
        </div>
      )}

      <h3 style={{ marginTop: 24, marginBottom: 8 }}>Готовы к кассе ({measured.length})</h3>
      {measured.length === 0 && !loading ? (
        <div className="empty">Нет обмеренных заявок</div>
      ) : (
        <div className="orders-grid grid">
          {measured.map((order) => (
            <OrderCard key={order.id} order={order} onOpen={setSelected} />
          ))}
        </div>
      )}

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
