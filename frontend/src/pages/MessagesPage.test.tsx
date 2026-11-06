import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MessagesPage from './MessagesPage'
import { messageService } from '@services/messageService'
import { useAuthStore } from '@store/authStore'
import type { Conversation, Message, User } from '@/types'

vi.mock('@services/messageService', () => ({
  messageService: {
    getConversations: vi.fn(),
    getByBooking: vi.fn(),
    send: vi.fn(),
  },
}))

const customer: User = {
  id: 'customer-1',
  email: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Doe',
  user_type: 'customer',
}

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    booking_id: 'booking-1',
    other_user_id: 'provider-user-1',
    other_user_name: 'Sparkle Cleaners',
    last_message: 'See you then',
    last_message_time: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ user: customer, token: 't', isAuthenticated: true })
})

// Regression coverage: the backend's getConversations response is keyed by
// `booking_id` (see messageController.ts) and already includes the other
// participant as `other_user_id` — sending used to re-derive the receiver
// by scanning loaded messages for someone else's sender_id, which fails
// for the very first message in a conversation (no messages loaded yet).
describe('MessagesPage sending a message', () => {
  it('sends to the conversation\'s other_user_id even before any messages have loaded', async () => {
    (messageService.getConversations as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [conversation()],
    })
    ;(messageService.getByBooking as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
    ;(messageService.send as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        id: 'msg-1',
        booking_id: 'booking-1',
        sender_id: 'customer-1',
        receiver_id: 'provider-user-1',
        content: 'Hello!',
        created_at: new Date().toISOString(),
      } as Message,
    })

    render(<MessagesPage />)

    const input = await screen.findByPlaceholderText('Type a message…')
    fireEvent.change(input, { target: { value: 'Hello!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(messageService.send).toHaveBeenCalledWith({
        booking_id: 'booking-1',
        receiver_id: 'provider-user-1',
        content: 'Hello!',
      })
    )
  })
})
