"use client"
import { Header } from "@/components/header"

interface GalleryPageProps {
  params: Promise<{ dateId: string; weddingNameId: string }>
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { dateId, weddingNameId } = await params
  
  return <GalleryPageClient dateId={dateId} weddingNameId={weddingNameId} />
}

function GalleryPageClient({ dateId, weddingNameId }: { dateId: string; weddingNameId: string }) {
  const mockPhotos = [
    { id: 1, title: "Engagement Photo 1" },
    { id: 2, title: "Engagement Photo 2" },
    { id: 3, title: "Engagement Photo 3" },
    { id: 4, title: "Engagement Photo 4" },
    { id: 5, title: "Engagement Photo 5" },
    { id: 6, title: "Engagement Photo 6" },
  ]

  return (
    <main className="min-h-screen bg-background">
      <Header showBackButton backHref={`/${dateId}/${weddingNameId}`} title="Gallery" />

      {/* Gallery */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Our Photos</h1>
          <p className="text-muted-foreground">A glimpse into our love story</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {mockPhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-muted border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 aspect-square flex items-center justify-center group cursor-pointer"
            >
              <div className="text-center group-hover:scale-110 transition-transform duration-300">
                <div className="text-5xl text-muted-foreground/50 mb-2">📷</div>
                <p className="text-muted-foreground text-sm">{photo.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}