import mongoose, { Schema, Document } from "mongoose";

export interface ISensorReading extends Document {
  timestamp: Date;
  field_id: string;
  sensor_type: string;
  reading_value: number;
  unit: string;
}

const sensorReadingSchema: Schema<ISensorReading> = new Schema(
  {
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    field_id: {
      type: String,
      required: true,
    },
    sensor_type: {
      type: String,
      required: true,
      enum: [
        "soil_moisture",
        "temperature",
        "humidity",
        "ph",
        "sunlight",
        "rainfall",
        "wind_speed",
        "soil_nitrogen",
      ],
    },
    reading_value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const SensorReading =
  mongoose.models.SensorReading ||
  mongoose.model<ISensorReading>("SensorReading", sensorReadingSchema);

export default SensorReading as mongoose.Model<ISensorReading>;
