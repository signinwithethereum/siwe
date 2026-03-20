import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex } from "@noble/hashes/utils";
/**
 * This method is supposed to check if an address is conforming to EIP-55.
 * @param address Address to be checked if conforms with EIP-55.
 * @returns Either the return is or not in the EIP-55 format.
 */
export const isEIP55Address = (address: string) => {
  if (address.length != 42) {
    return false;
  }

  const lowerAddress = `${address}`.toLowerCase().replace("0x", "");
  const hash = bytesToHex(keccak_256(lowerAddress));
  let ret = "0x";

  for (let i = 0; i < lowerAddress.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += lowerAddress[i].toUpperCase();
    } else {
      ret += lowerAddress[i];
    }
  }
  return address === ret;
};

export const parseIntegerNumber = (number: string): number => {
  const parsed = parseInt(number);
  if (isNaN(parsed)) throw new Error("Invalid number.");
  if (parsed === Infinity) throw new Error("Invalid number.");
  return parsed;
};

const ISO8601 =
  /^(?<date>[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]))[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(.[0-9]+)?(([Zz])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))$/;

export const isValidISO8601Date = (inputDate: string): boolean => {
  const inputMatch = ISO8601.exec(inputDate);

  if (!inputMatch) {
    return false;
  }

  const inputDateParsed = new Date(inputMatch.groups.date).toISOString();
  const parsedInputMatch = ISO8601.exec(inputDateParsed);

  return inputMatch.groups.date === parsedInputMatch.groups.date;
};
