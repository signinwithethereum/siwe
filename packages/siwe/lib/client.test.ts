import { readFileSync } from 'fs'

const parsingPositive: object = JSON.parse(
	readFileSync('../../test/parsing_positive.json', 'utf8')
)
const parsingNegative: object = JSON.parse(
	readFileSync('../../test/parsing_negative.json', 'utf8')
)
const parsingNegativeObjects: object = JSON.parse(
	readFileSync('../../test/parsing_negative_objects.json', 'utf8')
)
const verificationPositive: object = JSON.parse(
	readFileSync('../../test/verification_positive.json', 'utf8')
)
const verificationNegative: object = JSON.parse(
	readFileSync('../../test/verification_negative.json', 'utf8')
)
const EIP1271: object = JSON.parse(
	readFileSync('../../test/eip1271.json', 'utf8')
)

import {
	Wallet,
} from 'ethers'
import { SiweMessage } from './client'
import { createEthersConfig, createViemConfig } from './siwe'
import { SiweErrorType } from './types'

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
		}
	)

	test.each(Object.entries(parsingNegative))(
		'Fails to generate message: %s',
		(n, test) => {
			expect(() => new SiweMessage(test)).toThrow()
		}
	)

	test.each(Object.entries(parsingNegativeObjects))(
		'Fails to generate message: %s',
		(n, test) => {
			expect(() => new SiweMessage(test as any)).toThrow()
		}
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
						domain: (test_fields as any).domainBinding,
						nonce: (test_fields as any).matchNonce,
					})
					.then(({ success }) => success)
			).resolves.toBeTruthy()
		}
	)

	test.each(
		verificationNegativeEntries.filter(
			([n]) => !constructorInvalidVerificationCases.has(n)
		)
	)(
		'Fails to verify message: %s and rejects the promise',
		async (n, test_fields: any) => {
			const msg = new SiweMessage(test_fields)
			await expect(
				msg.verify({
					signature: test_fields.signature,
					time: test_fields.time || test_fields.issuedAt,
					scheme: test_fields.scheme,
					domain: test_fields.domainBinding,
					nonce: test_fields.matchNonce,
				})
			).rejects.toMatchObject({ success: false })
		}
	)

	test.each(
		verificationNegativeEntries.filter(([n]) =>
			constructorInvalidVerificationCases.has(n)
		)
	)(
		'Rejects invalid message fixture before verification: %s',
		(n, test_fields: any) => {
			expect(() => new SiweMessage(test_fields)).toThrow()
		}
	)
})

describe(`Message verification with suppressExceptions`, () => {
	test.each(
		verificationNegativeEntries.filter(
			([n]) => !constructorInvalidVerificationCases.has(n)
		)
	)(
		'Fails to verify message: %s but still resolves the promise',
		async (n, test_fields: any) => {
			const msg = new SiweMessage(test_fields)
			const result = await msg.verify(
				{
					signature: test_fields.signature,
					time: test_fields.time || test_fields.issuedAt,
					scheme: test_fields.scheme,
					domain: test_fields.domainBinding,
					nonce: test_fields.matchNonce,
				},
				{ suppressExceptions: true }
			)
			expect(result.success).toBe(false)
		}
	)

	test.each(
		verificationNegativeEntries.filter(([n]) =>
			constructorInvalidVerificationCases.has(n)
		)
	)(
		'Constructor still rejects invalid message fixture with suppressExceptions: %s',
		(n, test_fields: any) => {
			expect(() => new SiweMessage(test_fields)).toThrow()
		}
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
				msg.verify({ signature }).then(({ success }) => success)
			).resolves.toBeTruthy()
		}
	)
})

