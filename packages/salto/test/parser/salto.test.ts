import Parser from '../../src/parser/salto'
import {
  ObjectType, PrimitiveType, PrimitiveTypes, TypesRegistry, Type,
} from '../../src/core/elements'

describe('Salto parser', () => {
  describe('primitive and model', () => {
    let parsedElements: Type[]

    beforeAll(async () => {
      const body = `
      type salesforce_string is string { 
      }

      model salesforce_test {
        salesforce_string name {
          label = "Name"
          _required = true
        }

        fax {
          field_level_security = {
            all_profiles = {
              visible = false
              read_only = false
            }
          }
        }

        lead_convert_settings = {
          account = [
            {
              input = "bla"
              output = "foo"
            }
          ]
        }
      }`

      const parser = new Parser(new TypesRegistry())
      const { elements } = await parser.Parse(Buffer.from(body), 'none')
      parsedElements = elements
    })

    describe('parse result', () => {
      it('should have two types', () => {
        expect(parsedElements.length).toBe(2)
      })
    })

    describe('primitive type', () => {
      let stringType: PrimitiveType
      beforeAll(() => {
        stringType = parsedElements[0] as PrimitiveType
      })
      it('should have the correct type', () => {
        expect(stringType.primitive).toBe(PrimitiveTypes.STRING)
      })
    })

    describe('model', () => {
      let model: ObjectType
      beforeAll(() => {
        model = parsedElements[1] as ObjectType
      })
      describe('new field', () => {
        it('should exist', () => {
          expect(model.fields).toHaveProperty('name')
        })
        it('should have the correct type', () => {
          expect(model.fields.name.typeID.adapter).toBe('salesforce')
          expect(model.fields.name.typeID.name).toBe('string')
        })
        it('should have annotation values', () => {
          expect(model.annotationsValues).toHaveProperty('name')
          expect(model.annotationsValues.name).toHaveProperty('label')
          expect(model.annotationsValues.name.label).toEqual('Name')
          expect(model.annotationsValues.name).toHaveProperty('_required')
          // eslint-disable-next-line no-underscore-dangle
          expect(model.annotationsValues.name._required).toEqual(true)
        })
      })

      describe('field override', () => {
        it('should exist', () => {
          expect(model.annotationsValues).toHaveProperty('fax')
        })
        it('should not be a new field', () => {
          expect(model.fields).not.toHaveProperty('fax')
        })
        it('should have the correct value', () => {
          expect(model.annotationsValues.fax).toEqual({
            // eslint-disable-next-line @typescript-eslint/camelcase
            field_level_security: {
              // eslint-disable-next-line @typescript-eslint/camelcase
              all_profiles: {
                visible: false,
                // eslint-disable-next-line @typescript-eslint/camelcase
                read_only: false,
              },
            },
          })
        })
      })

      describe('model annotations', () => {
        it('should exist', () => {
          expect(model.annotationsValues).toHaveProperty('lead_convert_settings')
        })
        it('should have the correct value', () => {
          expect(model.annotationsValues.lead_convert_settings).toEqual({
            account: [
              {
                input: 'bla',
                output: 'foo',
              },
            ],
          })
        })
      })
    })
  })

  describe('error tests', () => {
    it('fails on invalid inheritence syntax', async () => {
      const body = `
      type salesforce_string string {}
      `
      const parser = new Parser(new TypesRegistry())
      await expect(parser.Parse(Buffer.from(body), 'none')).rejects.toThrow()
    })
  })
  it('fails on invalid top level syntax', async () => {
    const body = 'bla {}'
    const parser = new Parser(new TypesRegistry())
    await expect(parser.Parse(Buffer.from(body), 'none')).rejects.toThrow()
  })
})