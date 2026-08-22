import { RefreshCw } from 'lucide-react'
import { useSyncGames } from '../../hooks/useSyncGames'

export const SyncButton = () => {
  const sync = useSyncGames()

  return (
    <div>
      <button
        className="btn-secondary"
        onClick={() => sync.mutate()}
        disabled={sync.isPending}
      >
        <RefreshCw size={16} className={sync.isPending ? 'spin' : undefined} />
        {sync.isPending ? 'A sincronizar...' : 'Sincronizar partidas'}
      </button>

      {sync.isSuccess && <p className="sync-status">{sync.data.message}</p>}
      {sync.isError && (
        <p className="sync-status error">{(sync.error as Error).message}</p>
      )}
    </div>
  )
}
