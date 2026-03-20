import { createContext, useContext, useState } from "react";
import { BuyCreditsModal } from "../components/ui/BuyCreditsModal";

interface CreditsModalCtx {
  openBuyCredits: () => void;
}

const Ctx = createContext<CreditsModalCtx>({ openBuyCredits: () => {} });

export function useCreditsModal() {
  return useContext(Ctx);
}

export function CreditsModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ openBuyCredits: () => setOpen(true) }}>
      {children}
      {open && <BuyCreditsModal onClose={() => setOpen(false)} />}
    </Ctx.Provider>
  );
}
