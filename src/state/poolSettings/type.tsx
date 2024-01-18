import { BigNumber } from 'ethers'
import { type } from 'os'
import { TokenType } from '../token/type'

export type PoolSettingsType = {
  pairAddress: string
  power: string
  window: string
  windowBlocks?: string
  interestRate: string
  premiumRate: string
  vesting: string
  closingFeeDuration: string
  closingFee: string
  openingFee: string
  amountIn: string | string
  reserveToken: string
  errorMessage?: string
  searchBySymbols: string[]
  gasUsed: string
  markPrice: string
  R?: string | string
  x?: string
  newPoolAddress?: string
  gasPrice: BigNumber
  baseToken?: TokenType
  quoteToken?: TokenType
}

export const initialState: PoolSettingsType = {
  pairAddress: '',
  window: '120',
  power: '2',
  interestRate: '0.03',
  searchBySymbols: ['', ''],
  premiumRate: '0.3',
  vesting: '60',
  openingFee: '0',
  closingFee: '0.3',
  closingFeeDuration: '24',
  amountIn: '0',
  reserveToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  // reserveToken: ''0xBa95100a0c3abaD1e10414Be77347D3D0900D8c2'', // PlayDerivable
  errorMessage: '',
  gasUsed: '0',
  markPrice: '0',
  x: '0',
  gasPrice: BigNumber.from(0)
}
