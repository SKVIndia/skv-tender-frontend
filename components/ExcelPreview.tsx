"use client"

import { useState } from "react"
import { ZoomIn, ZoomOut, Download, RotateCcw, FileSpreadsheet, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

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

interface ExcelPreviewProps {
  comparisonData: ComparisonResult[]
  extraFieldsData: ExtraField[]
  onDownload: () => void
  onReset: () => void
}

export function ExcelPreview({ comparisonData, extraFieldsData, onDownload, onReset }: ExcelPreviewProps) {
  const [zoomLevel, setZoomLevel] = useState(100)
  const [searchTerm, setSearchTerm] = useState("")

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 200))
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 50))
  const resetZoom = () => setZoomLevel(100)

  const getInferenceColor = (inference: string) => {
    if (inference.includes("Match")) {
      return "bg-green-100 text-green-800 border-green-200"
    } else if (inference.includes("Clarification")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    } else {
      return "bg-red-100 text-red-800 border-red-200"
    }
  }

  const getRowColor = (inference: string) => {
    if (inference.includes("Match")) {
      return "bg-green-50/50"
    } else if (inference.includes("Clarification")) {
      return "bg-yellow-50/50"
    } else {
      return "bg-red-50/50"
    }
  }

  const filteredComparisonData = comparisonData.filter((row) =>
    Object.values(row).some((value) => value.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const filteredExtraFieldsData = extraFieldsData.filter((row) =>
    Object.values(row).some((value) => value.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-2xl">SKV vs Tender Comparison Results</CardTitle>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search in results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <Button variant="ghost" size="sm" onClick={zoomOut} disabled={zoomLevel <= 50}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-2 min-w-[60px] text-center">{zoomLevel}%</span>
                <Button variant="ghost" size="sm" onClick={zoomIn} disabled={zoomLevel >= 200}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={resetZoom}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Action Buttons */}
              <Button onClick={onDownload} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Download Excel
              </Button>
              <Button onClick={onReset} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{comparisonData.length}</div>
            <div className="text-sm font-medium text-gray-600">Total Comparisons</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {comparisonData.filter((row) => row.Inference.includes("Match")).length}
            </div>
            <div className="text-sm font-medium text-gray-600">Matches</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {comparisonData.filter((row) => row.Inference.includes("Clarification")).length}
            </div>
            <div className="text-sm font-medium text-gray-600">Need Clarification</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">{extraFieldsData.length}</div>
            <div className="text-sm font-medium text-gray-600">Extra Fields</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Comparison Table */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">📊 SKV vs Tender Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="overflow-auto border rounded-lg"
            style={{
              fontSize: `${zoomLevel}%`,
              maxHeight: "600px",
            }}
          >
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b w-8">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">SKV Standards</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Tender Brief</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Inference</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                    Doc Name and Page Number
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredComparisonData.map((row, index) => (
                  <tr key={index} className={`border-b hover:bg-gray-50 ${getRowColor(row.Inference)}`}>
                    <td className="px-4 py-3 text-sm text-gray-500 font-medium">{index}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      <div className="break-words">{row["SKV Standards"]}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      <div className="break-words">{row["Tender Brief"]}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${getInferenceColor(row.Inference)} font-medium`}>{row.Inference}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                      <div className="break-words">{row["Doc Name and Page Number"]}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Extra Fields Table */}
      {extraFieldsData.length > 0 && (
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">🟨 Extra Tender Fields (Not in SKV)</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="overflow-auto border rounded-lg"
              style={{
                fontSize: `${zoomLevel}%`,
                maxHeight: "400px",
              }}
            >
              <table className="w-full">
                <thead className="bg-yellow-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b w-8">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      Tender Brief Extra Field
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      Doc Name and Page Number
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExtraFieldsData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-yellow-50 bg-yellow-25">
                      <td className="px-4 py-3 text-sm text-gray-500 font-medium">{index}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                        <div className="break-words">{row["Tender Brief Extra Field"]}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                        <div className="break-words">{row.Value}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        <div className="break-words">{row["Doc Name and Page Number"]}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-medium">
                          {row.Comment}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results Message */}
      {filteredComparisonData.length === 0 && filteredExtraFieldsData.length === 0 && searchTerm && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try adjusting your search term or clear the search to see all results.</p>
            <Button onClick={() => setSearchTerm("")} variant="outline" className="mt-4">
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
