"use client";

import { useState, useEffect } from "react";
import { BarChart3, Activity, RefreshCw, ArrowLeft } from "lucide-react";
import axios from "axios";
import Link from "next/link";

interface Analytics {
  sensor_type: string;
  average: number;
  min: number;
  max: number;
  unit: string;
  count: number;
}

interface AnalyticsResponse {
  success: boolean;
  summary: {
    totalReadings: number;
    latestReading: string;
  };
  analytics: Analytics[];
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const response = await axios.get("/api/analytics");
      setAnalytics(response.data);
    } catch (error) {
      console.error("Dashboard | Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getSensorIcon = (sensorType: string) => {
    const icons = {
      temperature: "🌡️",
      humidity: "💧",
      soil_moisture: "🌱",
      ph: "⚗️",
      sunlight: "☀️",
      rainfall: "🌧️",
      wind_speed: "💨",
      soil_nitrogen: "🧪",
    };
    return icons[sensorType as keyof typeof icons] || "📊";
  };

  const getProgressPercentage = (current: number, min: number, max: number) => {
    if (max === min) return 50;
    return Math.min(((current - min) / (max - min)) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </Link>
              <div className="flex items-center space-x-3">
                <Activity className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">
                  Dashboard
                </span>
              </div>
            </div>
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor your farm sensor data with real-time insights
          </p>
        </div>

        {analytics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Readings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.summary.totalReadings.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Sensors</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.analytics.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analytics.analytics.map((sensor) => (
                <div
                  key={sensor.sensor_type}
                  className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl">
                      {getSensorIcon(sensor.sensor_type)}
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {sensor.count} readings
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-4 capitalize">
                    {sensor.sensor_type.replace("_", " ")}
                  </h3>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Average</span>
                      <span className="font-medium text-gray-900">
                        {sensor.average} {sensor.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Range</span>
                      <span className="text-sm text-gray-700">
                        {sensor.min} - {sensor.max} {sensor.unit}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Min</span>
                      <span>Avg</span>
                      <span>Max</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 relative">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${getProgressPercentage(
                            sensor.average,
                            sensor.min,
                            sensor.max
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {analytics.analytics.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No sensor data available
                </h3>
                <p className="text-gray-500 mb-4">
                  Upload some sensor data to see analytics here
                </p>
                <Link
                  href="/"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Upload Data
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading analytics...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
