import { umlclassParseMethod, umlclassParseMember } from '../../generators/umlclass.js'
import { expect, test } from '@jest/globals'

// TODO: Convert to TypeScript

// Basically [+-#][name(...):]RETURNTYPE
const /** @type { input: string, expect: RegexMatchedClassMethodsT][]} */ methodTests = [
  { input: 'justname()', expect: { visibility: '', name: 'justname', parameters: '()', return: '' } },
  { input: '-justname()', expect: { visibility: '-', name: 'justname', parameters: '()', return: '' } },
  { input: '+justname(key:int):string', expect: { visibility: '+', name: 'justname', parameters: '(key:int)', return: 'string' } },
  { input: '#justname(key:int,a,b):string', expect: { visibility: '#', name: 'justname', parameters: '(key:int,a,b)', return: 'string' } }
]

// members have visibility, name, type, default
// Basically [+-#][name:]String[=defaultValue]
const /** @type { input: string, expect: RegexMatchedClassMembersT][]} */ memberTests = [
  { input: 'justname', expect: { visibility: '', name: '', type: 'justname', default: '' } },
  { input: '+boolean', expect: { visibility: '+', name: '', type: 'boolean', default: '' } },
  { input: '#boolean=false', expect: { visibility: '#', name: '', type: 'boolean', default: 'false' } },
  { input: '+justname:List<string>', expect: { visibility: '+', name: 'justname', type: 'List<string>', default: '' } },
  { input: '-just_name:List<string>=[]', expect: { visibility: '-', name: 'just_name', type: 'List<string>', default: '[]' } }
]

methodTests.forEach((m) => {
  test(`Parse method: ${m.input}`, () => {
    const parseResults = umlclassParseMethod(m.input)
    expect(parseResults).toEqual(m.expect)
  })
})

memberTests.forEach((m) => {
  test('Parse member: justname', () => {
    const parseResults = umlclassParseMember(m.input)
    expect(parseResults).toEqual(m.expect)
  })
})
