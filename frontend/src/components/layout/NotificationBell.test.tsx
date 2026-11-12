import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NotificationBell from './NotificationBell'
import { notificationService } from '@services/notificationService'
import type { Notification } from '@/types'

vi.mock('@services/notificationService', () => ({
  notificationService: { list: vi.fn(), markAsRead: vi.fn(), markAllAsRead: vi.fn() },
}))

function notification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-1',
    user_id: 'user-1',
    type: 'booking_accepted',
    title: 'Booking accepted',
    content: 'Your request for Deep clean was accepted',
    is_read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('NotificationBell', () => {
  it('shows the unread count badge from the list response', async () => {
    (notificationService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [notification()],
      unread_count: 3,
    })

    render(<NotificationBell />)

    expect(await screen.findByText('3')).toBeInTheDocument()
  })

  it('opens the dropdown and lists notifications on click', async () => {
    (notificationService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [notification()],
      unread_count: 1,
    })

    render(<NotificationBell />)
    await waitFor(() => expect(notificationService.list).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))

    expect(await screen.findByText('Booking accepted')).toBeInTheDocument()
  })

  it('marks a notification as read on click and decrements the badge', async () => {
    (notificationService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [notification()],
      unread_count: 1,
    })
    ;(notificationService.markAsRead as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: notification({ is_read: true }),
    })

    render(<NotificationBell />)
    fireEvent.click(await screen.findByRole('button', { name: 'Notifications' }))
    fireEvent.click(await screen.findByText('Booking accepted'))

    await waitFor(() => expect(notificationService.markAsRead).toHaveBeenCalledWith('notif-1'))
    await waitFor(() => expect(screen.queryByText('1')).not.toBeInTheDocument())
  })

  it('marks all as read and clears the badge', async () => {
    (notificationService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [notification(), notification({ id: 'notif-2' })],
      unread_count: 2,
    })
    ;(notificationService.markAllAsRead as ReturnType<typeof vi.fn>).mockResolvedValue({
      message: 'All notifications marked as read',
    })

    render(<NotificationBell />)
    fireEvent.click(await screen.findByRole('button', { name: 'Notifications' }))
    fireEvent.click(await screen.findByText('Mark all as read'))

    await waitFor(() => expect(notificationService.markAllAsRead).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument())
  })
})
