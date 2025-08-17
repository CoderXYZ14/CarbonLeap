import { Queue, Worker, Job } from "bullmq";
import { bullMQConfig, redis } from "./redis";
import dbConnect from "./dbConnect";
import SensorReading from "@/models/SensorReading";

interface AnalyticsJobData {
  fieldIds?: string[];
}

export const analyticsQueue = new Queue<AnalyticsJobData>("analytics", {
  connection: bullMQConfig,
});

export const analyticsWorker = new Worker<AnalyticsJobData>(
  "analytics",
  async (job: Job<AnalyticsJobData>) => {
    try {
      await dbConnect();

      switch (job.name) {
        case "aggregateDaily":
          await aggregateDailyStats(job.data);
          break;
        case "cleanOldData":
          await cleanOldData();
          break;
        default:
          console.log(`Job ${job.id} | Unknown job type: ${job.name}`);
      }

      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error(`Job ${job.id} | Failed:`, error);
      throw error;
    }
  },
  {
    connection: bullMQConfig,
  }
);

analyticsWorker.on(
  "failed",
  (job: Job<AnalyticsJobData> | undefined, err: Error) => {
    console.error(`Job ${job?.id} | Failed | ${err.message}`);
  }
);

async function aggregateDailyStats(data: AnalyticsJobData) {
  const fieldIds = data?.fieldIds || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = await SensorReading.aggregate([
    {
      $match: {
        timestamp: { $gte: today },
        ...(fieldIds.length > 0 ? { field_id: { $in: fieldIds } } : {}),
      },
    },
    {
      $group: {
        _id: {
          field_id: "$field_id",
          sensor_type: "$sensor_type",
        },
        avgValue: { $avg: "$reading_value" },
        minValue: { $min: "$reading_value" },
        maxValue: { $max: "$reading_value" },
        count: { $sum: 1 },
      },
    },
  ]);

  const cacheKey = `daily_stats_${today.toISOString().split("T")[0]}`;
  await redis.set(cacheKey, JSON.stringify(stats));
}

async function cleanOldData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  await SensorReading.deleteMany({
    timestamp: { $lt: thirtyDaysAgo },
  });
}

export async function addAnalyticsJob(
  jobName: string,
  data: AnalyticsJobData = {}
) {
  try {
    const job = await analyticsQueue.add(jobName, data, {
      removeOnComplete: 10,
      removeOnFail: 5,
      delay: 1000,
    });

    console.log(`Queue | Added job: ${jobName}`);
    return job;
  } catch (error) {
    console.error("Queue | Failed to add job:", error);
    throw error;
  }
}