describe(`EIP1271`, () => {
	test.each(Object.entries(EIP1271))(
		'Verifies message successfully: %s',
		async (_, test_fields: any) => {
			const msg = new SiweMessage(test_fields.message)
			const config = {
				verifyMessage: async () =>
					'0x0000000000000000000000000000000000000000',
				hashMessage: () => '0x00',
				getAddress: (address: string) => address,
				checkContractWalletSignature: async (
					address: string,
					message: string,
					signature: string,
					chainId: number
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
						},
						{
							config,
						}
					)
					.then(({ success }) => success)
			).resolves.toBeTruthy()
		}
	)
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
				'0xdc35c7f8ba2720df052e0092556456127f00f7707eaa8e3bbff7e56774e7f2e05a093cfc9e02964c33d86e8e066e221b7d153d27e5a2e97ccd5ca7d3f2ce06cb1b'
			)
		}).toThrow())

	test('Should not throw if params are valid.', async () => {
		const wallet = Wallet.createRandom()
		const msg = new SiweMessage({
			address: wallet.address,
			domain: 'siwe.xyz',
			statement: 'Sign In with Ethereum Example Statement',
			uri: 'https://siwe.xyz',
			version: '1',
			nonce: 'bTyXgcQxn2htgkjJn',
			issuedAt: '2022-01-27T17:09:38.578Z',
			chainId: 1,
			expirationTime: '2100-01-07T14:31:43.952Z',
		})
		const signature = await wallet.signMessage(msg.toMessage())
		const result = await (msg as any).verify({ signature })
		expect(result.success).toBeTruthy()
	})

	test('Should throw if params are invalid.', async () => {
		const wallet = Wallet.createRandom()
		const msg = new SiweMessage({
			address: wallet.address,
			domain: 'siwe.xyz',
			statement: 'Sign In with Ethereum Example Statement',
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
				invalidKey: 'should throw',
			})
		} catch (e) {
			expect(e.success).toBeFalsy()
			expect(e.error).toEqual(
				new Error(
					'invalidKey is/are not valid key(s) for VerifyParams.'
				)
			)
		}
	})

	test('Should throw if opts are invalid.', async () => {
		const wallet = Wallet.createRandom()
		const msg = new SiweMessage({
			address: wallet.address,
			domain: 'siwe.xyz',
			statement: 'Sign In with Ethereum Example Statement',
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
				{ signature },
				{ suppressExceptions: true, invalidKey: 'should throw' }
			)
		} catch (e) {
			expect(e.success).toBeFalsy()
			expect(e.error).toEqual(
				new Error('invalidKey is/are not valid key(s) for VerifyOpts.')
			)
		}
	})
})

