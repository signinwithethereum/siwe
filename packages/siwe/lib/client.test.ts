import parsingPositive from '../../../test-vectors/vectors/parsing/parsing_positive.json'
import parsingNegative from '../../../test-vectors/vectors/parsing/parsing_negative.json'
import parsingNegativeObjects from '../../../test-vectors/vectors/objects/parsing_negative_objects.json'
import verificationPositive from '../../../test-vectors/vectors/verification/verification_positive.json'
import verificationNegative from '../../../test-vectors/vectors/verification/verification_negative.json'
import EIP1271 from '../../../test-vectors/vectors/verification/eip1271.json'
import { Wallet } from 'ethers'
import { SiweMessage } from './client'
import { createEthersConfig, createViemConfig } from './siwe'
import { SiweError, SiweErrorType } from './types'

const verificationNegativeEntries = Object.entries(verificationNegative)
const constructorInvalidVerificationCases = new Set([
  'invalid issuedAt',
  'invalid notBefore',
  'invalid expirationTime',
])

describe(`Message Generation`, () => {
  test.each(Object.entries(parsingPositive))(
    'Generates message successfully: %s',
    (_, test: any) => {
      const msg = new SiweMessage(test.fields)
      expect(msg.toMessage()).toBe(test.message)
    },
  )

  test.each(Object.entries(parsingNegative))(
    'Fails to generate message: %s',
    (n, test) => {
      expect(() => new SiweMessage(test)).toThrow()
    },
  )

  test.each(Object.entries(parsingNegativeObjects))(
    'Fails to generate message: %s',
    (n, test) => {
      expect(() => new SiweMessage(test as any)).toThrow()
    },
  )
})

describe(`Message verification without suppressExceptions`, () => {
  test.each(Object.entries(verificationPositive))(
    'Verifies message successfully: %s',
    async (_, test_fields: any) => {
      const msg = new SiweMessage(test_fields)
      await expect(
        msg
          .verify({
            signature: test_fields.signature,
            time: (test_fields as any).time || test_fields.issuedAt,
            scheme: (test_fields as any).scheme,
            domain: (test_fields as any).domainBinding ?? test_fields.domain,
            nonce: (test_fields as any).matchNonce ?? test_fields.nonce,
          })
          .then(({ success }) => success),
      ).resolves.toBeTruthy()
    },
  )

  test.each(
    verificationNegativeEntries.filter(
      ([n]) => !constructorInvalidVerificationCases.has(n),
    ),
  )(
    'Fails to verify message: %s and rejects the promise',
    async (n, test_fields: any) => {
      const msg = new SiweMessage(test_fields)
      await expect(
        msg.verify({
          signature: test_fields.signature,
          time: test_fields.time || test_fields.issuedAt,
          scheme: test_fields.scheme,
          domain: test_fields.domainBinding ?? test_fields.domain,
          nonce: test_fields.matchNonce ?? test_fields.nonce,
        }),
      ).rejects.toBeInstanceOf(SiweError)
    },
  )

  test.each(
    verificationNegativeEntries.filter(([n]) =>
      constructorInvalidVerificationCases.has(n),
    ),
  )(
    'Rejects invalid message fixture before verification: %s',
    (n, test_fields: any) => {
      expect(() => new SiweMessage(test_fields)).toThrow()
    },
  )
})

describe(`Message verification with suppressExceptions`, () => {
  test.each(
    verificationNegativeEntries.filter(
      ([n]) => !constructorInvalidVerificationCases.has(n),
    ),
  )(
    'Fails to verify message: %s but still resolves the promise',
    async (n, test_fields: any) => {
      const msg = new SiweMessage(test_fields)
      const result = await msg.verify(
        {
          signature: test_fields.signature,
          time: test_fields.time || test_fields.issuedAt,
          scheme: test_fields.scheme,
          domain: test_fields.domainBinding ?? test_fields.domain,
          nonce: test_fields.matchNonce ?? test_fields.nonce,
        },
        { suppressExceptions: true },
      )
      expect(result.success).toBe(false)
    },
  )

  test.each(
    verificationNegativeEntries.filter(([n]) =>
      constructorInvalidVerificationCases.has(n),
    ),
  )(
    'Constructor still rejects invalid message fixture with suppressExceptions: %s',
    (n, test_fields: any) => {
      expect(() => new SiweMessage(test_fields)).toThrow()
    },
  )
})

