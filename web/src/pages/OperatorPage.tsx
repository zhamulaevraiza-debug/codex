import { useState } from "react";
import { useAuth } from "../auth";
import { api, ApiError } from "../api";
import { OrderCard } from "../components/OrderCard";
import { OrderDetail } from "../components/OrderDetail";
import { Modal } from "../components/Modal";
import { useOrders } from "../hooks/useOrders";
import type { Order } from "../types";

export function OperatorPage() {
  const { token } = useAuth();
  const { items, loading, error, replace, reload } = useOrders();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);

  return (
    <>
      <div className="page-header">
        <h1>Заявки оператора</h1>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          + Новая заявка
        </button>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="empty">Загрузка…</div> : null}
      {!loading && items.length === 0 ? (
        <div className="empty">Заявок пока нет. Нажмите «Новая заявка», чтобы добавить.</div>
      ) : null}

      <div className="orders-grid grid">
        {items.map((order) => (
          <OrderCard key={order.id} order={order} onOpen={setSelected} />
        ))}
      </div>

      {creating ? (
        <CreateOrderModal
          token={token}
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            await reload();
          }}
        />
      ) : null}

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

function CreateOrderModal({
  token,
  onClose,
  onCreated,
}: {
  token: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [operatorNote, setOperatorNote] = useState("");
  const [pickupAt, setPickupAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api<Order>("/orders", {
        token,
        body: {
          customerName,
          customerPhone,
          city: city || undefined,
          address,
          apartment: apartment || undefined,
          entrance: entrance || undefined,
          floor: floor || undefined,
          operatorNote: operatorNote || undefined,
          pickupAt: pickupAt ? new Date(pickupAt).toISOString() : undefined,
        },
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Новая заявка на забор" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {error ? <div className="error">{error}</div> : null}
        <div className="form-row">
          <div className="field">
            <label>Имя клиента *</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Телефон *</label>
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Город / село</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="field">
            <label>Адрес *</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Квартира</label>
            <input value={apartment} onChange={(e) => setApartment(e.target.value)} />
          </div>
          <div className="field">
            <label>Подъезд</label>
            <input value={entrance} onChange={(e) => setEntrance(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Этаж</label>
            <input value={floor} onChange={(e) => setFloor(e.target.value)} />
          </div>
          <div className="field">
            <label>Дата и время забора</label>
            <input
              type="datetime-local"
              value={pickupAt}
              onChange={(e) => setPickupAt(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label>Комментарий</label>
          <textarea
            value={operatorNote}
            onChange={(e) => setOperatorNote(e.target.value)}
            placeholder="Доп. инструкции водителю"
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Сохраняем…" : "Создать заявку"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
