import useSWR from 'swr'
import { useConfigs } from '../state/config/useConfigs'

export const useNativePrice = () => {
  const { ddlEngine } = useConfigs()
  return useSWR({ ddlEngine }, ({ ddlEngine }) => {
    if (ddlEngine) {
      return ddlEngine.PRICE.getNativePrice()
    }
    return undefined
  })
}