describe(`Round Trip`, () => {
  const wallet = Wallet.createRandom()
  test.each(Object.entries(parsingPositive))(
    'Generates a Successfully Verifying message: %s',
    async (_, test: any) => {
      const msg = new SiweMessage(test.fields)
      msg.address = wallet.address
      const signature = await wallet.signMessage(msg.toMessage())
      await expect(
        msg
          .verify({ signature, domain: msg.domain, nonce: msg.nonce })
          .then(({ success }) => success),
      ).resolves.toBeTruthy()
    },
  )
})

describe(`EIP1271`, () => {
  test.each(Object.entries(EIP1271))(
    'Verifies message successfully: %s',
    async (_, test_fields: any) => {
      const msg = new SiweMessage(test_fields.message)
      const config = {
        verifyMessage: async () => '0x0000000000000000000000000000000000000000',
        hashMessage: () => '0x00',
        getAddress: (address: string) => address,
        checkContractWalletSignature: async (
          address: string,
          message: string,
          signature: string,
          chainId: number,
        ) =>
          address === msg.address &&
          message === msg.prepareMessage() &&
          signature === test_fields.signature &&
          chainId === msg.chainId,
      }
      await expect(
        msg
          .verify(
            {
              signature: test_fields.signature,
              domain: msg.domain,
              nonce: msg.nonce,
            },
            {
              config,
            },
          )
          .then(({ success }) => success),
      ).resolves.toBeTruthy()
    },
  )
})

describe('Address case handling', () => {
  const CHECKSUMMED = '0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946'
  const LOWERCASE = '0xe5a12547fe4e872d192e3ececb76f2ce1aea4946'
  const UPPERCASE = '0xE5A12547FE4E872D192E3ECECB76F2CE1AEA4946'
  const WRONG_MIXED = '0xe5a12547fe4E872D192E3eCecb76F2Ce1aeA4946'

  const buildString = (address: string) =>
    `service.org wants you to sign in with your Ethereum account:\n${address}\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z`

  const baseFields = {
    domain: 'service.org',
    statement:
      'I accept the ServiceOrg Terms of Service: https://service.org/tos',
    uri: 'https://service.org/login',
    version: '1',
    chainId: 1,
    nonce: '12341234',
    issuedAt: '2022-03-17T12:45:13.610Z',
  }

  describe('construction from string (address preserved verbatim)', () => {
    test('checksummed → no warnings', () => {
      const msg = new SiweMessage(buildString(CHECKSUMMED))
      expect(msg.warnings).toEqual([])
      expect(msg.address).toBe(CHECKSUMMED)
    })

    test('all-lowercase → 1 warning, preserved', () => {
      const msg = new SiweMessage(buildString(LOWERCASE))
      expect(msg.warnings).toHaveLength(1)
      expect(msg.address).toBe(LOWERCASE)
    })

    test('all-uppercase → 1 warning, preserved', () => {
      const msg = new SiweMessage(buildString(UPPERCASE))
      expect(msg.warnings).toHaveLength(1)
      expect(msg.address).toBe(UPPERCASE)
    })

    test('mixed-case wrong checksum → throws', () => {
      expect(() => new SiweMessage(buildString(WRONG_MIXED))).toThrow(
        'invalid EIP-55 address',
      )
    })
  })

  describe('construction from object (normalized to EIP-55)', () => {
    test('checksummed → no warnings, preserved', () => {
      const msg = new SiweMessage({ ...baseFields, address: CHECKSUMMED })
      expect(msg.warnings).toEqual([])
      expect(msg.address).toBe(CHECKSUMMED)
    })

    test('all-lowercase → 1 warning, normalized to checksummed', () => {
      const msg = new SiweMessage({ ...baseFields, address: LOWERCASE })
      expect(msg.warnings).toHaveLength(1)
      expect(msg.address).toBe(CHECKSUMMED)
    })

    test('all-uppercase → 1 warning, normalized to checksummed', () => {
      const msg = new SiweMessage({ ...baseFields, address: UPPERCASE })
      expect(msg.warnings).toHaveLength(1)
      expect(msg.address).toBe(CHECKSUMMED)
    })

    test('mixed-case wrong checksum → throws', () => {
      expect(
        () => new SiweMessage({ ...baseFields, address: WRONG_MIXED }),
      ).toThrow('invalid EIP-55 address')
    })
  })

  describe('verification round-trip across address casings', () => {
    const transforms: Array<[string, (addr: string) => string]> = [
      ['checksummed', (a) => a],
      ['all-lowercase', (a) => a.toLowerCase()],
      ['all-uppercase', (a) => '0x' + a.slice(2).toUpperCase()],
    ]

    test.each(transforms)(
      'string path: wallet signs %s address → parse + verify succeeds',
      async (_, transform) => {
        const wallet = Wallet.createRandom()
        const address = transform(wallet.address)
        const signedString = buildString(address)
        const signature = await wallet.signMessage(signedString)

        const parsed = new SiweMessage(signedString)
        expect(parsed.address).toBe(address)

        const { success } = await parsed.verify({
          signature,
          domain: parsed.domain,
          nonce: parsed.nonce,
        })
        expect(success).toBe(true)
      },
    )

    test.each(transforms)(
      'object path: construct with %s address → sign toMessage() → verify succeeds',
      async (_, transform) => {
        const wallet = Wallet.createRandom()
        const msg = new SiweMessage({
          ...baseFields,
          address: transform(wallet.address),
        })
        const signature = await wallet.signMessage(msg.toMessage())

        const { success } = await msg.verify({
          signature,
          domain: msg.domain,
          nonce: msg.nonce,
        })
        expect(success).toBe(true)
      },
    )
  })
})

