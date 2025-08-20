import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={1000}
      position="top-center"
      toastOptions={{
        style: {
          fontSize: '0.875rem',
          padding: '8px 12px',
          minHeight: '40px',
          opacity: 0.9,
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:text-white group-[.toaster]:border-border group-[.toaster]:shadow-sm text-sm",
          description: "group-[.toast]:text-white/80 text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground text-xs",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground text-xs",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
