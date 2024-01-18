import { utils } from 'ethers'
import { isAddress } from 'ethers/lib/utils'
import React, { Fragment, useEffect, useMemo, useState } from 'react'
import { useContract } from '../../hooks/useContract'
import { useConfigs } from '../../state/config/useConfigs'
import { useHelper } from '../../state/config/useHelper'
import { usePoolSettings } from '../../state/poolSettings/hook'
import { useListTokens } from '../../state/token/hook'
import { ZERO_ADDRESS } from '../../utils/constant'
import { bn, zerofy } from '../../utils/helpers'
import { SelectTokenModal } from '../SelectTokenModal'
import { Box } from '../ui/Box'
import { CurrencyLogo } from '../ui/CurrencyLogo'
import { SwapIcon } from '../ui/Icon'
import { Input } from '../ui/Input'
import NumberInput from '../ui/Input/InputNumber'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { Text, TextBlue, TextGrey } from '../ui/Text'
import './style.scss'
export const feeOptions = [100, 300, 500, 1000]
export const OracleConfigBox = () => {
  const { poolSettings, updatePoolSettings } = usePoolSettings()
  const { ddlEngine } = useConfigs()
  const [pairInfo, setPairInfo] = useState<string[]>([])
  const [quoteTokenIndex, setQuoteTokenIndex] = useState<string>('0')
  const [windowTimeSuggest, setWindowTimeSuggest] = useState<string[]>([])
  const [mark, setMark] = useState<string>('')
  const [markSuggest, setMarkSuggest] = useState<string[]>([])
  const [initTime, setInitTime] = useState<string>('')
  const [initTimeSuggest, setInitTimeSuggest] = useState<string[]>([])
  const [token0, setToken0] = useState<any>({})
  const [token1, setToken1] = useState<any>({})
  const { configs } = useConfigs()
  const [fee, setFee] = useState<any>(null)
  const { tokens } = useListTokens()
  const { getTokenIconUrl } = useHelper()
  const [visibleSelectTokenModal, setVisibleSelectTokenModal] =
    useState<boolean>(false)
  const [selectingToken, setSelectingToken] = useState<
    'token0' | 'token1' | ''
  >('')
  const { getUniV3FactoryContract } = useContract()

  const suggestConfigs = (qTIndex: string, qTDecimal: string) => {
    // const filterExistPoolData = Object.entries(pools).filter(([key]) => {
    //   return key.includes(poolSettings.pairAddress.substring(2).toLowerCase())
    // })
    const filterExistPoolData: any = []
    const wTimeArr = []
    const markArr = []
    const iTimeArr = []
    for (let index = 0; index < filterExistPoolData.length; index++) {
      const poolData = filterExistPoolData[index][1]
      const oracle = poolData.ORACLE
      if (
        (qTIndex === '0' && oracle.includes('0x0')) ||
        (qTIndex === '1' && oracle.includes('0x8'))
      ) {
        wTimeArr.push(bn(oracle).shr(192).toNumber().toString())
        if (parseInt(qTDecimal) === 6) {
          markArr.push(
            Math.pow(poolData.MARK.mul(1e6).shr(128).toNumber(), 2).toString()
          )
        } else {
          markArr.push(
            Math.pow(poolData.MARK.shr(128).toNumber(), 2).toString()
          )
        }
        iTimeArr.push(poolData.INIT_TIME.toNumber().toString())
      }
    }
    updatePoolSettings({
      window: String(parseInt(wTimeArr[0]))
    })
    setWindowTimeSuggest(wTimeArr)
    setMark(markArr[0])
    setMarkSuggest(markArr)
    setInitTime(iTimeArr[0])
    setInitTimeSuggest(iTimeArr)
  }

  useEffect(() => {
    if (token0 && token1 && fee) {
      getPairAddress()
    }
  }, [token0, token1, fee])

  useEffect(() => {
    fetchPairInfo()
  }, [poolSettings.pairAddress])

  const getPairAddress = async () => {
    try {
      const contract = getUniV3FactoryContract()
      const res = await contract.getPool(token0.address, token1.address, fee)
      if (res !== poolSettings.pairAddress) {
        updatePoolSettings({
          pairAddress: utils.getAddress(res)
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  const { getUniV3PairContract } = useContract()

  const formatTokenType = async (token: any) => {
    return {
      address: utils.getAddress(token.adr),
      decimals: token.decimals,
      symbol: token.symbol,
      name: token.name,
      logoURI: await getTokenIconUrl(utils.getAddress(token.adr))
    }
  }
  const [fetchPairLoading, setFetchPairLoading] = useState(false)
  const fetchPairInfo = async () => {
    if (
      ddlEngine &&
      poolSettings.pairAddress &&
      poolSettings.pairAddress !== ZERO_ADDRESS &&
      isAddress(poolSettings.pairAddress)
    ) {
      try {
        setFetchPairLoading(true)
        console.log('#pair-start-fetch')
        const res = await ddlEngine.UNIV3PAIR.getPairInfo({
          pairAddress: poolSettings.pairAddress
        })
        const pairContract = getUniV3PairContract(poolSettings.pairAddress)
        const fee = await pairContract.fee()
        console.log('#pair-fetch', res, fee)
        console.log('#q', await formatTokenType(res.token0))
        const _token0 = await formatTokenType(res.token0)
        const _token1 = await formatTokenType(res.token1)
        setToken0(_token0)
        setToken1(_token1)
        setFee(fee)
        let QTI
        if (QTI == null && _token0.symbol.includes('USD')) {
          QTI = 0
        }
        if (QTI == null && _token1.symbol.includes('USD')) {
          QTI = 1
        }
        if (QTI == null && configs.stablecoins.includes(token0)) {
          QTI = 0
        }
        if (QTI == null && configs.stablecoins.includes(token1)) {
          QTI = 1
        }
        if (QTI == null && configs.wrappedTokenAddress === token0) {
          QTI = 0
        }
        if (QTI == null && configs.wrappedTokenAddress === token1) {
          QTI = 1
        }
        updatePoolSettings({
          quoteToken: QTI === 1 ? _token1 : _token0
        })
        updatePoolSettings({
          baseToken: QTI === 1 ? _token0 : _token1
        })

        updatePoolSettings({
          searchBySymbols: {
            key1: baseToken.symbol?.slice(1),
            key2: baseToken.symbol?.slice(-1)
          }
        })

        setQuoteTokenIndex(String(QTI) || '0')
        setFetchPairLoading(false)
        // setPairInfo1({ pair: poolSettings.pairAddress, ...res })
        // console.log(res)
        // if (res.token0.symbol.toLowerCase().includes('us') || res.token0.symbol.toLowerCase().includes('dai')) {
        //   setPairInfo([
        //     res.token1.symbol + '/' + res.token0.symbol,
        //     res.token0.symbol + '/' + res.token1.symbol
        //   ])
        //   setQuoteTokenIndex('0')
        //   suggestConfigs('0', res.token0.decimals)
        // } else {
        //   setPairInfo([
        //     res.token0.symbol + '/' + res.token1.symbol,
        //     res.token1.symbol + '/' + res.token0.symbol
        //   ])
        //   setQuoteTokenIndex('1')
        //   suggestConfigs('1', res.token1.decimals)
        // }
      } catch (error) {
        setFetchPairLoading(false)
        console.log('#pair-load-error', error)
        setPairInfo(['Can not get Pair Address Info'])
      }
    }
  }
  const quoteToken = useMemo(
    () => (quoteTokenIndex === '0' ? token0 : token1),
    [token0, token1, quoteTokenIndex]
  )
  const baseToken = useMemo(
    () => (quoteTokenIndex === '0' ? token1 : token0),
    [token0, token1, quoteTokenIndex]
  )

  return (
    <React.Fragment>
      <Box className='oracle-config-box mt-1 mb-2' borderColor='blue'>
        <TextBlue className='oracle-config__title'>Oracle Index</TextBlue>
        <div className='ddl-pool-page__content--pool-config'>
          <div className='config-item'>
            {/* <TextBlue fontSize={14} fontWeight={600} /> */}
            <Input
              inputWrapProps={{
                className: 'config-input-oracle-config',
                style: {
                  width: '100%'
                }
              }}
              width='100%'
              value={poolSettings.pairAddress}
              placeholder='0x...'
              onChange={(e) => {
                // @ts-ignore
                updatePoolSettings({
                  pairAddress: (e.target as HTMLInputElement).value
                })
              }}
            />
          </div>
        </div>
        <div className='oracle-config__select-token-box'>
          {/* <div
            className='oracle-config__token-wrap'
            // onClick={() => {
            //   setSelectingToken('token1')
            //   setVisibleSelectTokenModal(true)
            // }}
          >
            <div className='oracle-config__token'>
              {baseToken.logoURI && (
                <CurrencyLogo currencyURI={baseToken.logoURI} size={24} />
              )}
              {baseToken.symbol || 'Base Token'}
            </div>
          </div> */}

          {quoteToken.symbol && baseToken.symbol ? (
            <Fragment>
              <div className='oracle-config__token-wrap'>
                <div className='oracle-config__token'>
                  {baseToken.logoURI && (
                    <CurrencyLogo currencyURI={baseToken.logoURI} size={24} />
                  )}
                  {quoteToken.logoURI && (
                    <CurrencyLogo currencyURI={quoteToken.logoURI} size={24} />
                  )}
                  {baseToken.symbol} / {quoteToken.symbol}
                </div>
              </div>
              <div
                onClick={() => {
                  setQuoteTokenIndex(quoteTokenIndex === '0' ? '1' : '0')
                }}
                style={{ textAlign: 'center', cursor: 'pointer' }}
              >
                <SwapIcon />
              </div>
              <SkeletonLoader loading={poolSettings.markPrice === '0'}>
                {zerofy(
                  quoteTokenIndex === '0'
                    ? String(1 / Number(poolSettings.markPrice))
                    : poolSettings.markPrice
                )}
              </SkeletonLoader>

              <TextGrey className='config-fee'>
                {fee
                  ? `Uniswap V3 (${fee / 10_000}% fee)`
                  : quoteToken?.symbol && baseToken.symbol
                  ? 'Uniswap V2'
                  : ''}
              </TextGrey>
            </Fragment>
          ) : fetchPairLoading ? (
            <Fragment>
              <SkeletonLoader
                style={{ width: '100%' }}
                loading={fetchPairLoading}
              />
            </Fragment>
          ) : (
            <Fragment>
              <div className='oracle-config__token-wrap'>
                <div className='oracle-config__token'>Base Token</div>
              </div>
              <div className='oracle-config__token-wrap'>
                <div className='oracle-config__token'>Quote Token</div>
              </div>
            </Fragment>
          )}
        </div>
        <div
          // className='oracle-config__select-fee-box'
          style={{ textAlign: 'center' }}
        >
          {/* {feeOptions.map((_fee, _) => {
            return (
              <ButtonGrey
                key={_}
                className={`btn-select-fee ${_fee === fee && 'active'}`}
                onClick={() => setFee(_fee)}
              >
                {_fee / 10000}%
              </ButtonGrey>
            )
          })} */}
          {/* <ButtonGrey
            className={`btn-select-fee ${fee === 100 && 'active'}`}
            onClick={() => setFee(100)}
          >
            0.01%
          </ButtonGrey>
          <ButtonGrey
            className={`btn-select-fee ${fee === 300 && 'active'}`}
            onClick={() => setFee(300)}
          >
            0.03%
          </ButtonGrey>
          <ButtonGrey
            className={`btn-select-fee ${fee === 500 && 'active'}`}
            onClick={() => setFee(500)}
          >
            0.05%
          </ButtonGrey>
          <ButtonGrey
            className={`btn-select-fee ${fee === 1000 && 'active'}`}
            onClick={() => setFee(1000)}
          >
            0.1%
          </ButtonGrey> */}
        </div>
      </Box>

      <Box
        borderColor='blue'
        className='oracle-config-box mt-1 mb-1 grid-container'
      >
        <TextBlue className='oracle-config__title'>Configurations</TextBlue>

        {Object.keys(poolSettings.searchBySymbols).map((key, idx) => {
          return (
            <div className='config-item' key={idx}>
              <Text fontSize={14} fontWeight={600}>
                Search Keyword {idx + 1}
              </Text>
              <Input
                inputWrapProps={{
                  className: `config-input ${
                    windowTimeSuggest.includes(poolSettings.window.toString())
                      ? ''
                      : 'warning-input'
                  }`
                }}
                value={String(poolSettings.searchBySymbols[key])}
                onChange={(e) => {
                  // @ts-ignore
                  if (Number(e.target.value) >= 0) {
                    const _searchBySymbols = poolSettings.searchBySymbols
                    _searchBySymbols[key] = e.target.value
                    updatePoolSettings({
                      searchBySymbols: _searchBySymbols
                    })
                  }
                }}
              />
            </div>
          )
        })}

        <div className='config-item'>
          <Text fontSize={14} fontWeight={600}>
            TWAP Window
          </Text>
          <NumberInput
            inputWrapProps={{
              className: `config-input ${
                windowTimeSuggest.includes(poolSettings.window.toString())
                  ? ''
                  : 'warning-input'
              }`
            }}
            placeholder='0'
            value={String(poolSettings.window)}
            onValueChange={(e) => {
              // @ts-ignore
              if (Number(e.target.value) >= 0) {
                updatePoolSettings({
                  window: (e.target as HTMLInputElement).value
                })
              }
            }}
            suffix='seconds'
          />
        </div>
        <div className='config-item'>
          <div className='config-item'>
            <Text fontSize={14} fontWeight={600}>
              Leverage (compounding)
            </Text>
            <NumberInput
              inputWrapProps={{
                className: 'config-input'
              }}
              placeholder='0'
              value={String(poolSettings.power)}
              onValueChange={(e) => {
                // @ts-ignore
                if (Number(e.target.value) >= 0) {
                  updatePoolSettings({
                    power: (e.target as HTMLInputElement).value
                  })
                }
              }}
              onBlur={(e) => {
                if (Number(e.target.value) >= 0) {
                  const powerRounded =
                    Math.round(Number(e.target.value) * 2) / 2
                  updatePoolSettings({ power: String(powerRounded) })
                }
              }}
              suffix='x'
            />
          </div>
        </div>

        <div className='config-item'>
          <Text fontSize={14} fontWeight={600}>
            Interest Rate
          </Text>
          <NumberInput
            inputWrapProps={{
              className: 'config-input'
            }}
            placeholder='0'
            value={String(String(poolSettings.interestRate))}
            onValueChange={(e) => {
              // @ts-ignore
              // if (Number(e.target.value) >= 0) {
              updatePoolSettings({
                interestRate: (e.target as HTMLInputElement).value
              })
              // }
            }}
            suffix='%/24h'
            // suffix={
            //   poolSettings.interestRate !== '0'
            //     ? (
            //       rateToHL(
            //         NUM(poolSettings.interestRate) / 100,
            //         NUM(poolSettings.power)
            //       ) / SECONDS_PER_DAY
            //     )
            //       .toFixed(2)
            //       .toString() + ' days'
            //     : ''
            // }
          />
        </div>

        <div className='config-item'>
          <Text fontSize={14} fontWeight={600}>
            Max Premium Rate
          </Text>
          <NumberInput
            inputWrapProps={{
              className: 'config-input'
            }}
            placeholder='0'
            value={String(poolSettings.premiumRate)}
            onValueChange={(e) => {
              // @ts-ignore
              if (Number(e.target.value) >= 0) {
                updatePoolSettings({
                  premiumRate: (e.target as HTMLInputElement).value
                })
              }
            }}
            suffix='%/24h'
            // suffix={
            //   (
            //     rateToHL(
            //       poolSettings.premiumRate
            //         ? NUM(poolSettings.premiumRate) / 100
            //         : 0,
            //       NUM(poolSettings.power)
            //     ) / SECONDS_PER_DAY
            //   )
            //     .toFixed(2)
            //     .toString() + ' days'
            // }
          />
        </div>

        <div className='config-item'>
          <Text fontSize={14} fontWeight={600}>
            Opening Fee
          </Text>
          <NumberInput
            inputWrapProps={{
              className: 'config-input'
            }}
            placeholder='0.0'
            value={String(poolSettings.openingFee)}
            onValueChange={(e) => {
              // @ts-ignore
              if (Number(e.target.value) >= 0) {
                updatePoolSettings({
                  openingFee: (e.target as HTMLInputElement).value
                })
              }
            }}
            suffix='%'
          />
        </div>

        <div className='config-item'>
          <Text fontSize={14} fontWeight={600}>
            Position Vesting Time
          </Text>
          <NumberInput
            inputWrapProps={{
              className: 'config-input'
            }}
            placeholder='0'
            value={String(poolSettings.vesting)}
            onValueChange={(e) => {
              // @ts-ignore
              if (Number(e.target.value) >= 0) {
                updatePoolSettings({
                  vesting: (e.target as HTMLInputElement).value
                })
              }
            }}
            suffix='seconds'
            // suffix={
            //   poolSettings.vesting
            //     ? (NUM(poolSettings.vesting) / 60).toFixed(2).toString() +
            //       ' min(s)'
            //     : ''
            // }
          />
        </div>

        <div className='config-item'>
          <Text fontSize={14} fontWeight={600}>
            Closing Fee
          </Text>
          <NumberInput
            inputWrapProps={{
              className: 'config-input'
            }}
            placeholder='0.0'
            value={String(poolSettings.closingFee)}
            onValueChange={(e) => {
              // @ts-ignore
              if (Number(e.target.value) >= 0) {
                updatePoolSettings({
                  closingFee: (e.target as HTMLInputElement).value
                })
              }
            }}
            suffix='%'
          />
        </div>

        <div className='config-item'>
          <Text fontSize={14} fontWeight={600}>
            No Closing Fee After
          </Text>
          <NumberInput
            inputWrapProps={{
              className: 'config-input'
            }}
            placeholder='0'
            value={String(poolSettings.closingFeeDuration)}
            onValueChange={(e) => {
              // @ts-ignore
              if (Number(e.target.value) >= 0) {
                updatePoolSettings({
                  closingFeeDuration: String(
                    parseFloat((e.target as HTMLInputElement).value)
                  )
                })
              }
            }}
            suffix='hours'
          />
        </div>
      </Box>
      <SelectTokenModal
        visible={visibleSelectTokenModal}
        setVisible={setVisibleSelectTokenModal}
        iniTokens={Object.values(tokens)}
        onSelectToken={(token: any) => {
          console.log(selectingToken)
          if (selectingToken === 'token0') {
            setToken0(token)
          } else {
            setToken1(token)
          }
        }}
      />
    </React.Fragment>
  )
}
