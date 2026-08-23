import { useQuery } from '@tanstack/react-query'
import { openingService } from '../services/openingService'
import { useAuthStore } from '../store/authStore'

export const useBookLines = (family: string | null) => {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['book-lines', family],
    queryFn: () => openingService.getBookLines(token!, family!),
    enabled: !!token && !!family,
  })
}