describe(`Unit`, () => {
  test('Should throw if validateMessage is called with arguments', () =>
    expect(() => {
      const msg = new SiweMessage({
        domain: 'service.org',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        statement:
          'I accept the ServiceOrg Terms of Service: https://service.org/tos',
        uri: 'https://service.org/login',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
        resources: [
          'ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu',
          'https://example.com/my-web2-claim.json',
        ],
      })
      ;(msg as any).validateMessage(
        '0xdc35c7f8ba2720df052e0092556456127f00f7707eaa8e3bbff7e56774e7f2e05a093cfc9e02964c33d86e8e066e221b7d153d27e5a2e97ccd5ca7d3f2ce06cb1b',
      )
    }).toThrow())

  test('Should not throw if params are valid.', async () => {
    const wallet = Wallet.createRandom()
    const msg = new SiweMessage({
      address: wallet.address,
      domain: 'siwe.xyz',
      statement: 'Sign in with Ethereum Example Statement',
      uri: 'https://siwe.xyz',
      version: '1',
      nonce: 'bTyXgcQxn2htgkjJn',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
      expirationTime: '2100-01-07T14:31:43.952Z',
    })
    const signature = await wallet.signMessage(msg.toMessage())
    const result = await (msg as any).verify({
      signature,
      domain: msg.domain,
      nonce: msg.nonce,
    })
    expect(result.success).toBeTruthy()
  })

  test('Should throw if params are invalid.', async () => {
    const wallet = Wallet.createRandom()
    const msg = new SiweMessage({
      address: wallet.address,
      domain: 'siwe.xyz',
      statement: 'Sign in with Ethereum Example Statement',
      uri: 'https://siwe.xyz',
      version: '1',
      nonce: 'bTyXgcQxn2htgkjJn',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
      expirationTime: '2100-01-07T14:31:43.952Z',
    })
    const signature = await wallet.signMessage(msg.toMessage())
    try {
      await (msg as any).verify({
        signature,
        domain: msg.domain,
        nonce: msg.nonce,
        invalidKey: 'should throw',
      })
    } catch (e: any) {
      expect(e).toBeInstanceOf(SiweError)
      expect(e.type).toBe(SiweErrorType.INVALID_PARAMS)
    }
  })

  test('Should throw if opts are invalid.', async () => {
    const wallet = Wallet.createRandom()
    const msg = new SiweMessage({
      address: wallet.address,
      domain: 'siwe.xyz',
      statement: 'Sign in with Ethereum Example Statement',
      uri: 'https://siwe.xyz',
      version: '1',
      nonce: 'bTyXgcQxn2htgkjJn',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
      expirationTime: '2100-01-07T14:31:43.952Z',
    })
    const signature = await wallet.signMessage(msg.toMessage())
    try {
      await (msg as any).verify(
        { signature, domain: msg.domain, nonce: msg.nonce },
        { suppressExceptions: true, invalidKey: 'should throw' },
      )
    } catch (e: any) {
      expect(e).toBeInstanceOf(SiweError)
      expect(e.type).toBe(SiweErrorType.INVALID_PARAMS)
    }
  })
})

