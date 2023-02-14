import { umlclassParseMethod, umlclassParseMember } from '../../generators/umlclass.js'

// methods have visibility,name, parameters, return(type)
// Basically [+-#][name(...):]RETURNTYPE
test('Parse method: justname()', () => {
  const method = 'justname()'
  const parseResults = umlclassParseMethod(method)
  expect(parseResults.groups.visibility).toBe('')
  expect(parseResults.groups.name).toBe('justname')
  expect(parseResults.groups.parameters).toBe('()')
  expect(parseResults.groups.return).toBe('')
})

test('Parse method: private justname()', () => {
  const method = '-justname()'
  const parseResults = umlclassParseMethod(method)
  expect(parseResults.groups.visibility).toBe('-')
  expect(parseResults.groups.name).toBe('justname')
  expect(parseResults.groups.parameters).toBe('()')
  expect(parseResults.groups.return).toBe('')
})

test('Parse method: public justname( key : int ) : string', () => {
  const method = '+justname(key:int):string'
  const parseResults = umlclassParseMethod(method)
  expect(parseResults.groups.visibility).toBe('+')
  expect(parseResults.groups.name).toBe('justname')
  expect(parseResults.groups.parameters).toBe('(key:int)')
  expect(parseResults.groups.return).toBe('string')
})

// members have visibility, name, type, default
// Basically [+-#][name:]String[=defaultValue]
test('Parse member: justname', () => {
  const member = 'justname'
  const parseResults = umlclassParseMember(member)
  expect(parseResults.groups.visibility).toBe('')
  expect(parseResults.groups.name).toBe('')
  expect(parseResults.groups.type).toBe('justname')
  expect(parseResults.groups.default).toBe('')
})

test('Parse member: +boolean', () => {
  const member = '+boolean'
  const parseResults = umlclassParseMember(member)
  expect(parseResults.groups.visibility).toBe('+')
  expect(parseResults.groups.name).toBe('')
  expect(parseResults.groups.type).toBe('boolean')
  expect(parseResults.groups.default).toBe('')
})

test('Parse member: #boolean=false', () => {
  const member = '#boolean=false'
  const parseResults = umlclassParseMember(member)
  expect(parseResults.groups.visibility).toBe('#')
  expect(parseResults.groups.name).toBe('')
  expect(parseResults.groups.type).toBe('boolean')
  expect(parseResults.groups.default).toBe('false')
})

test('Parse member: public justname:List<string>', () => {
  const member = '+justname:List<string>'
  const parseResults = umlclassParseMember(member)
  expect(parseResults.groups.visibility).toBe('+')
  expect(parseResults.groups.name).toBe('justname')
  expect(parseResults.groups.type).toBe('List<string>')
  expect(parseResults.groups.default).toBe('')
})

test('Parse member: public justname:List<string>=[]', () => {
  const member = '+justname:List<string>=[]'
  const parseResults = umlclassParseMember(member)
  expect(parseResults.groups.visibility).toBe('+')
  expect(parseResults.groups.name).toBe('justname')
  expect(parseResults.groups.type).toBe('List<string>')
  expect(parseResults.groups.default).toBe('[]')
})
