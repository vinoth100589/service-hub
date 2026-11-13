import { useEffect, useRef, useState } from 'react'
import { notificationService } from '@services/notificationService'
import type { Notification } from '@/types'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    notificationService
      .list({ limit: 10 })
      .then((res) => {
        setNotifications(res.data)
        setUnreadCount(res.unread_count)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) return
    try {
      await notificationService.markAsRead(notification.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(prev - 1, 0))
    } catch {
      // Not critical — the badge will correct itself next time the list loads.
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      // Not critical — the badge will correct itself next time the list loads.
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Notifications"
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-primary-700"
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
          <path
            d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs font-medium text-primary-600 hover:underline"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`block w-full border-b border-gray-50 px-4 py-3 text-left text-sm last:border-0 hover:bg-gray-50 ${
                    notification.is_read ? '' : 'bg-primary-50/50'
                  }`}
                  onClick={() => handleMarkAsRead(notification)}
                >
                  <p className="font-medium text-gray-900">{notification.title}</p>
                  <p className="mt-0.5 text-gray-600">{notification.content}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
