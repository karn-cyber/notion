"use client"
import React from 'react'

interface CursorProps {
  x: number
  y: number
  name: string
  color: string
  isTyping?: boolean
}

function Cursor({ x, y, name, color, isTyping = false }: CursorProps) {
  return (
    <div
      className="pointer-events-none absolute z-50 transition-all duration-100 ease-out"
      style={{
        left: x,
        top: y,
        transform: 'translate(-4px, -4px)',
      }}
    >
      {/* Enhanced cursor icon with better visibility */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        className="relative drop-shadow-lg"
      >
        {/* Outer glow */}
        <path
          d="M6.5 14.5H6.1L5.8 14.7L1 19V2L16 14.5H6.5Z"
          fill={color}
          stroke="white"
          strokeWidth="3"
          opacity="0.3"
          filter="blur(1px)"
        />
        {/* Main cursor */}
        <path
          d="M6.5 14.5H6.1L5.8 14.7L1 19V2L16 14.5H6.5Z"
          fill={color}
          stroke="white"
          strokeWidth="2"
        />
        {/* Inner highlight */}
        <path
          d="M6.5 14.5H6.1L5.8 14.7L1 19V2L16 14.5H6.5Z"
          fill="white"
          opacity="0.3"
        />
      </svg>
      
      {/* Enhanced name label with modern design */}
      <div
        className="absolute top-7 left-6 px-3 py-2 text-sm font-semibold text-white rounded-xl shadow-2xl whitespace-nowrap border border-white/20"
        style={{
          backgroundColor: color,
          boxShadow: `0 10px 40px ${color}50, 0 4px 20px rgba(0,0,0,0.25)`,
        }}
      >
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div 
            className={`w-2.5 h-2.5 rounded-full ${isTyping ? 'bg-white animate-pulse' : 'bg-white/70'}`}
            style={{ animationDuration: isTyping ? '0.6s' : '2s' }}
          />
          <span className="font-medium">{name}</span>
          {isTyping && (
            <div className="flex gap-0.5 ml-1">
              <div className="w-1 h-1 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
      </div>
      
      {/* Animated presence rings */}
      <div 
        className="absolute -inset-3 rounded-full opacity-30"
        style={{ 
          backgroundColor: color,
          filter: 'blur(10px)',
          animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
        }}
      />
      
      {/* Active state indicator */}
      {isTyping && (
        <div 
          className="absolute -inset-2 rounded-full opacity-50 animate-pulse"
          style={{ 
            backgroundColor: color,
            filter: 'blur(6px)',
            animationDuration: '0.8s'
          }}
        />
      )}
    </div>
  )
}

export default Cursor
