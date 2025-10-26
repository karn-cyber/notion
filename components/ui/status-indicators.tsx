import React from "react"
import { Badge } from "./badge"
import { cn } from "@/lib/utils"
import { 
  CheckCircle2, 
  Loader2, 
  Clock,
  FileText,
  Users,
  Wifi,
  WifiOff
} from "lucide-react"

interface StatusIndicatorProps {
  status: 'saved' | 'saving' | 'pending' | 'connected' | 'disconnected' | 'loading'
  text?: string
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig = {
  saved: {
    variant: 'success' as const,
    icon: CheckCircle2,
    defaultText: 'Saved',
    className: 'text-green-600 dark:text-green-400',
    animate: false
  },
  saving: {
    variant: 'info' as const,
    icon: Loader2,
    defaultText: 'Saving...',
    className: 'text-blue-600 dark:text-blue-400',
    animate: true
  },
  pending: {
    variant: 'warning' as const,
    icon: Clock,
    defaultText: 'Pending...',
    className: 'text-yellow-600 dark:text-yellow-400',
    animate: false
  },
  connected: {
    variant: 'success' as const,
    icon: Wifi,
    defaultText: 'Connected',
    className: 'text-green-600 dark:text-green-400',
    animate: false
  },
  disconnected: {
    variant: 'destructive' as const,
    icon: WifiOff,
    defaultText: 'Disconnected',
    className: 'text-red-600 dark:text-red-400',
    animate: false
  },
  loading: {
    variant: 'info' as const,
    icon: Loader2,
    defaultText: 'Loading...',
    className: 'text-blue-600 dark:text-blue-400',
    animate: true
  }
}

const sizeConfig = {
  sm: { iconSize: 14, textSize: 'text-xs', padding: 'px-2 py-1' },
  md: { iconSize: 16, textSize: 'text-sm', padding: 'px-3 py-1.5' },
  lg: { iconSize: 18, textSize: 'text-base', padding: 'px-4 py-2' }
}

export function StatusIndicator({ 
  status, 
  text, 
  className, 
  showIcon = true, 
  size = 'md' 
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const sizeConf = sizeConfig[size]
  const Icon = config.icon
  const displayText = text || config.defaultText

  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        "inline-flex items-center gap-1.5 font-medium whitespace-nowrap select-none",
        "transition-all duration-300 ease-in-out",
        "transform hover:scale-105",
        "border border-transparent shadow-sm",
        "animate-[fadeIn_0.3s_ease-out]",
        status === 'saved' && "animate-[pulse_2s_ease-in-out_3]",
        status === 'connected' && "shadow-green-500/20 animate-[glow_2s_ease-in-out_infinite_alternate]",
        sizeConf.padding,
        sizeConf.textSize,
        className
      )}
    >
      {showIcon && (
        <Icon 
          size={sizeConf.iconSize} 
          className={cn(
            config.className,
            config.animate && "animate-spin",
            "shrink-0 transition-transform duration-200",
            status === 'saved' && "animate-bounce"
          )} 
        />
      )}
      <span className="truncate animate-[slideIn_0.2s_ease-out]">{displayText}</span>
    </Badge>
  )
}

interface CollaborationStatusProps {
  isActive: boolean
  userCount: number
  roomId: string
  className?: string
}

export function CollaborationStatus({ 
  isActive, 
  userCount, 
  roomId, 
  className 
}: CollaborationStatusProps) {
  return (
    <div className={cn(
      "flex items-center justify-start gap-2 sm:gap-3",
      "w-full overflow-hidden",
      "min-h-8", // Ensure minimum height
      className
    )}>
      {/* Main Status - Always visible with proper sizing */}
      <div className="shrink-0 animate-[fadeIn_0.5s_ease-out]">
        {/* Large screens */}
        <div className="hidden lg:inline-flex">
          <StatusIndicator 
            status={isActive ? 'connected' : 'disconnected'}
            text={isActive ? 'Real-time collaboration' : 'Collaboration offline'}
            size="sm"
          />
        </div>
        
        {/* Medium screens */}
        <div className="hidden md:inline-flex lg:hidden">
          <StatusIndicator 
            status={isActive ? 'connected' : 'disconnected'}
            text={isActive ? 'Collaboration' : 'Offline'}
            size="sm"
          />
        </div>
        
        {/* Small screens */}
        <div className="inline-flex md:hidden">
          <StatusIndicator 
            status={isActive ? 'connected' : 'disconnected'}
            text={isActive ? 'Live' : 'Off'}
            size="sm"
          />
        </div>
      </div>
      
      {/* User Count - Always visible, responsive sizing */}
      <div className="shrink-0 animate-[slideIn_0.3s_ease-out_0.1s_both]">
        <Badge 
          variant="outline" 
          className={cn(
            "inline-flex items-center gap-1.5 text-xs px-2 py-1",
            "border-border/50 bg-background/80 backdrop-blur-sm",
            "transition-all duration-200 hover:shadow-md",
            "min-w-fit"
          )}
        >
          <Users size={14} className="shrink-0 animate-pulse" />
          <span className="font-medium whitespace-nowrap">
            <span className="hidden sm:inline">{userCount} user{userCount !== 1 ? 's' : ''}</span>
            <span className="sm:hidden">{userCount}</span>
          </span>
        </Badge>
      </div>
      
      {/* Room ID - Only on extra large screens to prevent overflow */}
      <div className="hidden 2xl:block shrink-0 animate-[slideIn_0.3s_ease-out_0.2s_both]">
        <Badge 
          variant="secondary" 
          className={cn(
            "inline-flex items-center gap-1.5 text-xs px-2 py-1",
            "border-border/30 bg-muted/50 backdrop-blur-sm",
            "transition-all duration-200 hover:bg-muted/70",
            "max-w-[120px]"
          )}
        >
          <FileText size={14} className="shrink-0" />
          <span className="font-mono text-muted-foreground truncate">
            {roomId.slice(0, 8)}...
          </span>
        </Badge>
      </div>
    </div>
  )
}

interface DocumentStatusProps {
  autoSaveStatus: 'saved' | 'saving' | 'pending'
  lastModified?: Date
  className?: string
}

export function DocumentStatus({ 
  autoSaveStatus, 
  lastModified, 
  className 
}: DocumentStatusProps) {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className={cn(
      "flex items-center justify-start gap-2 sm:gap-3",
      "w-full overflow-hidden",
      "min-h-8", // Consistent height
      className
    )}>
      {/* Status Indicator - Always visible */}
      <div className="shrink-0 animate-[fadeIn_0.3s_ease-out]">
        <StatusIndicator 
          status={autoSaveStatus} 
          size="sm"
        />
      </div>
      
      {/* Last Modified Time - Single responsive badge */}
      {lastModified && autoSaveStatus === 'saved' && (
        <div className="shrink-0 animate-[slideIn_0.3s_ease-out_0.1s_both] min-w-0">
          <Badge 
            variant="outline" 
            className={cn(
              "inline-flex items-center gap-1.5 text-xs px-2 py-1",
              "border-border/50 bg-background/80 backdrop-blur-sm",
              "transition-all duration-200 hover:shadow-md",
              "max-w-fit overflow-hidden"
            )}
          >
            <Clock size={14} className="shrink-0 animate-pulse" />
            <span className="whitespace-nowrap truncate">
              {/* Responsive text content */}
              <span className="hidden lg:inline">Last saved: </span>
              <span className="hidden md:inline lg:hidden">Saved: </span>
              <span className="font-mono">{formatTime(lastModified)}</span>
            </span>
          </Badge>
        </div>
      )}
    </div>
  )
}
