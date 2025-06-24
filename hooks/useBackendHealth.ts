"use client"

import { useState, useEffect } from "react"

interface HealthStatus {
  isHealthy: boolean
  isLoading: boolean
  error: string | null
}

export function useBackendHealth() {
  const [status, setStatus] = useState<HealthStatus>({
    isHealthy: false,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("https://skv-tender-backend.onrender.com", {
          method: "GET",
        })

        if (response.ok) {
          setStatus({
            isHealthy: true,
            isLoading: false,
            error: null,
          })
        } else {
          throw new Error(`Backend not responding (${response.status})`)
        }
      } catch (error) {
        setStatus({
          isHealthy: false,
          isLoading: false,
          error: error instanceof Error ? error.message : "Backend connection failed",
        })
      }
    }

    checkHealth()

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000)

    return () => clearInterval(interval)
  }, [])

  return status
}
