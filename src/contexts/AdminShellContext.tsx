import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type Ctx = {
  globalSearch: string
  setGlobalSearch: (q: string) => void
}

const AdminShellContext = createContext<Ctx | null>(null)

export function AdminShellProvider({ children }: { children: ReactNode }) {
  const [globalSearch, setGlobalSearch] = useState('')
  const v = useMemo(() => ({ globalSearch, setGlobalSearch }), [globalSearch])
  return <AdminShellContext.Provider value={v}>{children}</AdminShellContext.Provider>
}

export function useAdminShell() {
  const c = useContext(AdminShellContext)
  if (!c) throw new Error('useAdminShell must be used within AdminShellProvider')
  return c
}
