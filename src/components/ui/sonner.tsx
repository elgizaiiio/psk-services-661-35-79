import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={1000}
      position="top-center"
      gap={8}
      offset={16}
      icons={{
        success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        error: <XCircle className="w-4 h-4 text-red-400" />,
        info: <Info className="w-4 h-4 text-blue-400" />,
        warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      }}
      toastOptions={{
        style: {
          fontSize: '0.8125rem',
          padding: '10px 14px',
          minHeight: '36px',
          maxWidth: '320px',
          borderRadius: '12px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          backgroundColor: 'hsl(var(--card) / 0.95)',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.3)',
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          title: "group-[.toast]:text-foreground group-[.toast]:font-medium text-sm",
          description: "group-[.toast]:text-muted-foreground text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground text-xs px-2 py-1 rounded-md",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground text-xs px-2 py-1 rounded-md",
          success: "group-[.toaster]:!border-emerald-500/30 group-[.toaster]:!bg-emerald-950/80",
          error: "group-[.toaster]:!border-red-500/30 group-[.toaster]:!bg-red-950/80",
          info: "group-[.toaster]:!border-blue-500/30 group-[.toaster]:!bg-blue-950/80",
          warning: "group-[.toaster]:!border-amber-500/30 group-[.toaster]:!bg-amber-950/80",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
