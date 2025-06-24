import * as XLSX from "xlsx"

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

interface ParsedExcelData {
  comparison: ComparisonResult[]
  extraFields: ExtraField[]
}

export async function parseExcelResponse(blob: Blob): Promise<ParsedExcelData> {
  try {
    const arrayBuffer = await blob.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })

    // Parse comparison sheet
    const comparisonSheetName = "SKV vs Tender"
    const comparisonSheet = workbook.Sheets[comparisonSheetName]
    const comparisonData: ComparisonResult[] = comparisonSheet
      ? XLSX.utils
          .sheet_to_json(comparisonSheet, { header: 1 })
          .slice(1) // Skip header row
          .map((row) => {
            const cells = row as (string | undefined)[]
            return {
              "SKV Standards": cells[0] ?? "",
              "Tender Brief": cells[1] ?? "",
              Inference: cells[2] ?? "",
              "Doc Name and Page Number": cells[3] ?? "",
            }
          })
          .filter((row) => row["SKV Standards"] || row["Tender Brief"])
      : []

    // Parse extra fields sheet
    const extraFieldsSheetName = "Extra Tender Fields"
    const extraFieldsSheet = workbook.Sheets[extraFieldsSheetName]
    const extraFieldsData: ExtraField[] = extraFieldsSheet
      ? XLSX.utils
          .sheet_to_json(extraFieldsSheet, { header: 1 })
          .slice(1) // Skip header row
          .map((row) => {
            const cells = row as (string | undefined)[]
            return {
              "Tender Brief Extra Field": cells[0] ?? "",
              Value: cells[1] ?? "",
              "Doc Name and Page Number": cells[2] ?? "",
              Comment: cells[3] ?? "",
            }
          })
          .filter((row) => row["Tender Brief Extra Field"])
      : []

    return {
      comparison: comparisonData,
      extraFields: extraFieldsData,
    }
  } catch (error) {
    console.error("Error parsing Excel file:", error)
    return {
      comparison: [
        {
          "SKV Standards": "Unable to parse Excel file",
          "Tender Brief": "Please download the file to view results",
          Inference: "❌ Parsing Error",
          "Doc Name and Page Number": "N/A",
        },
      ],
      extraFields: [],
    }
  }
}
