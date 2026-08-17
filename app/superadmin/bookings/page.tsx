import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { Calendar, Clock, Mail, User, Video, RotateCcw, ExternalLink } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

interface DemoBooking {
  id: string
  calcom_uid: string | null
  calcom_event_type_slug: string | null
  title: string
  attendee_name: string | null
  attendee_email: string | null
  notes: string | null
  scheduled_at: string | null
  meeting_url: string | null
  status: 'scheduled' | 'cancelled' | 'rescheduled'
  created_at: string
}

async function getBookings(): Promise<DemoBooking[]> {
  const adminClient = createAdminSupabaseClient()
  const { data, error } = await adminClient
    .from('demo_bookings')
    .select('*')
    .order('scheduled_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[bookings] fetch error:', error)
    return []
  }

  return (data ?? []) as DemoBooking[]
}

const STATUS_STYLES: Record<DemoBooking['status'], string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  rescheduled: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default async function BookingsPage() {
  const bookings = await getBookings()

  const scheduled = bookings.filter((b) => b.status === 'scheduled')
  const past = bookings.filter((b) => b.status !== 'scheduled')

  return (
    <div className="min-h-screen bg-[#f5f2eb] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#420c14]/40 mb-1">Superadmin</p>
          <h1 className="text-2xl font-semibold text-[#420c14]">Demo Bookings</h1>
          <p className="text-sm text-[#420c14]/50 mt-1">
            Consultation calls booked from the landing pages
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: bookings.length },
            { label: 'Upcoming', value: scheduled.length },
            { label: 'Past / Cancelled', value: past.length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-[#420c14]/8 p-5 shadow-sm"
            >
              <p className="text-3xl font-semibold text-[#420c14]">{stat.value}</p>
              <p className="text-xs text-[#420c14]/45 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Upcoming */}
        {scheduled.length > 0 && (
          <section>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#420c14]/40 mb-3">Upcoming</p>
            <div className="bg-white rounded-2xl border border-[#420c14]/8 shadow-sm divide-y divide-[#420c14]/6">
              {scheduled.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </div>
          </section>
        )}

        {/* All / Past */}
        <section>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#420c14]/40 mb-3">
            {past.length > 0 ? 'Past & Cancelled' : 'All Bookings'}
          </p>
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#420c14]/8 shadow-sm px-6 py-12 text-center">
              <Calendar className="w-8 h-8 text-[#420c14]/15 mx-auto mb-3" />
              <p className="text-sm text-[#420c14]/40">No bookings yet</p>
            </div>
          ) : past.length === 0 && scheduled.length > 0 ? null : (
            <div className="bg-white rounded-2xl border border-[#420c14]/8 shadow-sm divide-y divide-[#420c14]/6">
              {(past.length > 0 ? past : bookings).map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function BookingRow({ booking: b }: { booking: DemoBooking }) {
  return (
    <div className="px-6 py-4 flex items-start gap-4">
      <div className="w-9 h-9 rounded-xl bg-[#DDA46F]/10 flex items-center justify-center shrink-0 mt-0.5">
        <Video className="w-4 h-4 text-[#DDA46F]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-[#420c14]">{b.title}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[b.status]}`}
          >
            {b.status}
          </span>
          {b.calcom_event_type_slug && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#420c14]/5 text-[#420c14]/40 border border-[#420c14]/10">
              {b.calcom_event_type_slug}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
          {b.attendee_name && (
            <span className="inline-flex items-center gap-1 text-xs text-[#420c14]/55">
              <User className="w-3 h-3" />
              {b.attendee_name}
            </span>
          )}
          {b.attendee_email && (
            <a
              href={`mailto:${b.attendee_email}`}
              className="inline-flex items-center gap-1 text-xs text-[#420c14]/55 hover:text-[#DDA46F] transition-colors"
            >
              <Mail className="w-3 h-3" />
              {b.attendee_email}
            </a>
          )}
          {b.scheduled_at && (
            <span className="inline-flex items-center gap-1 text-xs text-[#420c14]/55">
              <Clock className="w-3 h-3" />
              {format(new Date(b.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
              <span className="text-[#420c14]/35 ml-0.5">
                ({formatDistanceToNow(new Date(b.scheduled_at), { addSuffix: true })})
              </span>
            </span>
          )}
        </div>

        {b.notes && (
          <p className="text-xs text-[#420c14]/40 mt-1.5 line-clamp-2">{b.notes}</p>
        )}

        <div className="flex items-center gap-3 mt-2">
          {b.meeting_url && (
            <a
              href={b.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#DDA46F] hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Meeting link
            </a>
          )}
          {b.calcom_uid && (
            <a
              href={`https://cal.com/reschedule/${b.calcom_uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#420c14]/45 hover:text-[#420c14] hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              Reschedule
            </a>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-[11px] text-[#420c14]/35">
          Booked {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
