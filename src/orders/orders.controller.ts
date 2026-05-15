import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { DriverPickupDto } from "./dto/driver-pickup.dto";
import { CreateOrderItemDto, UpdateOrderItemDto } from "./dto/order-item.dto";
import { WorkshopUpdateDto } from "./dto/workshop.dto";
import { ListOrdersDto } from "./dto/list-orders.dto";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { PayOrderDto } from "./dto/pay-order.dto";

type AuthRequest = { user: { userId: string; role: Role } };

@ApiTags("orders")
@ApiBearerAuth()
@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiResponse({ status: 200, description: "List orders visible to the current role" })
  async list(@Req() req: AuthRequest, @Query() query: ListOrdersDto) {
    return this.orders.list(req.user.role, req.user.userId, query);
  }

  @Get(":id")
  @ApiResponse({ status: 200, description: "Order details" })
  async detail(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.orders.findOne(req.user.role, req.user.userId, id);
  }

  @Post()
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiResponse({ status: 201, description: "Create a new pickup request" })
  async create(@Req() req: AuthRequest, @Body() dto: CreateOrderDto) {
    return this.orders.create(req.user.userId, dto);
  }

  @Patch(":id/driver-pickup")
  @Roles(Role.DRIVER, Role.ADMIN)
  @ApiResponse({ status: 200, description: "Driver fills in pickup details" })
  async driverPickup(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() dto: DriverPickupDto,
  ) {
    return this.orders.driverPickup(req.user.userId, id, dto);
  }

  @Patch(":id/transfer-to-workshop")
  @Roles(Role.DRIVER, Role.ADMIN)
  @ApiResponse({ status: 200, description: "Driver transfers carpets to the workshop" })
  async transferToWorkshop(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.orders.transferToWorkshop(req.user.userId, id);
  }

  @Patch(":id/workshop")
  @Roles(Role.WORKSHOP, Role.ADMIN)
  @ApiResponse({ status: 200, description: "Workshop updates price/notes" })
  async updateWorkshop(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() dto: WorkshopUpdateDto,
  ) {
    return this.orders.updateWorkshop(req.user.userId, id, dto);
  }

  @Post(":id/items")
  @Roles(Role.WORKSHOP, Role.ADMIN)
  @ApiResponse({ status: 201, description: "Add a measured carpet to the order" })
  async addItem(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() dto: CreateOrderItemDto,
  ) {
    return this.orders.addItem(req.user.userId, id, dto);
  }

  @Patch(":id/items/:itemId")
  @Roles(Role.WORKSHOP, Role.ADMIN)
  @ApiResponse({ status: 200, description: "Update a measured item" })
  async updateItem(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateOrderItemDto,
  ) {
    return this.orders.updateItem(req.user.userId, id, itemId, dto);
  }

  @Delete(":id/items/:itemId")
  @Roles(Role.WORKSHOP, Role.ADMIN)
  @ApiResponse({ status: 200, description: "Delete a measured item" })
  async deleteItem(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
  ) {
    return this.orders.deleteItem(req.user.userId, id, itemId);
  }

  @Patch(":id/transfer-to-cash")
  @Roles(Role.WORKSHOP, Role.ADMIN)
  @ApiResponse({ status: 200, description: "Workshop hands off the order to cash" })
  async transferToCash(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.orders.transferToCash(req.user.userId, id);
  }

  @Patch(":id/pay")
  @Roles(Role.ADMIN)
  @ApiResponse({ status: 200, description: "Cashier registers a payment" })
  async pay(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() dto: PayOrderDto,
  ) {
    return this.orders.pay(req.user.userId, id, dto);
  }

  @Patch(":id/cancel")
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiResponse({ status: 200, description: "Cancel an order" })
  async cancel(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orders.cancel(req.user.userId, id, dto);
  }
}
