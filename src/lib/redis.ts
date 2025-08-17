import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const bullMQConfig = {
  host: new URL(process.env.UPSTASH_REDIS_REST_URL!).hostname,
  port: 6379,
  password: process.env.UPSTASH_REDIS_REST_TOKEN,
  tls: {},
};

export default redis;
