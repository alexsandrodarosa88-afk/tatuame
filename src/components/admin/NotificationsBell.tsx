import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminNotifications } from "@/hooks/use-admin-notifications";

export function NotificationsBell() {
  const { items, unread, markAllRead, markRead } = useAdminNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid place-items-center min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Marcar todas como lidas
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">Sem notificações</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((n) => (
              <DropdownMenuItem key={n.id} asChild className="cursor-pointer">
                <Link
                  to={(n.link ?? "/admin") as any}
                  onClick={() => markRead(n.id)}
                  className="flex flex-col items-start gap-0.5 py-2"
                >
                  <div className="flex items-center gap-2 w-full">
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <span className={`text-sm ${!n.is_read ? "font-semibold" : ""}`}>{n.title}</span>
                  </div>
                  {n.message && <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("pt-BR")}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
