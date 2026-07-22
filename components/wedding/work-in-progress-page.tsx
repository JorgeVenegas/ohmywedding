import { Heart } from "lucide-react"

interface Props {
  coupleNames: string
  weddingDate?: string | null
}

export function WorkInProgressPage({ coupleNames, weddingDate }: Props) {
  const formattedDate = weddingDate
    ? new Date(weddingDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <div className="min-h-screen bg-[#f5f2eb] flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Brand mark */}
        <div className="flex items-center justify-center gap-2 text-[#DDA46F]">
          <Heart className="w-5 h-5 fill-current" />
          <span className="text-sm font-medium tracking-widest uppercase text-[#420c14]/40">
            OhMyWedding
          </span>
        </div>

        {/* Ornament */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-[#DDA46F]/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#DDA46F]/50" />
          <div className="flex-1 h-px bg-[#DDA46F]/30" />
        </div>

        {/* Names */}
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#420c14] leading-tight">
            {coupleNames}
          </h1>
          {formattedDate && (
            <p className="mt-3 text-sm text-[#420c14]/50 tracking-wide">{formattedDate}</p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-[#DDA46F]/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#DDA46F]/30" />
          <div className="flex-1 h-px bg-[#DDA46F]/20" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="font-serif text-xl text-[#420c14]/80">
            Something beautiful is on its way.
          </p>
          <p className="text-sm text-[#420c14]/50 leading-relaxed">
            We&rsquo;re putting the finishing touches on this invitation.
            <br />
            Check back soon.
          </p>
        </div>
      </div>
    </div>
  )
}
