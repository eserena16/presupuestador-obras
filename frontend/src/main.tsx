import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import { useThemeStore, applyTheme } from './store/useThemeStore'

// Apply saved theme before first render to prevent flash
applyTheme(useThemeStore.getState().theme)

// Subscribe to future changes
useThemeStore.subscribe((s) => applyTheme(s.theme))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

function ToasterWrapper() {
  const theme = useThemeStore((s) => s.theme)
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style:
          theme === 'dark'
            ? { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' }
            : { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' },
      }}
    />
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <ToasterWrapper />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
)
