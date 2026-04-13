import { keccak_256 } from '@noble/hashes/sha3'
import { bytesToHex } from '@noble/hashes/utils'

export type AddressCaseStatus =
  | 'valid-checksum'
  | 'unchecksummed'
  | 'invalid-checksum'

export const classifyAddressCase = (address: string): AddressCaseStatus => {
  if (address.length !== 42) return 'invalid-checksum'
  const body = address.slice(2)
  if (body === body.toLowerCase() || body === body.toUpperCase())
    return 'unchecksummed'
  return isEIP55Address(address) ? 'valid-checksum' : 'invalid-checksum'
}

/**
 * Encode an address with the EIP-55 mixed-case checksum.
 * Accepts any-case hex input; returns the canonical checksummed form.
 */
export const toChecksumAddress = (address: string): string => {
  const lowerAddress = `${address}`.toLowerCase().replace('0x', '')
  const hash = bytesToHex(keccak_256(lowerAddress))
  let ret = '0x'
  for (let i = 0; i < lowerAddress.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += lowerAddress[i].toUpperCase()
    } else {
      ret += lowerAddress[i]
    }
  }
  return ret
}

/**
 * Check whether an address matches its EIP-55 checksum.
 * @param address Address to be checked if conforms with EIP-55.
 * @returns Whether the address is in EIP-55 checksummed form.
 */
export const isEIP55Address = (address: string) => {
  if (address.length !== 42) {
    return false
  }
  return address === toChecksumAddress(address)
}

export const parseIntegerNumber = (number: string): number => {
  const parsed = parseInt(number)
  if (isNaN(parsed)) throw new Error('Invalid number.')
  if (parsed === Infinity) throw new Error('Invalid number.')
  return parsed
}

const ISO8601 =
  /^(?<date>[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]))[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([+-]([01][0-9]|2[0-3]):[0-5][0-9]))$/

export const isValidISO8601Date = (inputDate: string): boolean => {
  const inputMatch = ISO8601.exec(inputDate)

  if (!inputMatch) {
    return false
  }

  const roundTripped = new Date(inputMatch.groups.date)
    .toISOString()
    .slice(0, 10)

  return inputMatch.groups.date === roundTripped
}
