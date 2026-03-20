import { SiweMessage } from './client'
import { readFileSync } from 'fs'

const messages: object = JSON.parse(
	readFileSync('../../test/message_objects.json', 'utf8')
)

describe('Message Generation', () => {
	test.each(Object.entries(messages))('%s', (n, test: any) => {
		if (test.error === 'none') {
			expect(new SiweMessage(test.msg)).toBeDefined()
		} else {
			expect(() => new SiweMessage(test.msg)).toThrow(test.error)
		}
	})
})
