import { useState } from "react";
import { useAuth } from "../auth";
import { api, ApiError } from "../api";
import { Modal } from "./Modal";
import { StatusBadge } from "./StatusBadge";
import { STATUS_LABEL, type Order } from "../types";

type Props = {
  order: Order;
  onClose: () => void;
  onChanged: (next: Order) => void;
};

export function OrderDetail({ order, onClose, onChanged }: Props) {
  const { token, role } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Driver pickup form state
  const [carpetsCount, setCarpetsCount] = useState<string>(order.carpetsCount?.toString() ?? "");
  const [textilesCount, setTextilesCount] = useState<string>(order.textilesCount?.toString() ?? "");
  const [driverNote, setDriverNote] = useState<string>(order.driverNote ?? "");

  // Workshop new-item state
  const [itemLabel, setItemLabel] = useState("");
  const [itemLength, setItemLength] = useState("");
  const [itemWidth, setItemWidth] = useState("");
  const [itemPrice, setItemPrice] = useState(order.pricePerSqm?.toString() ?? "");
  const [itemDefects, setItemDefects] = useState("");

  // Payment
  const due = Math.max(0, +(order.totalAmount - order.paidAmount).toFixed(2));
  const [payAmount, setPayAmount] = useState(due.toString());

  // Cancel
  const [cancelReason, setCancelReason] = useState("");

  async function call<T>(fn: () => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ошибка операции");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function doDriverPickup() {
    const next = await call(() =>
      api<Order>(`/orders/${order.id}/driver-pickup`, {
        method: "PATCH",
        token,
        body: {
          carpetsCount: carpetsCount ? Number(carpetsCount) : undefined,
          textilesCount: textilesCount ? Number(textilesCount) : undefined,
          driverNote: driverNote || undefined,
        },
      }),
    );
    if (next) onChanged(next);
  }

  async function doTransferToWorkshop() {
    const next = await call(() =>
      api<Order>(`/orders/${order.id}/transfer-to-workshop`, { method: "PATCH", token }),
    );
    if (next) onChanged(next);
  }

  async function doAddItem() {
    if (!itemLength || !itemWidth || !itemPrice) {
      setError("Укажите длину, ширину и цену за м²");
      return;
    }
    const next = await call(() =>
      api<Order>(`/orders/${order.id}/items`, {
        token,
        body: {
          label: itemLabel || undefined,
          length: Number(itemLength),
          width: Number(itemWidth),
          pricePerSqm: Number(itemPrice),
          defects: itemDefects || undefined,
        },
      }),
    );
    if (next) {
      onChanged(next);
      setItemLabel("");
      setItemLength("");
      setItemWidth("");
      setItemDefects("");
    }
  }

  async function doDeleteItem(itemId: string) {
    const next = await call(() =>
      api<Order>(`/orders/${order.id}/items/${itemId}`, { method: "DELETE", token }),
    );
    if (next) onChanged(next);
  }

  async function doTransferToCash() {
    const next = await call(() =>
      api<Order>(`/orders/${order.id}/transfer-to-cash`, { method: "PATCH", token }),
    );
    if (next) onChanged(next);
  }

  async function doPay() {
    const next = await call(() =>
      api<Order>(`/orders/${order.id}/pay`, {
        method: "PATCH",
        token,
        body: payAmount ? { amount: Number(payAmount) } : {},
      }),
    );
    if (next) onChanged(next);
  }

  async function doCancel() {
    if (!confirm("Отменить заявку?")) return;
    const next = await call(() =>
      api<Order>(`/orders/${order.id}/cancel`, {
        method: "PATCH",
        token,
        body: cancelReason ? { reason: cancelReason } : {},
      }),
    );
    if (next) onChanged(next);
  }

  const isDriver = role === "DRIVER" || role === "ADMIN";
  const isWorkshop = role === "WORKSHOP" || role === "ADMIN";
  const isOperator = role === "OPERATOR" || role === "ADMIN";
  const isAdmin = role === "ADMIN";

  return (
    <Modal title={`Заявка #${order.number}`} onClose={onClose}>
      {error ? <div className="error" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="modal-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <StatusBadge status={order.status} />
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            создано {new Date(order.createdAt).toLocaleString("ru-RU")}
          </span>
        </div>
      </div>

      <div className="modal-section">
        <h3>Клиент</h3>
        <dl className="kv">
          <dt>Имя</dt><dd>{order.customerName}</dd>
          <dt>Телефон</dt><dd>{order.customerPhone}</dd>
          <dt>Адрес</dt>
          <dd>{[order.city, order.address].filter(Boolean).join(", ")}</dd>
          {order.apartment || order.entrance || order.floor ? (
            <>
              <dt>Доп.</dt>
              <dd>
                {order.apartment ? `кв. ${order.apartment}` : ""}
                {order.entrance ? ` · подъезд ${order.entrance}` : ""}
                {order.floor ? ` · этаж ${order.floor}` : ""}
              </dd>
            </>
          ) : null}
          {order.operatorNote ? (
            <>
              <dt>Заметка</dt>
              <dd>{order.operatorNote}</dd>
            </>
          ) : null}
          {order.pickupAt ? (
            <>
              <dt>Забор</dt>
              <dd>{new Date(order.pickupAt).toLocaleString("ru-RU")}</dd>
            </>
          ) : null}
        </dl>
      </div>

      {/* DRIVER */}
      {isDriver && (order.status === "NEW_PICKUP" || order.status === "PICKED_UP") && (
        <div className="modal-section">
          <h3>Заполняет водитель</h3>
          <div className="form-row">
            <div className="field">
              <label>Кол-во ковров</label>
              <input
                type="number"
                min={0}
                value={carpetsCount}
                onChange={(e) => setCarpetsCount(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Кол-во текстиля</label>
              <input
                type="number"
                min={0}
                value={textilesCount}
                onChange={(e) => setTextilesCount(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Комментарий водителя</label>
            <textarea
              value={driverNote}
              onChange={(e) => setDriverNote(e.target.value)}
              placeholder="Состояние ковров, особенности"
            />
          </div>
          <div className="actions">
            <button className="btn" onClick={doDriverPickup} disabled={busy}>
              Сохранить
            </button>
            {order.status === "PICKED_UP" ? (
              <button className="btn btn-primary" onClick={doTransferToWorkshop} disabled={busy}>
                Передать в цех
              </button>
            ) : (
              <button className="btn btn-primary" onClick={async () => {
                await doDriverPickup();
                await doTransferToWorkshop();
              }} disabled={busy}>
                Сохранить и передать в цех
              </button>
            )}
          </div>
        </div>
      )}

      {/* WORKSHOP items */}
      {(isWorkshop || isAdmin) &&
        (order.status === "IN_WORKSHOP" || order.status === "MEASURED") && (
          <div className="modal-section">
            <h3>Изделия (цех)</h3>
            <ItemsTable items={order.items} canDelete={isWorkshop} onDelete={doDeleteItem} />
            <div className="form" style={{ marginTop: 12 }}>
              <div className="form-row">
                <div className="field">
                  <label>Название</label>
                  <input
                    value={itemLabel}
                    onChange={(e) => setItemLabel(e.target.value)}
                    placeholder="Ковер 1"
                  />
                </div>
                <div className="field">
                  <label>Цена за м²</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Длина (м)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={itemLength}
                    onChange={(e) => setItemLength(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Ширина (м)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={itemWidth}
                    onChange={(e) => setItemWidth(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>Дефекты</label>
                <input
                  value={itemDefects}
                  onChange={(e) => setItemDefects(e.target.value)}
                  placeholder="Пятна, моль…"
                />
              </div>
              <div className="actions">
                <button className="btn btn-primary" onClick={doAddItem} disabled={busy}>
                  Добавить изделие
                </button>
                {order.status === "MEASURED" && order.totalAmount > 0 ? (
                  <button className="btn btn-primary" onClick={doTransferToCash} disabled={busy}>
                    Передать в кассу
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}

      {/* Items read-only after workshop */}
      {(order.status === "AWAITING_PAYMENT" || order.status === "PAID") && order.items.length > 0 && (
        <div className="modal-section">
          <h3>Изделия</h3>
          <ItemsTable items={order.items} canDelete={false} onDelete={() => {}} />
          <div style={{ marginTop: 8, textAlign: "right", fontWeight: 600 }}>
            Итого: {order.totalAmount}
          </div>
        </div>
      )}

      {/* CASH */}
      {isAdmin && order.status === "AWAITING_PAYMENT" && (
        <div className="modal-section">
          <h3>Касса</h3>
          <div className="form-row">
            <div className="field">
              <label>Сумма к оплате</label>
              <input value={order.totalAmount} disabled />
            </div>
            <div className="field">
              <label>Оплатить</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={doPay} disabled={busy}>
              Зафиксировать оплату
            </button>
          </div>
        </div>
      )}

      {order.status === "PAID" && (
        <div className="modal-section">
          <h3>Оплачено</h3>
          <dl className="kv">
            <dt>Сумма</dt>
            <dd>{order.paidAmount}</dd>
            {order.paidAt ? (
              <>
                <dt>Когда</dt>
                <dd>{new Date(order.paidAt).toLocaleString("ru-RU")}</dd>
              </>
            ) : null}
          </dl>
        </div>
      )}

      {/* CANCEL */}
      {isOperator && order.status !== "PAID" && order.status !== "CANCELLED" && (
        <div className="modal-section">
          <h3>Отмена</h3>
          <div className="field">
            <label>Причина (необязательно)</label>
            <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          </div>
          <div className="actions">
            <button className="btn btn-danger" onClick={doCancel} disabled={busy}>
              Отменить заявку
            </button>
          </div>
        </div>
      )}

      {order.events.length > 0 && (
        <div className="modal-section">
          <h3>История</h3>
          <div className="event-list">
            {order.events.map((event) => (
              <div className="event" key={event.id}>
                <span className="event-time">
                  {new Date(event.createdAt).toLocaleString("ru-RU")}
                </span>
                <span>
                  <b>{STATUS_LABEL[event.status]}</b>
                  {event.message ? ` — ${event.message}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function ItemsTable({
  items,
  canDelete,
  onDelete,
}: {
  items: Order["items"];
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) {
    return <div className="empty" style={{ padding: 12 }}>Пока не добавлено</div>;
  }
  return (
    <table className="items-table">
      <thead>
        <tr>
          <th>Название</th>
          <th>Д × Ш</th>
          <th>м²</th>
          <th>Цена</th>
          <th>Сумма</th>
          <th>Дефекты</th>
          {canDelete ? <th /> : null}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.label ?? "—"}</td>
            <td>{item.length} × {item.width}</td>
            <td>{item.area}</td>
            <td>{item.pricePerSqm}</td>
            <td>{item.amount}</td>
            <td>{item.defects ?? "—"}</td>
            {canDelete ? (
              <td>
                <button className="btn btn-ghost" onClick={() => onDelete(item.id)}>
                  ✕
                </button>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
