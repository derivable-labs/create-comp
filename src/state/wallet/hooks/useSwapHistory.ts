import _ from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { updateSwapTxs } from '../reducer'
import { State } from '../../types'
import { useWeb3React } from '../../customWeb3React/hook'
import { useMemo } from 'react'
import { useCurrentPool } from '../../currentPool/hooks/useCurrentPool'
import { PowerState } from 'powerLib/lib/index'
import { bn, weiToNumber } from '../../../utils/helpers'
import { SwapTxType } from '../type'
import { BigNumber } from 'ethers'

export const useSwapHistory = () => {
  const { swapLogs } = useSelector((state: State) => {
    return {
      swapLogs: state.wallet.swapLogs
    }
  })
  const { account } = useWeb3React()
  const dispatch = useDispatch()

  const addMultiSwapData = (swapLogs: any, account: string) => {
    console.log({
      account, txs: swapLogs
    })
    dispatch(updateSwapTxs({ account, swapLogs }))
  }

  return { addMultiSwapData, swapLogs: swapLogs[account] }
}

export const useSwapHistoryFormated = (): SwapTxType[] => {
  const { swapLogs: sls } = useSwapHistory()
  const { powers, states, poolAddress } = useCurrentPool()

  const logsBalances = (balances: any) => {
    const result = []
    for (const i in balances) {
      result.push(`${i.toString()} => ${weiToNumber(balances[i])}`)
    }
    return result
  }

  const result = useMemo(() => {
    try {
      if (!sls || sls.length === 0 || !poolAddress) return []
      const swapLogs = sls.slice().sort((a, b) => a.timeStamp - b.timeStamp)

      const p = new PowerState({ powers: [...powers] })
      p.loadStates(states)

      const result = []
      const balancesToCalculateLeverage = {}
      const balances: {[key: number]: BigNumber} = {}
      for (const swapLog of swapLogs) {
        if (swapLog.args.pool !== poolAddress) continue

        const steps = swapLog.args.steps
        const cAmount = bn(0)
        const cp = bn(0)
        const oldBalances = _.cloneDeep(balances)
        const oldLeverage = p.calculateCompExposure(balancesToCalculateLeverage)

        for (const step of steps) {
          balances[step.idIn.toString()] = balances[step.idIn.toString()] ? balances[step.idIn.toString()].sub(step.amountIn) : bn(0).sub(step.amountIn)
          balances[step.idOut.toString()] = balances[step.idOut.toString()] ? balances[step.idOut.toString()].add(step.amountOutMin) : bn(0).add(step.amountOutMin)

          if (powers[step.idIn]) {
            balancesToCalculateLeverage[powers[step.idIn]] = balancesToCalculateLeverage[powers[step.idIn]] ? balancesToCalculateLeverage[powers[step.idIn]].sub(step.amountIn) : bn(0).sub(step.amountIn)
          }
          if (powers[step.idOut]) {
            balancesToCalculateLeverage[powers[step.idOut]] = balancesToCalculateLeverage[powers[step.idOut]] ? balancesToCalculateLeverage[powers[step.idOut]].add(step.amountOutMin) : bn(0).add(step.amountOutMin)
          }
        }
        const newLeverage = p.calculateCompExposure(balancesToCalculateLeverage)
        result.push({
          transactionHash: swapLog.transactionHash,
          timeStamp: swapLog.timeStamp,
          cp,
          oldBalances,
          newBalances: _.cloneDeep(balances),
          cAmount,
          newLeverage,
          oldLeverage
        })
      }

      return result.sort((a, b) => (b.timeStamp - a.timeStamp))
    } catch (e) {
      console.error(e)
      return []
    }
  }, [sls, poolAddress, states])

  // @ts-ignore
  return result
}
