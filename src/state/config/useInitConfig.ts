import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { seNetworkConfigs, setConfigs } from './reducer'
import { addTokensReduce } from '../token/reducer'
import { Engine } from 'derivable-tools/dist/engine'
import { DEFAULT_CHAIN, NATIVE_ADDRESS, ZERO_ADDRESS } from '../../utils/constant'

export const useInitConfig = ({
  library,
  chainId,
  useSubPage,
  language,
  useLocation,
  useHistory,
  env,
  account
}: {
  library: any
  useLocation: any
  useHistory: any
  chainId: number
  useSubPage: any
  language: string
  account: string
  env: 'development' | 'production'
}) => {
  const dispatch = useDispatch()
  const location = useLocation()

  useEffect(() => {
    dispatch(
      setConfigs({
        useSubPage,
        language,
        env,
        location,
        useHistory
      })
    )
  }, [location, useHistory, chainId, useSubPage, language, env])

  useEffect(() => {
    const intConfig = async () => {
      if (!chainId) return
      if (!account) {
        console.log('=======await sync account========')
      }

      const engine = new Engine(
        {
          env,
          chainId,
          account: account || ZERO_ADDRESS,
          signer: library?.getSigner(),
          scanApiKey: '',
          storage: {
            // @ts-ignore
            setItem: (itemName, value) => localStorage.setItem(itemName, value),
            // @ts-ignore
            getItem: (itemName) => localStorage.getItem(itemName)
          }
        }
      )
      await engine.initServices()
      console.log(engine.profile.configs)
      dispatch(
        addTokensReduce({
          tokens: [{
            name: engine.profile.configs.nativeSymbol,
            symbol: engine.profile.configs.nativeSymbol,
            decimals: 18,
            address: NATIVE_ADDRESS
          }],
          chainId: chainId || DEFAULT_CHAIN
        })
      )
      dispatch(seNetworkConfigs({
        chainId,
        engine,
        configs: engine.profile.configs
      }))
      // dispatch(setEngine({ engine }))
    }

    intConfig()
  }, [library, account, chainId, env])
}
