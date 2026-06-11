import { Menu } from "lucide-react";
import { format } from "date-fns";

interface TopBarProps {
  onMenu: () => void;
}

export function TopBar({ onMenu }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white/80 px-4 backdrop-blur lg:px-6">
      <button
        className="rounded-md p-2 text-foreground hover:bg-accent lg:hidden"
        onClick={onMenu}
        aria-label="Mở menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="text-sm text-muted-foreground">
        {format(new Date(), "EEEE, dd/MM/yyyy")}
      </div>
    </header>
  );
}
