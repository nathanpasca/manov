import { useState, useEffect } from "react"

const getInitialSettings = () => {
  try {
    const item = window.localStorage.getItem("manov-reading-settings")
    return item ? JSON.parse(item) : { fontSize: 16, lineHeight: 1.7, fontFamily: "serif" }
  } catch (error) {
    console.error(error)
    return { fontSize: 16, lineHeight: 1.7, fontFamily: "serif" }
  }
}

export function useReadingSettings() {
  const [settings, setSettings] = useState(getInitialSettings)

  useEffect(() => {
    try {
      window.localStorage.setItem("manov-reading-settings", JSON.stringify(settings))
    } catch (error) {
      console.error(error)
    }
  }, [settings])

  return [settings, setSettings]
}
