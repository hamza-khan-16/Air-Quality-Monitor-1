import { Link, useLocation } from "wouter";
import { Activity, BarChart3, CloudSun } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Live", icon: Activity },
    { href: "/history", label: "History", icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe pt-2 px-6 z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-md mx-auto h-16 flex items-center justify-between md:max-w-4xl">
        
        {/* Logo for Desktop */}
        <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white">
                <CloudSun size={20} />
            </div>
            <span className="font-display font-bold text-lg text-slate-800 tracking-tight">AirGuard</span>
        </div>

        {/* Mobile Nav Items */}
        <div className="flex flex-1 justify-around md:justify-end md:gap-8">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] rounded-xl transition-all duration-200 group md:flex-row md:px-4 md:py-2",
                isActive 
                  ? "text-primary md:bg-primary/10" 
                  : "text-slate-400 hover:text-slate-600 md:hover:bg-slate-50"
              )}>
                <item.icon 
                  size={24} 
                  className={cn(
                    "transition-transform duration-300 md:w-5 md:h-5",
                    isActive ? "scale-110 md:scale-100" : "group-hover:scale-110 md:group-hover:scale-100"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[10px] font-medium md:text-sm",
                  isActive ? "text-primary" : "text-slate-500"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
