import { SiweMessage } from './client'
import messages from '../../../test-vectors/vectors/objects/message_objects.json'

describe('Message Generation', () => {
  test.each(Object.entries(messages))('%s', (n, test: any) => {
    if (test.error === 'none') {
      const msg = new SiweMessage(test.msg)
      expect(msg).toBeDefined()
      expect(msg.warnings).toHaveLength(test.expectedWarnings ?? 0)
    } else {
      expect(() => new SiweMessage(test.msg)).toThrow(test.error)
    }
  })
})
