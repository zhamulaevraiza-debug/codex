import { useState } from "react";
import { useOrders } from "../hooks/useOrders";
import { OrderCard } from "../components/OrderCard";
import { OrderDetail } from "../components/OrderDetail";
import type { Order } from "../types";

export function DriverPage() {
  const { items, loading, error, replace } = useOrders();
  const [selected, setSelected] = useState<Order | null>(null);

  const pickups = items.filter((o) => o.status === "NEW_PICKUP");
  const inHands = items.filter((o) => o.status === "PICKED_UP");

  return (
    <>
      <div className="page-header">
        <h1>Маршруты водителя</h1>
      </div>
      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="empty">Загрузка…</div> : null}

      <h3 style={{ marginTop: 16, marginBottom: 8 }}>На забор ({pickups.length})</h3>
      {pickups.length === 0 && !loading ? (
        <div className="empty">Свободных заявок нет</div>
      ) : (
        <div className="orders-grid grid">
          {pickups.map((order) => (
            <OrderCard key={order.id} order={order} onOpen={setSelected} />
          ))}
        </div>
      )}

      <h3 style={{ marginTop: 24, marginBottom: 8 }}>Везу в цех ({inHands.length})</h3>
      {inHands.length === 0 && !loading ? (
        <div className="empty">Сейчас ничего не у меня</div>
      ) : (
        <div className="orders-grid grid">
          {inHands.map((order) => (
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
