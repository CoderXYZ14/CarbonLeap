import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SensorReading from "@/models/SensorReading";

interface AnalyticsQuery {
  field_id?: string;
  timestamp?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get("field_id");
    const hours = parseInt(searchParams.get("hours") || "24");

    const query: AnalyticsQuery = {};
    if (fieldId) query.field_id = fieldId;

    // Get analytics for all sensor types
    const sensorTypes = [
      "soil_moisture",
      "temperature",
      "humidity",
      "ph",
      "sunlight",
      "rainfall",
      "wind_speed",
      "soil_nitrogen",
    ];

    // Get basic analytics by sensor type
    const analytics = await Promise.all(
      sensorTypes.map(async (type) => {
        const readings = await SensorReading.find({
          ...query,
          sensor_type: type,
        })
          .sort({ timestamp: -1 })
          .limit(100);

        if (readings.length === 0) return null;

        const values = readings.map((r) => r.reading_value);
        const average = values.reduce((a, b) => a + b, 0) / values.length;

        return {
          sensor_type: type,
          average: Math.round(average * 100) / 100,
          min: Math.min(...values),
          max: Math.max(...values),
          unit: readings[0].unit,
          count: readings.length,
          recent_readings: readings.slice(0, 5).map((r) => ({
            timestamp: r.timestamp,
            value: r.reading_value,
            field_id: r.field_id,
          })),
        };
      })
    );

    // Get trends by hour (last 24 hours or specified hours)
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    const hourlyTrends = await SensorReading.aggregate([
      {
        $match: {
          ...query,
          timestamp: { $gte: hoursAgo },
        },
      },
      {
        $group: {
          _id: {
            sensor_type: "$sensor_type",
            hour: { $hour: "$timestamp" },
            field_id: "$field_id",
          },
          average: { $avg: "$reading_value" },
          count: { $sum: 1 },
          latest: { $max: "$timestamp" },
        },
      },
      {
        $sort: { "_id.hour": 1 },
      },
    ]);

    // Get statistics by field
    const fieldStats = await SensorReading.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$field_id",
          totalReadings: { $sum: 1 },
          lastReading: { $max: "$timestamp" },
          sensorTypes: { $addToSet: "$sensor_type" },
          avgSoilMoisture: {
            $avg: {
              $cond: [
                { $eq: ["$sensor_type", "soil_moisture"] },
                "$reading_value",
                null,
              ],
            },
          },
          avgTemperature: {
            $avg: {
              $cond: [
                { $eq: ["$sensor_type", "temperature"] },
                "$reading_value",
                null,
              ],
            },
          },
        },
      },
      { $sort: { totalReadings: -1 } },
    ]);

    // Get overall statistics
    const totalReadings = await SensorReading.countDocuments(query);
    const latestReading = await SensorReading.findOne(query).sort({
      timestamp: -1,
    });

    console.log("Analytics | Fetching analytics successfully");

    return NextResponse.json({
      success: true,
      summary: {
        totalReadings,
        latestReading: latestReading?.timestamp,
        fieldsCount: fieldStats.length,
        hoursAnalyzed: hours,
      },
      analytics: analytics.filter(Boolean),
      fieldStats,
      hourlyTrends,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
