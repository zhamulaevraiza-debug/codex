import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { api, ApiError } from "../api";
import { Modal } from "../components/Modal";
import {
  EXPENSE_LABEL,
  type CashBalance,
  type CashTransaction,
  type ExpenseCategory,
} from "../types";

export function CashPage() {
  const { token } = useAuth();
  const [balance, setBalance] = useState<CashBalance | null>(null);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"income" | "expense" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, t] = await Promise.all([
        api<CashBalance>("/cash/balance", { token }),
        api<{ items: CashTransaction[] }>("/cash/transactions", {
          token,
          query: { pageSize: 100 },
        }),
      ]);
      setBalance(b);
      setTransactions(t.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить кассу");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="page-header">
        <h1>Касса</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setModal("income")}>
            + Приход
          </button>
          <button className="btn" onClick={() => setModal("expense")}>
            + Расход
          </button>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}

      {balance ? (
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-label">Приход</div>
            <div className="stat-value" style={{ color: "var(--success)" }}>
              {balance.income}
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">Расход</div>
            <div className="stat-value" style={{ color: "var(--danger)" }}>
              {balance.expense}
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">Остаток</div>
            <div className="stat-value">{balance.balance}</div>
          </div>
        </div>
      ) : null}

      {balance && Object.keys(balance.expenseByCategory).length > 0 ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 13, color: "var(--muted)", textTransform: "uppercase" }}>
            Расходы по категориям
          </h3>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 16 }}>
            {Object.entries(balance.expenseByCategory).map(([cat, amount]) => (
              <div key={cat}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {EXPENSE_LABEL[cat as ExpenseCategory]}
                </div>
                <div style={{ fontWeight: 600 }}>{amount}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <h3 style={{ marginBottom: 8 }}>История операций</h3>
      {loading ? (
        <div className="empty">Загрузка…</div>
      ) : transactions.length === 0 ? (
        <div className="empty">Операций пока нет</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Тип</th>
              <th>Сумма</th>
              <th>Категория / заказ</th>
              <th>Комментарий</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.createdAt).toLocaleString("ru-RU")}</td>
                <td>
                  {t.type === "INCOME" ? (
                    <span style={{ color: "var(--success)", fontWeight: 600 }}>Приход</span>
                  ) : (
                    <span style={{ color: "var(--danger)", fontWeight: 600 }}>Расход</span>
                  )}
                </td>
                <td>{t.amount}</td>
                <td>
                  {t.category ? EXPENSE_LABEL[t.category] : null}
                  {t.order ? `Заказ #${t.order.number} · ${t.order.customerName}` : null}
                </td>
                <td>{t.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal === "income" ? (
        <IncomeModal token={token} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      ) : null}
      {modal === "expense" ? (
        <ExpenseModal token={token} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      ) : null}
    </>
  );
}

function IncomeModal({
  token,
  onClose,
  onSaved,
}: {
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api<unknown>("/cash/income", {
        token,
        body: { amount: Number(amount), note: note || undefined },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Приход" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {error ? <div className="error">{error}</div> : null}
        <div className="field">
          <label>Сумма *</label>
          <input type="number" min={0.01} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="field">
          <label>Комментарий</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Отмена</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ExpenseModal({
  token,
  onClose,
  onSaved,
}: {
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("CHEMISTRY");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api<unknown>("/cash/expense", {
        token,
        body: { amount: Number(amount), category, note: note || undefined },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Расход" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {error ? <div className="error">{error}</div> : null}
        <div className="form-row">
          <div className="field">
            <label>Сумма *</label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Категория *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {(Object.keys(EXPENSE_LABEL) as ExpenseCategory[]).map((c) => (
                <option key={c} value={c}>{EXPENSE_LABEL[c]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Комментарий</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Отмена</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
