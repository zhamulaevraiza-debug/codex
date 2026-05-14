import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsOptional } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CashService } from "./cash.service";
import { CreateExpenseDto, CreateIncomeDto } from "./dto/cash-transaction.dto";
import { ListCashDto } from "./dto/list-cash.dto";

class BalanceQuery {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

type AuthRequest = { user: { userId: string; role: Role } };

@ApiTags("cash")
@ApiBearerAuth()
@Controller("cash")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class CashController {
  constructor(private readonly cash: CashService) {}

  @Get("transactions")
  @ApiResponse({ status: 200, description: "List cash transactions" })
  async list(@Query() query: ListCashDto) {
    return this.cash.list(query);
  }

  @Post("income")
  @ApiResponse({ status: 201, description: "Register cash income" })
  async addIncome(@Req() req: AuthRequest, @Body() dto: CreateIncomeDto) {
    return this.cash.addIncome(req.user.userId, dto);
  }

  @Post("expense")
  @ApiResponse({ status: 201, description: "Register cash expense" })
  async addExpense(@Req() req: AuthRequest, @Body() dto: CreateExpenseDto) {
    return this.cash.addExpense(req.user.userId, dto);
  }

  @Get("balance")
  @ApiQuery({ name: "from", required: false, type: String })
  @ApiQuery({ name: "to", required: false, type: String })
  @ApiResponse({ status: 200, description: "Cash balance summary" })
  async balance(@Query() query: BalanceQuery) {
    return this.cash.balance(query.from, query.to);
  }
}
