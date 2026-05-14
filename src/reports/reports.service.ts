import { Injectable } from "@nestjs/common";
import {
  CashTransactionType,
  ExpenseCategory,
  OrderStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../common/prisma.service";

type DateRange = { from?: Date; to?: Date };

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(range: DateRange) {
    const where: Prisma.OrderWhereInput = {};
    if (range.from || range.to) {
      where.createdAt = {};
      if (range.from) where.createdAt.gte = range.from;
      if (range.to) where.createdAt.lte = range.to;
    }
    const cashWhere: Prisma.CashTransactionWhereInput = {};
    if (range.from || range.to) {
      cashWhere.createdAt = {};
      if (range.from) cashWhere.createdAt.gte = range.from;
      if (range.to) cashWhere.createdAt.lte = range.to;
    }

    const [statusCountsRaw, totals, transactions] = await this.prisma.$transaction([
      this.prisma.order.groupBy({
        by: ["status"],
        where,
        orderBy: { status: "asc" },
        _count: { _all: true },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      this.prisma.order.aggregate({
        where,
        _count: { _all: true },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      this.prisma.cashTransaction.findMany({
        where: cashWhere,
        select: { type: true, amount: true, category: true },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      Object.values(OrderStatus).map((s) => [s, 0]),
    ) as Record<OrderStatus, number>;
    const statusAmounts = Object.fromEntries(
      Object.values(OrderStatus).map((s) => [s, 0]),
    ) as Record<OrderStatus, number>;
    for (const row of statusCountsRaw) {
      const countObj = row._count as { _all?: number } | undefined;
      statusCounts[row.status] = countObj?._all ?? 0;
      statusAmounts[row.status] = round2(row._sum?.totalAmount ?? 0);
    }

    let income = 0;
    let expense = 0;
    const byCategory: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === CashTransactionType.INCOME) {
        income += t.amount;
      } else {
        expense += t.amount;
        const key = t.category ?? ExpenseCategory.OTHER;
        byCategory[key] = round2((byCategory[key] ?? 0) + t.amount);
      }
    }

    return {
      range,
      orders: {
        total: totals._count._all,
        totalAmount: round2(totals._sum.totalAmount ?? 0),
        paidAmount: round2(totals._sum.paidAmount ?? 0),
        outstanding: round2(
          (totals._sum.totalAmount ?? 0) - (totals._sum.paidAmount ?? 0),
        ),
        byStatus: statusCounts,
        amountByStatus: statusAmounts,
      },
      cash: {
        income: round2(income),
        expense: round2(expense),
        balance: round2(income - expense),
        expenseByCategory: byCategory,
      },
    };
  }

  async daily(range: DateRange) {
    const where: Prisma.OrderWhereInput = {};
    if (range.from || range.to) {
      where.createdAt = {};
      if (range.from) where.createdAt.gte = range.from;
      if (range.to) where.createdAt.lte = range.to;
    }
    const orders = await this.prisma.order.findMany({
      where,
      select: { createdAt: true, totalAmount: true, paidAmount: true, status: true },
    });
    const buckets = new Map<string, { count: number; total: number; paid: number }>();
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10);
      const cur = buckets.get(day) ?? { count: 0, total: 0, paid: 0 };
      cur.count += 1;
      cur.total = round2(cur.total + o.totalAmount);
      cur.paid = round2(cur.paid + o.paidAmount);
      buckets.set(day, cur);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, ...value }));
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
