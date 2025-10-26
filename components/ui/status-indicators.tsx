import React from "react"
import { Badge } from "./badge"
import { cn } from "@/lib/utils"
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Loader2, 
  Save,
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
  sm: { iconSize: 12, textSize: 'text-xs', padding: 'px-2 py-1' },
  md: { iconSize: 14, textSize: 'text-sm', padding: 'px-2.5 py-1.5' },
  lg: { iconSize: 16, textSize: 'text-base', padding: 'px-3 py-2' }
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
        "flex items-center space-x-1.5 font-medium",
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
            config.animate && "animate-spin"
          )} 
        />
      )}
      <span>{displayText}</span>
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
    <div className={cn("flex items-center space-x-3", className)}>
      <StatusIndicator 
        status={isActive ? 'connected' : 'disconnected'}
        text={isActive ? 'Real-time collaboration' : 'Collaboration offline'}
        size="sm"
      />
      
      <Badge variant="outline" className="flex items-center space-x-1.5">
        <Users size={12} />
        <span className="text-xs font-medium">
          {userCount} user{userCount !== 1 ? 's' : ''}
        </span>
      </Badge>
      
      <Badge variant="secondary" className="flex items-center space-x-1.5">
        <FileText size={12} />
        <span className="text-xs font-mono">
          {roomId.slice(0, 8)}...
        </span>
      </Badge>
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
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <StatusIndicator status={autoSaveStatus} size="sm" />
      
      {lastModified && autoSaveStatus === 'saved' && (
        <Badge variant="outline" className="text-xs">
          Last saved: {formatTime(lastModified)}
        </Badge>
      )}
    </div>
  )
}
