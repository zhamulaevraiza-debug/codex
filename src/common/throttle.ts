import { ThrottlerModuleOptions } from "@nestjs/throttler";

export const throttlerConfig: ThrottlerModuleOptions = [
  {
    name: "default",
    ttl: 60,
    limit: 120,
  },
  {
    name: "public",
    ttl: 60,
    limit: 30,
  },
];
