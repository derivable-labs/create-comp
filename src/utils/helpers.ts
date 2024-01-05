import { BigNumber, ethers, utils } from 'ethers'

export const bn = ethers.BigNumber.from

const mdp = require('move-decimal-point')

export const BIG = (num: number | string | BigNumber): BigNumber => {
  if (!num) {
    return BigNumber.from(0)
  }
  switch (typeof num) {
    case 'string':
      if (num?.includes('e')) {
        num = Number(num)
      }
    case 'number':
      return BigNumber.from(num || 0)
    default:
      return num
  }
}

export const NUM = (num: number | string | BigNumber): number => {
  if (!num) {
    return 0
  }
  switch (typeof num) {
    case 'number':
      return num
    case 'string':
      if (num == '∞') {
        return Number.POSITIVE_INFINITY
      }
      if (num == '-∞') {
        return Number.NEGATIVE_INFINITY
      }
      return Number.parseFloat(num)
    default:
      return num.toNumber()
  }
}
export const STR = (
  num: number | string | BigNumber,
  minimumSignificantDigits?: number
): string => {
  if (!num) {
    return '0'
  }
  switch (typeof num) {
    case 'string':
      if (!num?.includes('e')) {
        return num
      }
      num = Number(num)
    case 'number':
      if (!isFinite(num)) {
        return num > 0 ? '∞' : '-∞'
      }
      return num.toLocaleString(['en-US', 'fullwide'], {
        useGrouping: false,
        minimumSignificantDigits
      })
    default:
      return String(num)
  }
}

function _replaceAt(str: string, index: number, replacement: string) {
  return (
    str.substring(0, index) +
    replacement +
    str.substring(index + replacement.length)
  )
}
export const truncate = (
  num: string,
  decimals: number = 0,
  rounding: boolean = false
): string => {
  let index = Math.max(num.lastIndexOf('.'), num.lastIndexOf(','))
  if (index < 0) {
    index = num.length
  }
  index += decimals + (decimals > 0 ? 1 : 0)
  if (rounding) {
    let shouldRoundUp = false
    for (let i = index; i < num.length; ++i) {
      if (num.charAt(i) == '.') {
        continue
      }
      if (Number(num.charAt(i)) >= 5) {
        shouldRoundUp = true
        break
      }
    }
    for (let i = index - 1; shouldRoundUp && i >= 0; --i) {
      let char = num.charAt(i)
      if (char == '.') {
        continue
      }
      if (char == '9') {
        char = '0'
      } else {
        char = (Number(char) + 1).toString()
        shouldRoundUp = false
      }
      num = _replaceAt(num, i, char)
    }
  }
  return num.substring(0, index)
}

export const WEI = (num: number | string, decimals: number = 18): string => {
  return truncate(mdp(STR(num), decimals))
}

export const IEW = (
  wei: BigNumber | string,
  decimals: number = 18,
  decimalsToDisplay?: number
): string => {
  let num = mdp(STR(wei), -decimals)
  if (decimalsToDisplay != null) {
    num = truncate(num, decimalsToDisplay)
  }
  return num
}

export const shortenAddressString = (address: string) => {
  return (
    address.slice?.(0, 6) +
    '...' +
    address.slice?.(address.length - 4, address.length)
  )
}

export const weiToNumber = (
  wei: any,
  decimal: number = 18,
  decimalToDisplay?: number
): string => {
  if (!wei || !Number(wei)) return '0'
  wei = wei.toString()
  const result = utils.formatUnits(wei, decimal)
  const num =
    result.indexOf('.') === result.length - 1 ? result.slice(0, -1) : result
  if (decimalToDisplay) {
    return num.slice(0, result.indexOf('.') + decimalToDisplay)
  }
  return num
}

export const numberToWei = (number: any, decimal: number = 18) => {
  if (!number) return '0'
  number = number.toString()

  const arr = number.split('.')
  if (arr[1] && arr[1].length > decimal) {
    arr[1] = arr[1].slice(0, decimal)
    number = arr.join('.')
  }

  return utils.parseUnits(number, decimal).toString()
}

export const maxBN = (a: BigNumber, b: BigNumber) => {
  if (a.gt(b)) {
    return a
  }
  return b
}

export const minBN = (a: BigNumber, b: BigNumber) => {
  if (a.lt(b)) {
    return a
  }
  return b
}

export function overrideContract(provider: any, deployedBytecode: string) {
  if (typeof provider.setStateOverride === 'undefined') {
    throw 'provider: state override not supported'
  }
  const address = ethers.utils.keccak256(deployedBytecode).substring(0, 42)
  provider.setStateOverride({
    ...provider.getStateOverride(),
    [address]: { code: deployedBytecode }
  })
  return address
}

