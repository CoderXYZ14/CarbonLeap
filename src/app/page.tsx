"use client";

import { useState, useRef } from "react";
import { Activity, FileText, CheckCircle, AlertCircle } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { toast } from "sonner";

interface UploadStatus {
  type: "idle" | "loading" | "success" | "error";
  message: string;
  count?: number;
}

export default function HomePage() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    type: "idle",
    message: "",
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      setUploadStatus({ type: "error", message: "Please upload a JSON file" });
      toast.error("Please upload a JSON file");
      return;
    }

    try {
      setUploadStatus({ type: "loading", message: "Processing file..." });

      const text = await file.text();
      const data = JSON.parse(text);

      const response = await axios.post("/api/sensor", data);

      setUploadStatus({
        type: "success",
        message: "Data uploaded successfully!",
        count: response.data.count,
      });

      toast.success(
        `Successfully uploaded ${response.data.count} sensor readings!`,
        {
          action: {
            label: "View Dashboard",
            onClick: () => (window.location.href = "/dashboard"),
          },
          duration: 5000,
        }
      );
    } catch (error) {
      console.error("Upload | Error:", error);
      setUploadStatus({
        type: "error",
        message: "Failed to upload data. Please check your file format.",
      });
      toast.error("Failed to upload data. Please check your file format.");
    }
  };

  const clearUpload = () => {
    setUploadStatus({ type: "idle", message: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                Field Insights
              </span>
            </div>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upload Sensor Data
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your farm sensor data in JSON format to get instant analytics
            and insights
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="space-y-4">
              <FileText className="h-16 w-16 text-gray-400 mx-auto" />
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Choose JSON File
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  or drag and drop here
                </p>
              </div>
            </div>
          </div>

          {uploadStatus.type !== "idle" && (
            <div
              className={`mt-6 p-4 rounded-lg flex items-center space-x-3 ${
                uploadStatus.type === "success"
                  ? "bg-green-50 text-green-800"
                  : uploadStatus.type === "error"
                  ? "bg-red-50 text-red-800"
                  : "bg-blue-50 text-blue-800"
              }`}
            >
              {uploadStatus.type === "success" && (
                <CheckCircle className="h-5 w-5" />
              )}
              {uploadStatus.type === "error" && (
                <AlertCircle className="h-5 w-5" />
              )}
              {uploadStatus.type === "loading" && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
              <div className="flex-1">
                <p className="font-medium">{uploadStatus.message}</p>
                {uploadStatus.count && (
                  <p className="text-sm opacity-75">
                    {uploadStatus.count} sensor readings processed
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                {uploadStatus.type === "success" && (
                  <Link
                    href="/dashboard"
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    View Dashboard
                  </Link>
                )}
                {uploadStatus.type !== "loading" && (
                  <button
                    onClick={clearUpload}
                    className="text-sm underline hover:no-underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