describe('Error type specificity', () => {
	test('verify accepts matching uri, chainId, and requestId bindings', async () => {
		const wallet = Wallet.createRandom()
		const msg = new SiweMessage({
			address: wallet.address,
			domain: 'siwe.xyz',
			statement: 'Sign In with Ethereum Example Statement',
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
			time: msg.issuedAt,
			uri: msg.uri,
			chainId: msg.chainId,
			requestId: msg.requestId,
		})
		expect(result.success).toBe(true)
	})

	test.each([
		['address', { domain: 'siwe.xyz' }],
		[
			'uri',
			{
				domain: 'siwe.xyz',
				address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
			},
		],
		[
			'version',
			{
				domain: 'siwe.xyz',
				address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
				uri: 'https://siwe.xyz',
			},
		],
		[
			'chainId',
			{
				domain: 'siwe.xyz',
				address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
				uri: 'https://siwe.xyz',
				version: '1',
			},
		],
		[
			'nonce',
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
			{
				domain: 'siwe.xyz',
				address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
				uri: 'https://siwe.xyz',
				version: '1',
				chainId: 1,
				nonce: 'bTyXgcQxn2htgkjJn',
			},
		],
	])('constructor requires %s on object input', (field, partialMessage) => {
		expect(() => new SiweMessage(partialMessage as any)).toThrow(
			`${field} is required`
		)
	})

	test('expired message returns EXPIRED_MESSAGE', async () => {
		const fields = (verificationNegative as any)['expired message']
		const msg = new SiweMessage(fields)
		try {
			await msg.verify({
				signature: fields.signature,
				time: fields.time || fields.issuedAt,
			})
			expect.unreachable('should have rejected')
		} catch (e: any) {
			expect(e.error.type).toBe(SiweErrorType.EXPIRED_MESSAGE)
		}
	})

	test('not yet valid returns NOT_YET_VALID_MESSAGE', async () => {
		const fields = (verificationNegative as any)['not yet valid']
		const msg = new SiweMessage(fields)
		try {
			await msg.verify({
				signature: fields.signature,
				time: fields.time || fields.issuedAt,
			})
			expect.unreachable('should have rejected')
		} catch (e: any) {
			expect(e.error.type).toBe(SiweErrorType.NOT_YET_VALID_MESSAGE)
		}
	})

	test('domain mismatch returns DOMAIN_MISMATCH', async () => {
		const fields = (verificationNegative as any)['domain binding']
		const msg = new SiweMessage(fields)
		try {
			await msg.verify({
				signature: fields.signature,
				time: fields.time || fields.issuedAt,
				domain: fields.domainBinding,
			})
			expect.unreachable('should have rejected')
		} catch (e: any) {
			expect(e.error.type).toBe(SiweErrorType.DOMAIN_MISMATCH)
		}
	})

	test('uri mismatch returns URI_MISMATCH', async () => {
		const fields = (verificationPositive as any)['example message']
		const msg = new SiweMessage(fields)
		try {
			await msg.verify({
				signature: fields.signature,
				time: fields.issuedAt,
				uri: 'https://example.com/not-the-same',
			})
			expect.unreachable('should have rejected')
		} catch (e: any) {
			expect(e.error.type).toBe(SiweErrorType.URI_MISMATCH)
		}
	})

	test('chainId mismatch returns CHAIN_ID_MISMATCH', async () => {
		const fields = (verificationPositive as any)['example message']
		const msg = new SiweMessage(fields)
		try {
			await msg.verify({
				signature: fields.signature,
				time: fields.issuedAt,
				chainId: fields.chainId + 1,
			})
			expect.unreachable('should have rejected')
		} catch (e: any) {
			expect(e.error.type).toBe(SiweErrorType.CHAIN_ID_MISMATCH)
		}
	})

	test('requestId mismatch returns REQUEST_ID_MISMATCH', async () => {
		const wallet = Wallet.createRandom()
		const msg = new SiweMessage({
			address: wallet.address,
			domain: 'siwe.xyz',
			statement: 'Sign In with Ethereum Example Statement',
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
				requestId: 'different-request-id',
				time: msg.issuedAt,
			})
			expect.unreachable('should have rejected')
		} catch (e: any) {
			expect(e.error.type).toBe(SiweErrorType.REQUEST_ID_MISMATCH)
		}
	})

	test('requestId mismatch returns REQUEST_ID_MISMATCH when message has no requestId', async () => {
		const fields = (verificationPositive as any)['example message']
		const msg = new SiweMessage(fields)
		try {
			await msg.verify({
				signature: fields.signature,
				time: fields.issuedAt,
				requestId: 'unexpected-request-id',
			})
			expect.unreachable('should have rejected')
		} catch (e: any) {
			expect(e.error.type).toBe(SiweErrorType.REQUEST_ID_MISMATCH)
		}
	})

	test('nonce mismatch returns NONCE_MISMATCH', async () => {
		const fields = (verificationNegative as any)['custom nonce']
		const msg = new SiweMessage(fields)
		try {
			await msg.verify({
				signature: fields.signature,
				time: fields.time || fields.issuedAt,
				nonce: fields.matchNonce,
			})
			expect.unreachable('should have rejected')
		} catch (e: any) {
			expect(e.error.type).toBe(SiweErrorType.NONCE_MISMATCH)
		}
	})

	test('wrong signature returns INVALID_SIGNATURE', async () => {
		const fields = (verificationNegative as any)['wrong signature']
		const msg = new SiweMessage(fields)
		try {
			await msg.verify({
				signature: fields.signature,
				time: fields.time || fields.issuedAt,
			})
			expect.unreachable('should have rejected')
		} catch (e: any) {
			expect(e.error.type).toBe(SiweErrorType.INVALID_SIGNATURE)
		}
	})

	test('chainId mismatch returns CHAIN_ID_MISMATCH for zero', async () => {
		const fields = (verificationPositive as any)['example message']
		const msg = new SiweMessage(fields)
		try {
			await msg.verify({
				signature: fields.signature,
				time: fields.issuedAt,
				chainId: 0,
			})
			expect.unreachable('should have rejected')
		} catch (e: any) {
			expect(e.error.type).toBe(SiweErrorType.CHAIN_ID_MISMATCH)
		}
	})

	test('EIP1271 rejects provider chain mismatch', async () => {
		const testFields = (EIP1271 as any).argent
		const msg = new SiweMessage(testFields.message)
		const config = createEthersConfig({
			getNetwork: async () => ({ chainId: 5 }),
		})
		const result = await msg.verify(
			{ signature: testFields.signature },
			{ config, suppressExceptions: true }
		)
		expect(result.success).toBe(false)
		expect((result.error as any).type).toBe(
			SiweErrorType.INVALID_SIGNATURE_CHAIN_ID
		)
	})

	test('EIP1271 rejects provider without getNetwork support', async () => {
		const testFields = (EIP1271 as any).argent
		const msg = new SiweMessage(testFields.message)
		const config = createEthersConfig({})
		const result = await msg.verify(
			{ signature: testFields.signature },
			{
				config,
				suppressExceptions: true,
			}
		)
		expect(result.success).toBe(false)
		expect((result.error as any).type).toBe(
			SiweErrorType.INVALID_SIGNATURE_CHAIN_ID
		)
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
			{ signature: testFields.signature },
			{
				config,
				suppressExceptions: true,
			}
		)
		expect(result.success).toBe(false)
		expect((result.error as any).type).toBe(
			SiweErrorType.INVALID_SIGNATURE_CHAIN_ID
		)
	})
})
