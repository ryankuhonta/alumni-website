import ConversationView from '@/components/messages/ConversationView'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ConversationView id={id} />
}
