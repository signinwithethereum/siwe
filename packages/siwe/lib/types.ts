import type { SiweConfig } from './config';
import { SiweMessage } from './client';

export interface VerifyParams {
  /** Signature of the message signed by the wallet */
  signature: string;

  /** RFC 3986 URI scheme for the authority that is requesting the signing. */
  scheme?: string;

  /** RFC 4501 dns authority that is requesting the signing. Required for origin binding. */
  domain: string;

  /** Randomized token used to prevent replay attacks, at least 8 alphanumeric characters. Required for replay resistance. */
  nonce: string;

  /** RFC 3986 URI referring to the resource that is the subject of the signing. */
  uri?: string;

  /** EIP-155 Chain ID to which the session is bound. */
  chainId?: number;

  /** System-specific identifier referring to the sign-in request. */
  requestId?: string;

  /**ISO 8601 datetime string of the current time. */
  time?: string;
}

export const VerifyParamsKeys: (keyof VerifyParams)[] = [
  'signature',
  'scheme',
  'domain',
  'nonce',
  'uri',
  'chainId',
  'requestId',
  'time',
];

export interface VerifyOpts {
  /**
   * @deprecated Use `config` with a SiweConfig that includes EIP-1271 support instead.
   * ethers provider for EIP-1271 validation.
   */
  provider?: any;

  /**
   * Verification config providing crypto functions.
   * If not set, falls back to the global config (set via `configure()`),
   * then auto-detects ethers if installed.
   */
  config?: SiweConfig;

  /** If the library should reject promises on errors, defaults to false */
  suppressExceptions?: boolean;

  /** Enables a custom verification function that will be ran alongside EIP-1271 check. */
  verificationFallback?: (
    params: VerifyParams,
    opts: VerifyOpts,
    message: SiweMessage,
    EIP1271Promise: Promise<SiweResponse>
  ) => Promise<SiweResponse>;

  /**
   * When true, requires uri and chainId in addition to the always-required
   * domain and nonce. Use this to enforce full contextual binding.
   */
  strict?: boolean;
}

export const VerifyOptsKeys: (keyof VerifyOpts)[] = [
  'provider',
  'config',
  'suppressExceptions',
  'verificationFallback',
  'strict',
];

/**
 * Returned on verifications.
 */
export interface SiweResponse {
  /** Boolean representing if the message was verified with success. */
  success: boolean;

  /** If present `success` MUST be false and will provide extra information on the failure reason. */
  error?: SiweError | Error;

  /** Original message that was verified. */
  data: SiweMessage;
}

/**
 * Interface used to return errors in SiweResponses.
 */
export class SiweError {
  constructor(
    type: SiweErrorType | string,
    expected?: string,
    received?: string
  ) {
    this.type = type;
    this.expected = expected;
    this.received = received;
  }

  /** Type of the error. */
  type: SiweErrorType | string;

  /** Expected value or condition to pass. */
  expected?: string;

  /** Received value that caused the failure. */
  received?: string;
}

/**
 * Possible message error types.
 */
export enum SiweErrorType {
  /** `expirationTime` is present and in the past. */
  EXPIRED_MESSAGE = 'Expired message.',

  /** `domain` is not a valid authority or is empty. */
  INVALID_DOMAIN = 'Invalid domain.',

  /** `scheme` don't match the scheme provided for verification. */
  SCHEME_MISMATCH = 'Scheme does not match provided scheme for verification.',

  /** `domain` don't match the domain provided for verification. */
  DOMAIN_MISMATCH = 'Domain does not match provided domain for verification.',

  /** `nonce` don't match the nonce provided for verification. */
  NONCE_MISMATCH = 'Nonce does not match provided nonce for verification.',

  /** `uri` does not match the URI provided for verification. */
  URI_MISMATCH = 'URI does not match provided URI for verification.',

  /** `chainId` does not match the chain ID provided for verification. */
  CHAIN_ID_MISMATCH = 'Chain ID does not match provided chain ID for verification.',

  /** `requestId` does not match the request ID provided for verification. */
  REQUEST_ID_MISMATCH = 'Request ID does not match provided request ID for verification.',

  /** `address` does not conform to EIP-55 or is not a valid address. */
  INVALID_ADDRESS = 'Invalid address.',

  /** `uri` does not conform to RFC 3986. */
  INVALID_URI = 'URI does not conform to RFC 3986.',

  /** `nonce` is smaller then 8 characters or is not alphanumeric */
  INVALID_NONCE = 'Nonce size smaller then 8 characters or is not alphanumeric.',

  /** `notBefore` is present and in the future. */
  NOT_YET_VALID_MESSAGE = 'Message is not valid yet.',

  /** Signature doesn't match the address of the message. */
  INVALID_SIGNATURE = 'Signature does not match address of the message.',

  /** EIP-1271 verification was attempted with a provider/client on the wrong chain. */
  INVALID_SIGNATURE_CHAIN_ID = 'Contract wallet verification provider chain does not match message chain ID.',

  /** `expirationTime`, `notBefore` or `issuedAt` not compliant to ISO-8601. */
  INVALID_TIME_FORMAT = 'Invalid time format.',

  /** `version` is not 1. */
  INVALID_MESSAGE_VERSION = 'Invalid message version.',

  /** Thrown when some required field is missing. */
  UNABLE_TO_PARSE = 'Unable to parse the message.',

  /** `domain` was not provided for verification. */
  MISSING_DOMAIN = 'Domain is required for verification.',

  /** `nonce` was not provided for verification. */
  MISSING_NONCE = 'Nonce is required for verification.',

  /** `uri` was not provided in strict mode. */
  MISSING_URI = 'URI is required in strict mode.',

  /** `chainId` was not provided in strict mode. */
  MISSING_CHAIN_ID = 'Chain ID is required in strict mode.',
}
