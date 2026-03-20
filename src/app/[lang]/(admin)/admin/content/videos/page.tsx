import { getAllVideos } from '@/app/actions/adminActions'
import { VideosClient } from '@/components/admin/VideosClient'

export const dynamic = 'force-dynamic'

export default async function AdminVideosPage() {
  const videos = await getAllVideos()
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-(--text-primary)">Manage Videos</h1>
        <p className="text-sm text-(--text-tertiary) mt-1">Upload and manage promotional learning modules.</p>
      </div>
      <VideosClient initialVideos={videos} />
    </div>
  )
}
