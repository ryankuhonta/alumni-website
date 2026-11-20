import ChatThread from '@/components/messages/ChatThread'

export default function ConversationView({ id }: { id: string }) {
  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white border rounded-lg h-[calc(100vh-200px)] flex flex-col">
          <ChatThread conversationId={id} />
        </div>
      </div>
    </div>
  )
}
