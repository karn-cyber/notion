import React from "react"
import { Avatar, AvatarFallback } from "./avatar"
import { Badge } from "./badge"
import { cn } from "@/lib/utils"
import { User, Crown, Zap } from "lucide-react"

interface UserAvatarProps {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
  isCurrentUser?: boolean
  className?: string
  showStatus?: boolean
  status?: 'online' | 'away' | 'offline'
}

const sizeConfig = {
  sm: { avatar: 'h-6 w-6', text: 'text-xs', badge: 'h-2 w-2' },
  md: { avatar: 'h-8 w-8', text: 'text-sm', badge: 'h-2.5 w-2.5' },
  lg: { avatar: 'h-10 w-10', text: 'text-base', badge: 'h-3 w-3' },
  xl: { avatar: 'h-12 w-12', text: 'text-lg', badge: 'h-3.5 w-3.5' }
}

const statusConfig = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-400'
}

export function UserAvatar({ 
  name, 
  color, 
  size = 'md', 
  showName = false, 
  isCurrentUser = false,
  className,
  showStatus = false,
  status = 'online'
}: UserAvatarProps) {
  const sizeConf = sizeConfig[size]
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="relative">
        <Avatar className={cn(
          sizeConf.avatar,
          "border-2 border-white shadow-sm ring-2 ring-gray-100 dark:ring-gray-800 transition-all hover:scale-105"
        )}>
          <AvatarFallback 
            className={cn(
              "font-semibold text-white",
              sizeConf.text
            )}
            style={{ backgroundColor: color }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        
        {/* Status indicator */}
        {showStatus && (
          <div 
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white",
              sizeConf.badge,
              statusConfig[status]
            )}
          />
        )}
        
        {/* Current user crown */}
        {isCurrentUser && (
          <div className="absolute -top-1 -right-1">
            <div className="bg-yellow-400 rounded-full p-0.5">
              <Crown size={8} className="text-yellow-800" />
            </div>
          </div>
        )}
      </div>
      
      {showName && (
        <div className="flex items-center space-x-1">
          <span className={cn("font-medium text-foreground", sizeConf.text)}>
            {name}
          </span>
          {isCurrentUser && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              You
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

interface UserListProps {
  users: Array<{
    id: string
    name: string
    color: string
    isCurrentUser?: boolean
    status?: 'online' | 'away' | 'offline'
  }>
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function UserList({ 
  users, 
  maxVisible = 3, 
  size = 'md', 
  className 
}: UserListProps) {
  const visibleUsers = users.slice(0, maxVisible)
  const hiddenCount = Math.max(0, users.length - maxVisible)

  return (
    <div className={cn("flex items-center", className)}>
      {/* Visible users */}
      <div className="flex -space-x-1">
        {visibleUsers.map((user) => (
          <UserAvatar
            key={user.id}
            name={user.name}
            color={user.color}
            size={size}
            isCurrentUser={user.isCurrentUser}
            showStatus={true}
            status={user.status}
            className="transition-transform hover:-translate-y-0.5 hover:z-10"
          />
        ))}
      </div>
      
      {/* Hidden users count */}
      {hiddenCount > 0 && (
        <div className={cn(
          "ml-2 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white text-gray-600 dark:text-gray-300 font-medium",
          sizeConfig[size].avatar,
          sizeConfig[size].text
        )}>
          +{hiddenCount}
        </div>
      )}
    </div>
  )
}
