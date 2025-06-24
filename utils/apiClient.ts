interface RetryOptions {
  maxRetries: number
  delay: number
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryOptions: RetryOptions = { maxRetries: 3, delay: 1000 },
): Promise<Response> {
  let lastError: Error

  for (let i = 0; i <= retryOptions.maxRetries; i++) {
    try {
      const response = await fetch(url, options)

      // If it's a server error (5xx), retry
      if (response.status >= 500 && i < retryOptions.maxRetries) {
        throw new Error(`Server error: ${response.status}`)
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error")

      // Don't retry on the last attempt
      if (i === retryOptions.maxRetries) {
        break
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryOptions.delay * (i + 1)))
    }
  }

  throw lastError!
}
