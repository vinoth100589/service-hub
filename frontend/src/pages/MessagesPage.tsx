import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingSpinner from '@components/common/LoadingSpinner'
import EmptyState from '@components/common/EmptyState'
import { messageService } from '@services/messageService'
import { useAuthStore } from '@store/authStore'
import type { Conversation, Message } from '@/types'

export default function MessagesPage() {
  const user = useAuthStore((s) => s.user)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    messageService
      .getConversations()
      .then((res) => {
        setConversations(res.data)
        if (res.data.length > 0) setActiveBookingId(res.data[0].booking_id)
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoadingConversations(false))
  }, [])

  useEffect(() => {
    if (!activeBookingId) return
    setLoadingMessages(true)
    messageService
      .getByBooking(activeBookingId)
      .then((res) => setMessages(res.data))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoadingMessages(false))
  }, [activeBookingId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeBookingId || !content.trim() || !user) return

    const receiver = messages.find((m) => m.sender_id !== user.id)?.sender_id
    if (!receiver) {
      toast.error('No recipient found for this conversation yet.')
      return
    }

    setSending(true)
    try {
      const res = await messageService.send({
        booking_id: activeBookingId,
        receiver_id: receiver,
        content: content.trim(),
      })
      setMessages((prev) => [...prev, res.data])
      setContent('')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  if (loadingConversations) return <LoadingSpinner label="Loading conversations…" />

  if (conversations.length === 0) {
    return (
      <EmptyState
        title="No conversations yet"
        description="Messages tied to your bookings will show up here."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
      <aside className="card divide-y divide-gray-100">
        {conversations.map((conversation) => (
          <button
            key={conversation.booking_id}
            className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 ${
              conversation.booking_id === activeBookingId ? 'bg-primary-50' : ''
            }`}
            onClick={() => setActiveBookingId(conversation.booking_id)}
          >
            <p className="font-medium text-gray-900">
              Booking #{conversation.booking_id.slice(0, 8)}
            </p>
            <p className="truncate text-gray-500">{conversation.last_message}</p>
          </button>
        ))}
      </aside>

      <section className="card flex flex-col p-4">
        {loadingMessages ? (
          <LoadingSpinner label="Loading messages…" />
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                  message.sender_id === user?.id
                    ? 'ml-auto bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>
        )}

        <form className="flex gap-2 border-t border-gray-100 pt-3" onSubmit={handleSend}>
          <input
            className="input"
            placeholder="Type a message…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={sending}>
            Send
          </button>
        </form>
      </section>
    </div>
  )
}
