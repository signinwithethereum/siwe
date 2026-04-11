import { SiweMessage } from './client'
import messages from '../../../test-vectors/vectors/objects/message_objects.json'

describe('Message Generation', () => {
  test.each(Object.entries(messages))('%s', (n, test: any) => {
    if (test.error === 'none') {
      expect(new SiweMessage(test.msg)).toBeDefined()
    } else {
      expect(() => new SiweMessage(test.msg)).toThrow(test.error)
    }
  })
})
