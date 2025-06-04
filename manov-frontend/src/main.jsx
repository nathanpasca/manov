import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query" // New
import { ReactQueryDevtools } from "@tanstack/react-query-devtools" // Optional

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false, // Optional: disable refetch on window focus
      retry: 1, // Retry failed requests once
    },
  },
})

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {" "}
      {/* New Wrapper */}
      <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
        <App />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} /> {/* Optional Devtools */}
    </QueryClientProvider>
  </React.StrictMode>
)
