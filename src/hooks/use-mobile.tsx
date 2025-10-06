
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Always return false - force desktop layout everywhere
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(false)

  React.useEffect(() => {
    // Force desktop layout - never show mobile
    setIsMobile(false)
  }, [])

  return false // Always return false to force desktop layout
}
