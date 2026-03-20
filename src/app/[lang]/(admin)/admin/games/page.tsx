import { getGameConfig } from '@/app/actions/adminActions'
import { GameConfigClient } from '@/components/admin/GameConfigClient'
import { Gamepad2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function GamesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const config = await getGameConfig()
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Gamepad2 className="w-5 h-5 text-(--purple)" />
          <span className="text-[10px] font-black text-(--purple) uppercase tracking-widest">Game Configuration</span>
        </div>
        <h1 className="text-2xl font-black text-(--text-primary) tracking-tighter">Token Game Settings</h1>
        <p className="text-sm text-(--text-tertiary) mt-1">Configure win tokens and daily play limits for each game tier.</p>
      </div>
      <GameConfigClient initialConfig={config} />
    </div>
  )
}
