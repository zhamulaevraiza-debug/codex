import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { api, ApiError } from "../api";
import type { Order, OrderList, OrderStatus } from "../types";

export function useOrders(params?: { status?: OrderStatus; search?: string }) {
  const { token } = useAuth();
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<OrderList>("/orders", {
        token,
        query: { status: params?.status, search: params?.search, pageSize: 100 },
      });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить");
    } finally {
      setLoading(false);
    }
  }, [token, params?.status, params?.search]);

  useEffect(() => {
    reload();
  }, [reload]);

  const replace = useCallback((updated: Order) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === updated.id);
      if (idx === -1) return [updated, ...prev];
      const next = prev.slice();
      next[idx] = updated;
      return next;
    });
  }, []);

  return { items, loading, error, reload, replace };
}
