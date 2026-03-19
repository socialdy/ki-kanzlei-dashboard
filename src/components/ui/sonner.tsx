"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        className: "!rounded-xl !text-sm !font-medium !border-0",
        style: {
          background: "oklch(0.546 0.244 263)",
          color: "#ffffff",
          borderRadius: "14px",
          boxShadow: "0 10px 40px rgba(37,99,235,0.25), 0 2px 8px rgba(0,0,0,0.08)",
          padding: "14px 18px",
          border: "none",
        },
        classNames: {
          error: "!bg-primary",
          warning: "!bg-primary",
          success: "!bg-primary",
          info: "!bg-primary",
          loading: "!bg-primary",
          description: "!text-white/80 !text-xs",
          title: "!text-white !font-semibold",
          actionButton: "!bg-white/20 !text-white hover:!bg-white/30 !border-0 !font-medium",
          cancelButton: "!bg-white/10 !text-white/70 hover:!bg-white/20 !border-0",
          closeButton: "!bg-white/10 !text-white !border-0 hover:!bg-white/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
