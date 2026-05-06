import { createContext, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"

export type ProductTabIndex = 0 | 1 | 2

type ProductTabContextValue = {
  activeTab: ProductTabIndex
  setActiveTab: (next: ProductTabIndex) => void
}

const ProductTabContext = createContext<ProductTabContextValue>({
  activeTab: 0,
  setActiveTab: () => {},
})

export function ProductTabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<ProductTabIndex>(0)
  const value = useMemo(() => ({ activeTab, setActiveTab }), [activeTab])
  return (
    <ProductTabContext.Provider value={value}>
      {children}
    </ProductTabContext.Provider>
  )
}

export function useProductTab() {
  return useContext(ProductTabContext)
}
