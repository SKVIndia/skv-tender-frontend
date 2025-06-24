import { type NextRequest, NextResponse } from "next/server"
import { fetchWithRetry } from "@/utils/apiClient"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const skvFile = formData.get("skv_file") as File
    const tenderFile = formData.get("tender_file") as File

    if (!skvFile || !tenderFile) {
      return NextResponse.json({ error: "Both files are required" }, { status: 400 })
    }

    const backendFormData = new FormData()
    backendFormData.append("skv_file", skvFile)
    backendFormData.append("tender_file", tenderFile)

    const response = await fetchWithRetry("http://localhost:5000/api/compare", {
      method: "POST",
      body: backendFormData,
    })

    if (!response.ok) {
      throw new Error(`Flask backend error: ${response.status}`)
    }

    const blob = await response.blob()

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=SKV_Tender_Comparison_Result.xlsx",
      },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to process files" }, { status: 500 })
  }
}
