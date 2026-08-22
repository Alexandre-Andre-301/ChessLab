import { useQuery } from '@tanstack/react-query'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'

export const useMe = () => {
  const token = useAuthStore((state) => state.token)
  const setUser = useAuthStore((state) => state.setUser)

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const user = await authService.me(token!)
      setUser(user)
      return user
    },
    enabled: !!token,
  })
}
