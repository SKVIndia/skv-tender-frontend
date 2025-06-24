export function validateExcelFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ]
  const maxSizeMB = 10

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "Only .xlsx or .xls files are allowed." }
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return { isValid: false, error: `File must be smaller than ${maxSizeMB}MB.` }
  }

  return { isValid: true }
}

export function formatFileSize(sizeInBytes: number): string {
  const kb = sizeInBytes / 1024
  if (kb < 1024) return `${kb.toFixed(2)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}
