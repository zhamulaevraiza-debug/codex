import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CashTransactionType,
  ExpenseCategory,
  OrderStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { CreateExpenseDto, CreateIncomeDto } from "./dto/cash-transaction.dto";
import { ListCashDto } from "./dto/list-cash.dto";

@Injectable()
export class CashService {
  constructor(private readonly prisma: PrismaService) {}

  async addIncome(actorId: string, dto: CreateIncomeDto) {
    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
      if (!order) {
        throw new NotFoundException("Order not found");
      }
      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException("Cannot register income on a cancelled order");
      }
    }
    const tx = await this.prisma.cashTransaction.create({
      data: {
        type: CashTransactionType.INCOME,
        amount: round2(dto.amount),
        orderId: dto.orderId,
        note: dto.note,
        createdById: actorId,
      },
    });
    return tx;
  }

  async addExpense(actorId: string, dto: CreateExpenseDto) {
    const tx = await this.prisma.cashTransaction.create({
      data: {
        type: CashTransactionType.EXPENSE,
        amount: round2(dto.amount),
        category: dto.category,
        note: dto.note,
        createdById: actorId,
      },
    });
    return tx;
  }

  async list(query: ListCashDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 50;
    const where: Prisma.CashTransactionWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = query.from;
      if (query.to) where.createdAt.lte = query.to;
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.cashTransaction.findMany({
        where,
        include: {
          order: { select: { id: true, number: true, customerName: true } },
          createdBy: {
            select: { id: true, email: true, profile: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.cashTransaction.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async balance(from?: Date, to?: Date) {
    const where: Prisma.CashTransactionWhereInput = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }
    const transactions = await this.prisma.cashTransaction.findMany({
      where,
      select: { type: true, amount: true, category: true },
    });
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
      income: round2(income),
      expense: round2(expense),
      balance: round2(income - expense),
      expenseByCategory: byCategory,
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
