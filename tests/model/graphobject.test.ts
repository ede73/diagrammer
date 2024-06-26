// @ts-check
import { GraphObject } from '../../model/graphobject.js'
import { GraphCanvas } from '../../model/graphcanvas.js'
import { describe, expect, it } from '@jest/globals'

// TODO: Convert to TypeScript

describe('GraphObject tests', () => {
  const labelCandidates = {
    // quote would mess up parsing
    'La"bel': [
      undefined, 'Label', undefined
    ],
    '#00ff00': [
      '00ff00', '', undefined
    ],
    '#ff0000Label': [
      'ff0000', 'Label', undefined
    ],
    // sneakily test trim also
    '#ff0000 Label ': [
      'ff0000', 'Label', undefined
    ],
    'Label[http://acme.com/]': [
      undefined, 'Label', 'http://acme.com/'
    ],
    'Label [ http://acme.com/ ]': [
      undefined, 'Label', 'http://acme.com/'
    ],
    '#00ff00[http://acme.com/]': [
      '00ff00', '', 'http://acme.com/'
    ],
    '#ff0000Label[http://acme.com/]': [
      'ff0000', 'Label', 'http://acme.com/'
    ],
    '#ff0000Label [ http://acme.com/ ] continuation': [
      'ff0000', 'Label continuation', 'http://acme.com/'
    ]
  }
  Object.entries(labelCandidates).forEach(([label, verifications]) => {
    const c = new GraphCanvas()
    const obj = new GraphObject('', c)
    obj.setLabel(label)

    it(`Verify that GraphObject with label (${label}) is parsed as textcolor=${verifications[0] ?? 'undefined'} label=${verifications[1] ?? 'undefined'} url=${verifications[2] ?? 'undefined'}`, async () => {
      // Bug in jest? Requires strings?
      expect(String(obj.getTextColor())).toMatch(String(verifications[0]))
      expect(String(obj.getLabel())).toMatch(String(verifications[1]))
      expect(String(obj.getUrl())).toMatch(String(verifications[2]))
    })
  })
})
