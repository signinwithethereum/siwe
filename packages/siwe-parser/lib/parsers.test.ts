import { ParsedMessage } from './parsers'
import parsingPositive from '../../../test-vectors/vectors/parsing/parsing_positive.json'
import parsingNegative from '../../../test-vectors/vectors/parsing/parsing_negative.json'
import parsingWarnings from '../../../test-vectors/vectors/parsing/parsing_warnings.json'

function expectFieldsMatch(
  actual: Record<string, any>,
  expected: Record<string, any>,
) {
  for (const [field, value] of Object.entries(expected)) {
    if (value === null) {
      expect(actual[field]).toBeUndefined()
    } else if (typeof value === 'object') {
      expect(actual[field]).toStrictEqual(value)
    } else {
      expect(actual[field]).toBe(value)
    }
  }
}

//
describe('Successfully parses with ABNF Client', () => {
  test.concurrent.each(Object.entries(parsingPositive))(
    'Parses message successfully: %s',
    (test_name, test) => {
      const parsedMessage = new ParsedMessage(test.message)
      expectFieldsMatch(parsedMessage, test.fields)
      expect(parsedMessage.warnings).toEqual([])
    },
  )
})

describe('Parses with warnings', () => {
  test.concurrent.each(Object.entries(parsingWarnings))(
    'Parses message with warnings: %s',
    (test_name, test) => {
      const parsedMessage = new ParsedMessage(test.message)
      expectFieldsMatch(parsedMessage, test.fields)
      expect(parsedMessage.warnings).toHaveLength(test.expectedWarnings)
    },
  )
})

describe('Successfully fails with ABNF Client', () => {
  test.concurrent.each(Object.entries(parsingNegative))(
    'Fails to parse message: %s',
    (test_name, test) => {
      expect(() => new ParsedMessage(test)).toThrow()
    },
  )
})
