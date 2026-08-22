import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import type { LoginFormData } from '../schemas/authSchema'

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: LoginFormData) => {
      const { access_token } = await authService.login(data)
      const user = await authService.me(access_token)
      return { access_token, user }
    },
    onSuccess: ({ access_token, user }) => {
      setAuth(access_token, user)
      navigate(user.onboarding_completed ? '/' : '/onboarding')
    },
  })
}
