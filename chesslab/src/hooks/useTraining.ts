import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trainingService } from '../services/trainingService'
import { useAuthStore } from '../store/authStore'

export const useTrainingOverview = () => {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['training-overview'],
    queryFn: () => trainingService.overview(token!),
    enabled: !!token,
  })
}

export const useTrainingFamilies = () => {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['training-families'],
    queryFn: () => trainingService.families(token!),
    enabled: !!token,
  })
}

export const useGenerateCards = () => {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => trainingService.generate(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-overview'] })
      queryClient.invalidateQueries({ queryKey: ['training-families'] })
    },
  })
}
