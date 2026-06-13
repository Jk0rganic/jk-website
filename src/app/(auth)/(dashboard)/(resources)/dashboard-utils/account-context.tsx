"use client";

import { createContext, useContext } from "react";

type AccountContextType = {
  session: Session;
  orders: DashboardOrder[];
};

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const useAccount = () => {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error("useAccount must be used within AccountProvider");
  }

  return context;
};

interface AccountProviderProps {
  session: Session;
  orders: DashboardOrder[];
  children: React.ReactNode;
}

export default function AccountProvider({
  session,
  orders,
  children,
}: AccountProviderProps) {
  return (
    <AccountContext.Provider
      value={{
        session,
        orders,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}