export const parseCallStaticError = (error: any) => {
  const message = error.data?.message
    ? error.data?.message?.replace('check error: ', '') || 'Error'
    : error.message
  if (message.includes('reverted with reason string')) {
    const arr = message.split('reason="')
    const m = arr[1]
    return m?.split('"')[0]
  } else if (message.includes('insufficient funds for transfer')) {
    return 'insufficient funds for transfer'
  } else if (message.includes('insufficient funds for gas * price + value')) {
    return 'insufficient funds for gas * price + value'
  } else if (message.includes('VM Exception while processing transaction:')) {
    const arr = message.split('VM Exception while processing transaction:')
    const m = arr[1]
    return m?.split('[')[0]?.replace('reverted with', '').trim()
  }
  return message
}

export const formatFloat = (number: number | string, decimal?: number) => {
  if (!decimal) {
    decimal = detectDecimalFromPrice(number)
  }

  number = number.toString()
  const arr = number.split('.')
  if (arr.length > 1) {
    arr[1] = arr[1].slice(0, decimal)
  }
  return Number(arr.join('.'))
}

export const mul = (a: any, b: any) => {
  const result = weiToNumber(
    BigNumber.from(numberToWei(a)).mul(numberToWei(b)),
    36
  )
  const arr = result.split('.')
  arr[1] = arr[1]?.slice(0, 18)
  return arr[1] ? arr.join('.') : arr.join('')
}

export const sub = (a: any, b: any) => {
  return weiToNumber(BigNumber.from(numberToWei(a)).sub(numberToWei(b)))
}

export const div = (a: any, b: any) => {
  if (!b || b.toString() === '0') {
    return '0'
  }
  return weiToNumber(BigNumber.from(numberToWei(a, 36)).div(numberToWei(b)))
}

export const add = (a: any, b: any) => {
  return weiToNumber(BigNumber.from(numberToWei(a)).add(numberToWei(b)))
}

export const formatPercent = (floatNumber: any, decimal: number = 2) => {
  floatNumber = floatNumber.toString()
  return formatFloat(weiToNumber(numberToWei(floatNumber), 16), decimal)
}

export const getNormalAddress = (addresses: string[]) => {
  return addresses.filter((adr: string) => /^0x[0-9,a-f,A-Z]{40}$/g.test(adr))
}

/**
 *
 * @param addresses address with format 0x...-id
 * example 0x72bB2D0F05D6b0c346023f978F6fA19e9e3c353c-0
 */
export const getErc1155Token = (addresses: string[]) => {
  const erc1155Addresses = addresses.filter(isErc1155Address)
  const result = {}
  for (let i = 0; i < erc1155Addresses.length; i++) {
    const address = erc1155Addresses[i].split('-')[0]
    const id = erc1155Addresses[i].split('-')[1]
    if (!result[address]) {
      result[address] = [bn(id)]
    } else {
      result[address].push(bn(id))
    }
  }
  return result
}

export const isErc1155Address = (address: string) => {
  return /^0x[0-9,a-f,A-Z]{40}-[0-9]{1,}$/g.test(address)
}

export const decodeErc1155Address = (address: string) => {
  return {
    address: address.split('-')[0],
    id: address.split('-')[1]
  }
}

export const parseUq112x112 = (value: BigNumber, unit = 1000) => {
  return value.mul(unit).shr(112).toNumber() / unit
}

export const formatMultiCallBignumber = (data: any) => {
  return data.map((item: any) => {
    if (item.type === 'BigNumber') {
      item = bn(item.hex)
    }

    if (Array.isArray(item)) {
      item = formatMultiCallBignumber(item)
    }
    return item
  })
}

export const formatDate = (timestamp: number) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const d = date.getDate()
  const m = date.getMonth() + 1 // Month from 0 to 11
  const y = date.getFullYear()
  return y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d)
}

export const formatTime = (timestamp: number) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const h = date.getHours()
  const m = date.getMinutes() + 1 // Month from 0 to 11
  const s = date.getSeconds()
  return (
    (h <= 9 ? '0' + h : h) +
    ':' +
    (m <= 9 ? '0' + m : m) +
    ':' +
    (s <= 9 ? '0' + s : s)
  )
}

export const detectDecimalFromPrice = (price: number | string) => {
  if (Number(price || 0) === 0 || Number(price || 0) >= 1) {
    return 4
  } else {
    const rate = !bn(numberToWei(price)).isZero()
      ? weiToNumber(
        BigNumber.from(numberToWei(1, 36)).div(numberToWei(price)).toString()
      )
      : '0'
    return rate.split('.')[0].length + 3
  }
}
// extract the integer number before the decimal point
export const numInt = (v: any): string => {
  return v.split('.')[0]
}

// extract the decimals part including the decimal point
export const numDec = (v: any): string => {
  return v.match(/\.[\d₀₁₂₃₄₅₆₇₈₉]+$/g) || '\u00A0'
}
export const cutDecimal = (number: string, decimal?: number) => {
  if (!decimal) {
    decimal = detectDecimalFromPrice(number)
  }

  number = number.toString()
  const arr = number.split('.')
  if (arr.length > 1) {
    arr[1] = arr[1].slice(0, decimal)
  }
  return arr.join('.')
}
