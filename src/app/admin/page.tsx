import { getUser } from '@/lib/auth'
import { isOwner } from '@/lib/owner'
import { redirect } from 'next/navigation'
import { InternalDashboard } from './InternalDashboard'

export const dynamic = 'force-dynamic'

export default async function InternalAnalyticsPage() {
  const user = await getUser()
  if (!user || !isOwner(user.email)) {
    redirect('/login')
  }

  return <InternalDashboard />
}
