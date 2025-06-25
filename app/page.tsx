"use client"

import { useState } from "react"
import {
  Upload,
  FileText,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  BarChart3,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBackendHealth } from "@/hooks/useBackendHealth"
import { validateExcelFile, formatFileSize } from "@/utils/fileValidation"
import { ExcelPreview } from "@/components/ExcelPreview"
import { parseExcelResponse } from "@/utils/excelParser"

interface ComparisonResult {
  "SKV Standards": string
  "Tender Brief": string
  Inference: string
  "Doc Name and Page Number": string
}

interface ExtraField {
  "Tender Brief Extra Field": string
  Value: string
  "Doc Name and Page Number": string
  Comment: string
}

interface ExcelData {
  comparison: ComparisonResult[]
  extraFields: ExtraField[]
  downloadBlob: Blob
}

export default function SKVComparator() {
  const [skvFile, setSkvFile] = useState<File | null>(null)
  const [tenderFile, setTenderFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [excelData, setExcelData] = useState<ExcelData | null>(null)

  // Add backend health check
  const backendHealth = useBackendHealth()

  const handleFileUpload = (file: File, type: "skv" | "tender") => {
    // Validate file
    const validation = validateExcelFile(file)

    if (!validation.isValid) {
      setError(validation.error || "Invalid file")
      return
    }

    if (type === "skv") {
      setSkvFile(file)
    } else {
      setTenderFile(file)
    }
    setError(null)
    setSuccess(null)
  }

  const processFiles = async () => {
    if (!skvFile || !tenderFile) {
      setError("Please upload both files before processing.")
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setError(null)
    setSuccess(null)
    setExcelData(null)

    try {
      const formData = new FormData()
      formData.append("skv_file", skvFile)
      formData.append("tender_file", tenderFile)

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 3, 90))
      }, 300)

      // Make request to Flask backend
      const response = await fetch("https://skv-tender-backend.onrender.com/api/compare", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Check if response is Excel file
      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
        const blob = await response.blob()

        // Parse Excel data for preview
        const parsedData = await parseExcelResponse(blob)

        setExcelData({
          comparison: parsedData.comparison,
          extraFields: parsedData.extraFields,
          downloadBlob: blob,
        })

        setProgress(100)
        setSuccess("Analysis completed successfully! You can now preview and download the results.")
      } else {
        throw new Error("Unexpected response format")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while processing files")
      console.error("Processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadExcel = () => {
    if (!excelData?.downloadBlob) return

    const url = window.URL.createObjectURL(excelData.downloadBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = "SKV_Tender_Comparison_Result.xlsx"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const resetForm = () => {
    setSkvFile(null)
    setTenderFile(null)
    setError(null)
    setSuccess(null)
    setProgress(0)
    setExcelData(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            SKV Standards Comparator
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Compare your SKV legal standards with any Tender Brief document using{" "}
            <span className="font-semibold text-blue-600">AI-powered semantic analysis</span>. Identify clause-level
            matches, mismatches, and additional tender items with precision.
          </p>
        </div>

        {/* Backend Status Indicator */}
        {backendHealth.isLoading ? (
          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription className="text-blue-800">Checking backend connection...</AlertDescription>
          </Alert>
        ) : !backendHealth.isHealthy ? (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Backend Offline:</strong> {backendHealth.error}
              <br />
              <span className="text-sm">Please ensure the Flask backend is running on http://localhost:5000</span>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-8 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Backend Connected:</strong> Ready to process documents
            </AlertDescription>
          </Alert>
        )}

        {/* File Upload Section */}
        {!excelData && (
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  SKV Standards File
                </CardTitle>
                <CardDescription className="text-base">
                  Upload your Legal Worksheet - Standard.xlsx file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 group">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "skv")}
                    className="hidden"
                    id="skv-upload"
                  />
                  <label htmlFor="skv-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      {skvFile ? (
                        <>
                          <span className="text-green-600">✓</span> {skvFile.name}
                        </>
                      ) : (
                        "Click to upload SKV file"
                      )}
                    </p>
                    {skvFile && <p className="text-sm text-gray-500 mb-2">Size: {formatFileSize(skvFile.size)}</p>}
                    <p className="text-sm text-gray-500">Supports .xlsx and .xls formats (max 10MB)</p>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  Tender Brief File
                </CardTitle>
                <CardDescription className="text-base">Upload your Tender Topsheet.xlsx file</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-300 group">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "tender")}
                    className="hidden"
                    id="tender-upload"
                  />
                  <label htmlFor="tender-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      {tenderFile ? (
                        <>
                          <span className="text-green-600">✓</span> {tenderFile.name}
                        </>
                      ) : (
                        "Click to upload Tender file"
                      )}
                    </p>
                    {tenderFile && (
                      <p className="text-sm text-gray-500 mb-2">Size: {formatFileSize(tenderFile.size)}</p>
                    )}
                    <p className="text-sm text-gray-500">Supports .xlsx and .xls formats (max 10MB)</p>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        {!excelData && (
          <div className="flex justify-center gap-4 mb-12">
            <Button
              onClick={processFiles}
              disabled={!skvFile || !tenderFile || isProcessing || !backendHealth.isHealthy}
              size="lg"
              className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Analyzing Documents...
                </>
              ) : !backendHealth.isHealthy ? (
                <>
                  <XCircle className="h-5 w-5 mr-3" />
                  Backend Offline
                </>
              ) : (
                <>
                  <BarChart3 className="h-5 w-5 mr-3" />
                  Start Analysis
                </>
              )}
            </Button>

            {(skvFile || tenderFile) && (
              <Button
                onClick={resetForm}
                disabled={isProcessing}
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold"
              >
                Reset Files
              </Button>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {isProcessing && (
          <Card className="mb-12 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">Processing with semantic engine...</span>
                  <span className="text-lg font-bold text-blue-600">{progress}%</span>
                </div>
                <Progress value={progress} className="w-full h-3" />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Loading AI models</span>
                  <span>Analyzing semantic similarity</span>
                  <span>Generating Excel report</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="mb-12 border-green-200 bg-green-50 shadow-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 text-base font-medium">{success}</AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-12 border-red-200 bg-red-50 shadow-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 text-base font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {/* Excel Preview */}
        {excelData && (
          <ExcelPreview
            comparisonData={excelData.comparison}
            extraFieldsData={excelData.extraFields}
            onDownload={downloadExcel}
            onReset={resetForm}
          />
        )}

        {/* Instructions Section - Only show when no results */}
        {!excelData && (
          <>
            <Card className="mb-12 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">1. Upload Files</h3>
                    <p className="text-gray-600">Upload your SKV Standards and Tender Brief Excel files</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">2. AI Analysis</h3>
                    <p className="text-gray-600">Our AI performs semantic analysis to find matches and conflicts</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Download className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">3. Preview & Download</h3>
                    <p className="text-gray-600">Preview results with zoom controls and download Excel report</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Section */}
            <Card className="mb-12 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Analysis Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-800">Perfect Matches</h4>
                      <p className="text-sm text-green-600">Clauses that align perfectly</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-yellow-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Need Clarification</h4>
                      <p className="text-sm text-yellow-600">Partial matches requiring review</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                    <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-800">Conflicts</h4>
                      <p className="text-sm text-red-600">Mismatched or missing clauses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                    <FileText className="h-8 w-8 text-purple-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-purple-800">Extra Fields</h4>
                      <p className="text-sm text-purple-600">Tender items not in SKV</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-16 pt-12 border-t border-gray-200">
          <p className="text-gray-600 text-lg">
            Made with ❤️ by{" "}
            <a
              href="https://adityxrai.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              adityxrai
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
