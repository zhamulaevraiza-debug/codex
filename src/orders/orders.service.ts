import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CashTransactionType,
  OrderStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { DriverPickupDto } from "./dto/driver-pickup.dto";
import { CreateOrderItemDto, UpdateOrderItemDto } from "./dto/order-item.dto";
import { WorkshopUpdateDto } from "./dto/workshop.dto";
import { ListOrdersDto } from "./dto/list-orders.dto";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { PayOrderDto } from "./dto/pay-order.dto";

const ORDER_INCLUDE = {
  items: { orderBy: { createdAt: "asc" as const } },
  events: { orderBy: { createdAt: "asc" as const } },
  createdBy: { select: { id: true, email: true, profile: { select: { name: true } } } },
  driver: { select: { id: true, email: true, profile: { select: { name: true } } } },
  workshop: { select: { id: true, email: true, profile: { select: { name: true } } } },
  cashier: { select: { id: true, email: true, profile: { select: { name: true } } } },
} satisfies Prisma.OrderInclude;

const STATUS_VISIBILITY: Record<Role, OrderStatus[] | "all"> = {
  ADMIN: "all",
  USER: [],
  OPERATOR: "all",
  DRIVER: [OrderStatus.NEW_PICKUP, OrderStatus.PICKED_UP],
  WORKSHOP: [OrderStatus.IN_WORKSHOP, OrderStatus.MEASURED],
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actorId: string, dto: CreateOrderDto) {
    const order = await this.prisma.$transaction(async (tx) => {
      const number = await this.nextOrderNumber(tx);
      const created = await tx.order.create({
        data: {
          number,
          status: OrderStatus.NEW_PICKUP,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          city: dto.city,
          address: dto.address,
          apartment: dto.apartment,
          entrance: dto.entrance,
          floor: dto.floor,
          operatorNote: dto.operatorNote,
          pickupAt: dto.pickupAt,
          createdById: actorId,
        },
        include: ORDER_INCLUDE,
      });
      await tx.orderEvent.create({
        data: {
          orderId: created.id,
          status: OrderStatus.NEW_PICKUP,
          actorId,
          message: "Заявка создана",
        },
      });
      return created;
    });
    return this.serialize(order);
  }

  async list(role: Role, actorId: string, query: ListOrdersDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;

    const where: Prisma.OrderWhereInput = {};
    const visibility = STATUS_VISIBILITY[role] ?? [];
    if (visibility !== "all") {
      if (visibility.length === 0) {
        return { items: [], total: 0, page, pageSize };
      }
      where.status = { in: visibility };
    }
    if (query.status) {
      if (visibility !== "all" && !visibility.includes(query.status)) {
        return { items: [], total: 0, page, pageSize };
      }
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { customerName: { contains: query.search } },
        { customerPhone: { contains: query.search } },
        { address: { contains: query.search } },
      ];
    }
    if (role === Role.DRIVER) {
      where.AND = [
        {
          OR: [
            { driverId: null },
            { driverId: actorId },
          ],
        },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);
    return {
      items: items.map((o) => this.serialize(o)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(role: Role, actorId: string, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    const visibility = STATUS_VISIBILITY[role] ?? [];
    if (visibility !== "all") {
      const visible = visibility.includes(order.status);
      const ownedByDriver = role === Role.DRIVER && order.driverId === actorId;
      if (!visible && !ownedByDriver) {
        throw new ForbiddenException("Order not visible for this role");
      }
    }
    return this.serialize(order);
  }

  async driverPickup(actorId: string, id: string, dto: DriverPickupDto) {
    const order = await this.getOrFail(id);
    if (
      order.status !== OrderStatus.NEW_PICKUP &&
      order.status !== OrderStatus.PICKED_UP
    ) {
      throw new BadRequestException("Order is not in a pickup state");
    }
    if (order.driverId && order.driverId !== actorId) {
      throw new ForbiddenException("Order already assigned to another driver");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.PICKED_UP,
          driverId: actorId,
          carpetsCount: dto.carpetsCount ?? order.carpetsCount,
          textilesCount: dto.textilesCount ?? order.textilesCount,
          driverNote: dto.driverNote ?? order.driverNote,
          driverPhotos:
            dto.driverPhotos !== undefined
              ? JSON.stringify(dto.driverPhotos)
              : order.driverPhotos,
          pickedUpAt: order.pickedUpAt ?? new Date(),
        },
        include: ORDER_INCLUDE,
      });
      await tx.orderEvent.create({
        data: {
          orderId: id,
          status: OrderStatus.PICKED_UP,
          actorId,
          message: "Ковры забраны у клиента",
        },
      });
      return result;
    });
    return this.serialize(updated);
  }

  async transferToWorkshop(actorId: string, id: string) {
    const order = await this.getOrFail(id);
    if (order.status !== OrderStatus.PICKED_UP) {
      throw new BadRequestException("Order must be picked up before transferring to workshop");
    }
    if (order.driverId !== actorId) {
      throw new ForbiddenException("Only the assigned driver can transfer the order");
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.IN_WORKSHOP,
          arrivedAt: new Date(),
        },
        include: ORDER_INCLUDE,
      });
      await tx.orderEvent.create({
        data: {
          orderId: id,
          status: OrderStatus.IN_WORKSHOP,
          actorId,
          message: "Передано в цех",
        },
      });
      return result;
    });
    return this.serialize(updated);
  }

  async updateWorkshop(actorId: string, id: string, dto: WorkshopUpdateDto) {
    const order = await this.getOrFail(id);
    if (
      order.status !== OrderStatus.IN_WORKSHOP &&
      order.status !== OrderStatus.MEASURED
    ) {
      throw new BadRequestException("Order is not in the workshop");
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id },
        data: {
          pricePerSqm: dto.pricePerSqm ?? order.pricePerSqm,
          workshopNote: dto.workshopNote ?? order.workshopNote,
          workshopId: order.workshopId ?? actorId,
        },
        include: ORDER_INCLUDE,
      });
      return result;
    });
    return this.serialize(updated);
  }

  async addItem(actorId: string, id: string, dto: CreateOrderItemDto) {
    const order = await this.getOrFail(id);
    if (
      order.status !== OrderStatus.IN_WORKSHOP &&
      order.status !== OrderStatus.MEASURED
    ) {
      throw new BadRequestException("Items can be added only while the order is in the workshop");
    }
    const area = round2(dto.length * dto.width);
    const amount = round2(area * dto.pricePerSqm);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderItem.create({
        data: {
          orderId: id,
          label: dto.label,
          length: dto.length,
          width: dto.width,
          area,
          pricePerSqm: dto.pricePerSqm,
          amount,
          defects: dto.defects,
          note: dto.note,
          photos: dto.photos ? JSON.stringify(dto.photos) : null,
        },
      });
      await this.recomputeTotal(tx, id);
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.MEASURED,
          measuredAt: order.measuredAt ?? new Date(),
          workshopId: order.workshopId ?? actorId,
          pricePerSqm: order.pricePerSqm ?? dto.pricePerSqm,
        },
      });
      if (order.status !== OrderStatus.MEASURED) {
        await tx.orderEvent.create({
          data: {
            orderId: id,
            status: OrderStatus.MEASURED,
            actorId,
            message: "Добавлено первое изделие, заявка обмеряна",
          },
        });
      }
      return tx.order.findUniqueOrThrow({
        where: { id },
        include: ORDER_INCLUDE,
      });
    });
    return this.serialize(updated);
  }

  async updateItem(actorId: string, id: string, itemId: string, dto: UpdateOrderItemDto) {
    const order = await this.getOrFail(id);
    if (
      order.status !== OrderStatus.IN_WORKSHOP &&
      order.status !== OrderStatus.MEASURED
    ) {
      throw new BadRequestException("Items can be edited only while the order is in the workshop");
    }
    const item = await this.prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!item || item.orderId !== id) {
      throw new NotFoundException("Item not found");
    }
    const area = round2(dto.length * dto.width);
    const amount = round2(area * dto.pricePerSqm);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderItem.update({
        where: { id: itemId },
        data: {
          label: dto.label,
          length: dto.length,
          width: dto.width,
          area,
          pricePerSqm: dto.pricePerSqm,
          amount,
          defects: dto.defects,
          note: dto.note,
          photos: dto.photos ? JSON.stringify(dto.photos) : null,
        },
      });
      await this.recomputeTotal(tx, id);
      return tx.order.findUniqueOrThrow({
        where: { id },
        include: ORDER_INCLUDE,
      });
    });
    return this.serialize(updated);
  }

  async deleteItem(_actorId: string, id: string, itemId: string) {
    const order = await this.getOrFail(id);
    if (
      order.status !== OrderStatus.IN_WORKSHOP &&
      order.status !== OrderStatus.MEASURED
    ) {
      throw new BadRequestException("Items can be removed only while the order is in the workshop");
    }
    const item = await this.prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!item || item.orderId !== id) {
      throw new NotFoundException("Item not found");
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderItem.delete({ where: { id: itemId } });
      await this.recomputeTotal(tx, id);
      return tx.order.findUniqueOrThrow({
        where: { id },
        include: ORDER_INCLUDE,
      });
    });
    return this.serialize(updated);
  }

  async transferToCash(actorId: string, id: string) {
    const order = await this.getOrFail(id);
    if (order.status !== OrderStatus.MEASURED) {
      throw new BadRequestException("Order must be measured before sending to cash");
    }
    if (order.totalAmount <= 0) {
      throw new BadRequestException("Order total must be greater than zero");
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.AWAITING_PAYMENT,
          readyForCashAt: new Date(),
          workshopId: order.workshopId ?? actorId,
        },
        include: ORDER_INCLUDE,
      });
      await tx.orderEvent.create({
        data: {
          orderId: id,
          status: OrderStatus.AWAITING_PAYMENT,
          actorId,
          message: "Передано в кассу",
        },
      });
      return result;
    });
    return this.serialize(updated);
  }

  async pay(actorId: string, id: string, dto: PayOrderDto) {
    const order = await this.getOrFail(id);
    if (
      order.status !== OrderStatus.AWAITING_PAYMENT &&
      order.status !== OrderStatus.MEASURED
    ) {
      throw new BadRequestException("Order is not ready for payment");
    }
    const due = round2(order.totalAmount - order.paidAmount);
    if (due <= 0) {
      throw new BadRequestException("Order is already fully paid");
    }
    const amount = dto.amount ?? due;
    if (amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }
    if (amount > due + 0.005) {
      throw new BadRequestException("Amount exceeds the outstanding balance");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.cashTransaction.create({
        data: {
          type: CashTransactionType.INCOME,
          amount,
          orderId: id,
          note: dto.note ?? `Оплата заказа #${order.number}`,
          createdById: actorId,
        },
      });
      const paidAmount = round2(order.paidAmount + amount);
      const fullyPaid = paidAmount >= round2(order.totalAmount) - 0.005;
      const result = await tx.order.update({
        where: { id },
        data: {
          paidAmount,
          status: fullyPaid ? OrderStatus.PAID : OrderStatus.AWAITING_PAYMENT,
          paidAt: fullyPaid ? new Date() : order.paidAt,
          cashierId: actorId,
        },
        include: ORDER_INCLUDE,
      });
      await tx.orderEvent.create({
        data: {
          orderId: id,
          status: result.status,
          actorId,
          message: fullyPaid
            ? `Оплачено полностью: ${amount}`
            : `Частичная оплата: ${amount}`,
        },
      });
      return result;
    });
    return this.serialize(updated);
  }

  async cancel(actorId: string, id: string, dto: CancelOrderDto) {
    const order = await this.getOrFail(id);
    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException("Paid orders cannot be cancelled");
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException("Order is already cancelled");
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: dto.reason,
        },
        include: ORDER_INCLUDE,
      });
      await tx.orderEvent.create({
        data: {
          orderId: id,
          status: OrderStatus.CANCELLED,
          actorId,
          message: dto.reason ? `Отменено: ${dto.reason}` : "Отменено",
        },
      });
      return result;
    });
    return this.serialize(updated);
  }

  private async getOrFail(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return order;
  }

  private async recomputeTotal(tx: Prisma.TransactionClient, orderId: string) {
    const sum = await tx.orderItem.aggregate({
      where: { orderId },
      _sum: { amount: true },
    });
    await tx.order.update({
      where: { id: orderId },
      data: { totalAmount: round2(sum._sum.amount ?? 0) },
    });
  }

  private async nextOrderNumber(tx: Prisma.TransactionClient): Promise<number> {
    const last = await tx.order.findFirst({
      orderBy: { number: "desc" },
      select: { number: true },
    });
    return (last?.number ?? 0) + 1;
  }

  private serialize<T extends { driverPhotos?: string | null; items?: unknown[] }>(order: T) {
    const driverPhotos = order.driverPhotos ? safeParseArray(order.driverPhotos) : [];
    const items = Array.isArray(order.items)
      ? (order.items as Array<{ photos?: string | null }>).map((item) => ({
          ...item,
          photos: item.photos ? safeParseArray(item.photos) : [],
        }))
      : order.items;
    return {
      ...order,
      driverPhotos,
      items,
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function safeParseArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
