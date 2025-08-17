import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SensorReading, { ISensorReading } from "@/models/SensorReading";
import { addAnalyticsJob } from "@/lib/queue";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be an array" },
        { status: 400 }
      );
    }

    if (body.length === 0) {
      return NextResponse.json(
        { error: "No sensor readings provided" },
        { status: 400 }
      );
    }

    await SensorReading.deleteMany({});

    const validReadings: Partial<ISensorReading>[] = body.map((reading) => {
      if (
        typeof reading.field_id !== "string" ||
        typeof reading.sensor_type !== "string" ||
        typeof reading.reading_value !== "number" ||
        typeof reading.unit !== "string"
      ) {
        throw new Error("Invalid reading data");
      }

      return {
        timestamp: reading.timestamp ? new Date(reading.timestamp) : new Date(),
        field_id: reading.field_id,
        sensor_type: reading.sensor_type,
        reading_value: reading.reading_value,
        unit: reading.unit,
      };
    });

    const savedReadings = await SensorReading.insertMany(validReadings);

    const fieldIds = [
      ...new Set(validReadings.map((r) => r.field_id).filter(Boolean)),
    ] as string[];
    await addAnalyticsJob("aggregateDaily", { fieldIds });

    console.log(
      `Sensor POST | Success - ${savedReadings.length} readings saved, analytics queued`
    );

    return NextResponse.json(
      {
        success: true,
        count: savedReadings.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sensor POST | Error:", error);
    return NextResponse.json(
      { error: "Failed to save sensor readings" },
      { status: 500 }
    );
  }
}

// interface QueryParams {
//   field_id?: string;
//   sensor_type?: string;
// }

// export async function GET(request: NextRequest) {
//   try {
//     await dbConnect();

//     const { searchParams } = new URL(request.url);
//     const field_id = searchParams.get("field_id");
//     const sensor_type = searchParams.get("sensor_type");
//     const limit = parseInt(searchParams.get("limit") || "100");

//     const query: QueryParams = {};
//     if (field_id) query.field_id = field_id;
//     if (sensor_type) query.sensor_type = sensor_type;

//     const readings = await SensorReading.find(query)
//       .sort({ timestamp: -1 })
//       .limit(limit);

//     console.log(`Sensor GET | Success - ${readings.length} readings found`);

//     return NextResponse.json({
//       success: true,
//       count: readings.length,
//       data: readings,
//     });
//   } catch (error) {
//     console.error("Sensor GET | Error:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch sensor readings" },
//       { status: 500 }
//     );
//   }
// }