describe('Error type specificity', () => {
  test('verify accepts matching uri, chainId, and requestId bindings', async () => {
    const wallet = Wallet.createRandom()
    const msg = new SiweMessage({
      address: wallet.address,
      domain: 'siwe.xyz',
      statement: 'Sign in with Ethereum Example Statement',
      uri: 'https://siwe.xyz/login',
      version: '1',
      nonce: 'bTyXgcQxn2htgkjJn',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
      requestId: 'expected-request-id',
      expirationTime: '2100-01-07T14:31:43.952Z',
    })
    const signature = await wallet.signMessage(msg.toMessage())
    const result = await msg.verify({
      signature,
      domain: msg.domain,
      nonce: msg.nonce,
      time: msg.issuedAt,
      uri: msg.uri,
      chainId: msg.chainId,
      requestId: msg.requestId,
    })
    expect(result.success).toBe(true)
  })

  test.each([
    ['address', SiweErrorType.INVALID_ADDRESS, { domain: 'siwe.xyz' }],
    [
      'uri',
      SiweErrorType.INVALID_URI,
      {
        domain: 'siwe.xyz',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      },
    ],
    [
      'version',
      SiweErrorType.INVALID_MESSAGE_VERSION,
      {
        domain: 'siwe.xyz',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        uri: 'https://siwe.xyz',
      },
    ],
    [
      'chainId',
      SiweErrorType.UNABLE_TO_PARSE,
      {
        domain: 'siwe.xyz',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        uri: 'https://siwe.xyz',
        version: '1',
      },
    ],
    [
      'nonce',
      SiweErrorType.INVALID_NONCE,
      {
        domain: 'siwe.xyz',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        uri: 'https://siwe.xyz',
        version: '1',
        chainId: 1,
      },
    ],
    [
      'issuedAt',
      SiweErrorType.UNABLE_TO_PARSE,
      {
        domain: 'siwe.xyz',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        uri: 'https://siwe.xyz',
        version: '1',
        chainId: 1,
        nonce: 'bTyXgcQxn2htgkjJn',
      },
    ],
  ])(
    'constructor requires %s on object input',
    (field, errorType, partialMessage) => {
      try {
        new SiweMessage(partialMessage as any)
        expect.unreachable('should have thrown')
      } catch (e: any) {
        expect(e.type).toBe(errorType)
      }
    },
  )

  test('expired message returns EXPIRED_MESSAGE', async () => {
    const fields = (verificationNegative as any)['expired message']
    const msg = new SiweMessage(fields)
    try {
      await msg.verify({
        signature: fields.signature,
        domain: fields.domain,
        nonce: fields.nonce,
        time: fields.time || fields.issuedAt,
      })
      expect.unreachable('should have rejected')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.EXPIRED_MESSAGE)
    }
  })

  test('not yet valid returns NOT_YET_VALID_MESSAGE', async () => {
    const fields = (verificationNegative as any)['not yet valid']
    const msg = new SiweMessage(fields)
    try {
      await msg.verify({
        signature: fields.signature,
        domain: fields.domain,
        nonce: fields.nonce,
        time: fields.time || fields.issuedAt,
      })
      expect.unreachable('should have rejected')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.NOT_YET_VALID_MESSAGE)
    }
  })

  test('domain mismatch returns DOMAIN_MISMATCH', async () => {
    const fields = (verificationNegative as any)['domain binding']
    const msg = new SiweMessage(fields)
    try {
      await msg.verify({
        signature: fields.signature,
        domain: fields.domainBinding,
        nonce: fields.nonce,
        time: fields.time || fields.issuedAt,
      })
      expect.unreachable('should have rejected')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.DOMAIN_MISMATCH)
    }
  })

  test('uri mismatch returns URI_MISMATCH', async () => {
    const fields = (verificationPositive as any)['example message']
    const msg = new SiweMessage(fields)
    try {
      await msg.verify({
        signature: fields.signature,
        domain: fields.domain,
        nonce: fields.nonce,
        time: fields.issuedAt,
        uri: 'https://example.com/not-the-same',
      })
      expect.unreachable('should have rejected')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.URI_MISMATCH)
    }
  })

  test('chainId mismatch returns CHAIN_ID_MISMATCH', async () => {
    const fields = (verificationPositive as any)['example message']
    const msg = new SiweMessage(fields)
    try {
      await msg.verify({
        signature: fields.signature,
        domain: fields.domain,
        nonce: fields.nonce,
        time: fields.issuedAt,
        chainId: fields.chainId + 1,
      })
      expect.unreachable('should have rejected')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.CHAIN_ID_MISMATCH)
    }
  })

  test('requestId mismatch returns REQUEST_ID_MISMATCH', async () => {
    const wallet = Wallet.createRandom()
    const msg = new SiweMessage({
      address: wallet.address,
      domain: 'siwe.xyz',
      statement: 'Sign in with Ethereum Example Statement',
      uri: 'https://siwe.xyz',
      version: '1',
      nonce: 'bTyXgcQxn2htgkjJn',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
      requestId: 'expected-request-id',
      expirationTime: '2100-01-07T14:31:43.952Z',
    })
    const signature = await wallet.signMessage(msg.toMessage())
    try {
      await msg.verify({
        signature,
        domain: msg.domain,
        nonce: msg.nonce,
        requestId: 'different-request-id',
        time: msg.issuedAt,
      })
      expect.unreachable('should have rejected')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.REQUEST_ID_MISMATCH)
    }
  })

  test('requestId mismatch returns REQUEST_ID_MISMATCH when message has no requestId', async () => {
    const fields = (verificationPositive as any)['example message']
    const msg = new SiweMessage(fields)
    try {
      await msg.verify({
        signature: fields.signature,
        domain: fields.domain,
        nonce: fields.nonce,
        time: fields.issuedAt,
        requestId: 'unexpected-request-id',
      })
      expect.unreachable('should have rejected')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.REQUEST_ID_MISMATCH)
    }
  })

  test('nonce mismatch returns NONCE_MISMATCH', async () => {
    const fields = (verificationNegative as any)['custom nonce']
    const msg = new SiweMessage(fields)
    try {
      await msg.verify({
        signature: fields.signature,
        domain: fields.domain,
        nonce: fields.matchNonce,
        time: fields.time || fields.issuedAt,
      })
      expect.unreachable('should have rejected')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.NONCE_MISMATCH)
    }
  })

  test('wrong signature returns INVALID_SIGNATURE', async () => {
    const fields = (verificationNegative as any)['wrong signature']
    const msg = new SiweMessage(fields)
    try {
      await msg.verify({
        signature: fields.signature,
        domain: fields.domain,
        nonce: fields.nonce,
        time: fields.time || fields.issuedAt,
      })
      expect.unreachable('should have rejected')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.INVALID_SIGNATURE)
    }
  })

  test('chainId mismatch returns CHAIN_ID_MISMATCH for zero', async () => {
    const fields = (verificationPositive as any)['example message']
    const msg = new SiweMessage(fields)
    try {
      await msg.verify({
        signature: fields.signature,
        domain: fields.domain,
        nonce: fields.nonce,
        time: fields.issuedAt,
        chainId: 0,
      })
      expect.unreachable('should have rejected')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.CHAIN_ID_MISMATCH)
    }
  })

  test('EIP1271 rejects provider chain mismatch', async () => {
    const testFields = (EIP1271 as any).argent
    const msg = new SiweMessage(testFields.message)
    const config = await createEthersConfig({
      getNetwork: async () => ({ chainId: 5 }),
    })
    const result = await msg.verify(
      { signature: testFields.signature, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
    expect(result.error.type).toBe(SiweErrorType.INVALID_SIGNATURE_CHAIN_ID)
  })

  test('EIP1271 rejects provider without getNetwork support', async () => {
    const testFields = (EIP1271 as any).argent
    const msg = new SiweMessage(testFields.message)
    const config = await createEthersConfig({})
    const result = await msg.verify(
      { signature: testFields.signature, domain: msg.domain, nonce: msg.nonce },
      {
        config,
        suppressExceptions: true,
      },
    )
    expect(result.success).toBe(false)
    expect(result.error.type).toBe(SiweErrorType.INVALID_SIGNATURE_CHAIN_ID)
  })

  test('EIP1271 rejects viem client without chain.id', async () => {
    const testFields = (EIP1271 as any).argent
    const msg = new SiweMessage(testFields.message)
    const config = await createViemConfig({
      publicClient: {
        readContract: async () => '0x1626ba7e',
      },
    })
    const result = await msg.verify(
      { signature: testFields.signature, domain: msg.domain, nonce: msg.nonce },
      {
        config,
        suppressExceptions: true,
      },
    )
    expect(result.success).toBe(false)
    expect(result.error.type).toBe(SiweErrorType.INVALID_SIGNATURE_CHAIN_ID)
  })

  test('verify rejects missing domain', async () => {
    const fields = (verificationPositive as any)['example message']
    const msg = new SiweMessage(fields)
    const result = await msg.verify(
      { signature: fields.signature, nonce: fields.nonce } as any,
      { suppressExceptions: true },
    )
    expect(result.success).toBe(false)
    expect(result.error.type).toBe(SiweErrorType.MISSING_DOMAIN)
  })

  test('verify rejects missing nonce', async () => {
    const fields = (verificationPositive as any)['example message']
    const msg = new SiweMessage(fields)
    const result = await msg.verify(
      { signature: fields.signature, domain: fields.domain } as any,
      { suppressExceptions: true },
    )
    expect(result.success).toBe(false)
    expect(result.error.type).toBe(SiweErrorType.MISSING_NONCE)
  })

  test('strict mode rejects missing uri', async () => {
    const wallet = Wallet.createRandom()
    const msg = new SiweMessage({
      address: wallet.address,
      domain: 'siwe.xyz',
      statement: 'Test',
      uri: 'https://siwe.xyz',
      version: '1',
      nonce: 'bTyXgcQxn2htgkjJn',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
      expirationTime: '2100-01-07T14:31:43.952Z',
    })
    const signature = await wallet.signMessage(msg.toMessage())
    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce, chainId: msg.chainId },
      { suppressExceptions: true, strict: true },
    )
    expect(result.success).toBe(false)
    expect(result.error.type).toBe(SiweErrorType.MISSING_URI)
  })

  test('strict mode rejects missing chainId', async () => {
    const wallet = Wallet.createRandom()
    const msg = new SiweMessage({
      address: wallet.address,
      domain: 'siwe.xyz',
      statement: 'Test',
      uri: 'https://siwe.xyz',
      version: '1',
      nonce: 'bTyXgcQxn2htgkjJn',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
      expirationTime: '2100-01-07T14:31:43.952Z',
    })
    const signature = await wallet.signMessage(msg.toMessage())
    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce, uri: msg.uri },
      { suppressExceptions: true, strict: true },
    )
    expect(result.success).toBe(false)
    expect(result.error.type).toBe(SiweErrorType.MISSING_CHAIN_ID)
  })

  test('strict mode accepts all required fields', async () => {
    const wallet = Wallet.createRandom()
    const msg = new SiweMessage({
      address: wallet.address,
      domain: 'siwe.xyz',
      statement: 'Test',
      uri: 'https://siwe.xyz',
      version: '1',
      nonce: 'bTyXgcQxn2htgkjJn',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
      expirationTime: '2100-01-07T14:31:43.952Z',
    })
    const signature = await wallet.signMessage(msg.toMessage())
    const result = await msg.verify(
      {
        signature,
        domain: msg.domain,
        nonce: msg.nonce,
        uri: msg.uri,
        chainId: msg.chainId,
      },
      { strict: true },
    )
    expect(result.success).toBe(true)
  })

  test('invalid time string rejects with INVALID_TIME_FORMAT', async () => {
    const fields = (verificationPositive as any)['example message']
    const msg = new SiweMessage(fields)
    const result = await msg.verify(
      {
        signature: fields.signature,
        domain: fields.domain,
        nonce: fields.nonce,
        time: 'not-a-date',
      },
      { suppressExceptions: true },
    )
    expect(result.success).toBe(false)
    expect(result.error.type).toBe(SiweErrorType.INVALID_TIME_FORMAT)
  })

  test('scheme mismatch returns SCHEME_MISMATCH', async () => {
    const wallet = Wallet.createRandom()
    const msg = new SiweMessage({
      address: wallet.address,
      scheme: 'https',
      domain: 'siwe.xyz',
      statement: 'Test',
      uri: 'https://siwe.xyz',
      version: '1',
      nonce: 'bTyXgcQxn2htgkjJn',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
      expirationTime: '2100-01-07T14:31:43.952Z',
    })
    const signature = await wallet.signMessage(msg.toMessage())
    try {
      await msg.verify({
        signature,
        domain: msg.domain,
        nonce: msg.nonce,
        time: msg.issuedAt,
        scheme: 'http',
      })
      expect.unreachable('should have rejected')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.SCHEME_MISMATCH)
    }
  })

  test('empty requestId survives toMessage round-trip', () => {
    const msg = new SiweMessage({
      domain: 'service.org',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      statement: 'Test',
      uri: 'https://service.org/login',
      version: '1',
      chainId: 1,
      nonce: '32891757',
      issuedAt: '2021-09-30T16:25:24.000Z',
      requestId: '',
    })
    const message = msg.toMessage()
    expect(message).toContain('Request ID: ')
    const reparsed = new SiweMessage(message)
    expect(reparsed.requestId).toBe('')
  })

  test('chainId 0 can be constructed and verified', async () => {
    const wallet = Wallet.createRandom()
    const msg = new SiweMessage({
      address: wallet.address,
      domain: 'siwe.xyz',
      statement: 'Test',
      uri: 'https://siwe.xyz',
      version: '1',
      nonce: 'bTyXgcQxn2htgkjJn',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 0,
      expirationTime: '2100-01-07T14:31:43.952Z',
    })
    expect(msg.chainId).toBe(0)
    const message = msg.toMessage()
    expect(message).toContain('Chain ID: 0')
    const signature = await wallet.signMessage(message)
    const result = await msg.verify({
      signature,
      domain: msg.domain,
      nonce: msg.nonce,
      chainId: 0,
    })
    expect(result.success).toBe(true)
  })

  test('object constructor rejects statement with line break', () => {
    expect(
      () =>
        new SiweMessage({
          domain: 'service.org',
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          statement: 'line\nbreak',
          uri: 'https://service.org/login',
          version: '1',
          chainId: 1,
          nonce: '32891757',
          issuedAt: '2021-09-30T16:25:24.000Z',
        }),
    ).toThrow()
  })

  test('both expirationTime and notBefore in same verification', async () => {
    const wallet = Wallet.createRandom()
    const msg = new SiweMessage({
      address: wallet.address,
      domain: 'siwe.xyz',
      statement: 'Test',
      uri: 'https://siwe.xyz',
      version: '1',
      nonce: 'bTyXgcQxn2htgkjJn',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
      notBefore: '2022-01-27T17:09:38.578Z',
      expirationTime: '2100-01-07T14:31:43.952Z',
    })
    const signature = await wallet.signMessage(msg.toMessage())
    const result = await msg.verify({
      signature,
      domain: msg.domain,
      nonce: msg.nonce,
      time: '2023-01-01T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  test('both temporal constraints reject when expired', async () => {
    const wallet = Wallet.createRandom()
    const msg = new SiweMessage({
      address: wallet.address,
      domain: 'siwe.xyz',
      statement: 'Test',
      uri: 'https://siwe.xyz',
      version: '1',
      nonce: 'bTyXgcQxn2htgkjJn',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
      notBefore: '2022-01-27T17:09:38.578Z',
      expirationTime: '2023-01-07T14:31:43.952Z',
    })
    const signature = await wallet.signMessage(msg.toMessage())
    try {
      await msg.verify({
        signature,
        domain: msg.domain,
        nonce: msg.nonce,
        time: '2024-01-01T00:00:00.000Z',
      })
      expect.unreachable('should have rejected')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.EXPIRED_MESSAGE)
    }
  })

  test('both temporal constraints reject when not yet valid', async () => {
    const wallet = Wallet.createRandom()
    const msg = new SiweMessage({
      address: wallet.address,
      domain: 'siwe.xyz',
      statement: 'Test',
      uri: 'https://siwe.xyz',
      version: '1',
      nonce: 'bTyXgcQxn2htgkjJn',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
      notBefore: '2025-01-01T00:00:00.000Z',
      expirationTime: '2100-01-07T14:31:43.952Z',
    })
    const signature = await wallet.signMessage(msg.toMessage())
    try {
      await msg.verify({
        signature,
        domain: msg.domain,
        nonce: msg.nonce,
        time: '2024-01-01T00:00:00.000Z',
      })
      expect.unreachable('should have rejected')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.NOT_YET_VALID_MESSAGE)
    }
  })

  test('constructor throws INVALID_DOMAIN for missing domain', () => {
    try {
      new SiweMessage({
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        uri: 'https://siwe.xyz',
        version: '1',
        chainId: 1,
        nonce: 'bTyXgcQxn2htgkjJn',
        issuedAt: '2022-01-27T17:09:38.578Z',
      } as any)
      expect.unreachable('should have thrown')
    } catch (e: any) {
      expect(e.type).toBe(SiweErrorType.INVALID_DOMAIN)
    }
  })
})
