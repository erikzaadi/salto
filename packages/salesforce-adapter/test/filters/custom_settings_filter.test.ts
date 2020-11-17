/*
*                      Copyright 2020 Salto Labs Ltd.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with
* the License.  You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
import { ElemID, ObjectType, Element, ServiceIds, isInstanceElement } from '@salto-io/adapter-api'
import { createCustomSettingsObject } from '../utils'
import { FilterWith } from '../../src/filter'
import SalesforceClient from '../../src/client/client'
import Connection from '../../src/client/jsforce'
import filterCreator from '../../src/filters/custom_settings_filter'
import mockAdapter from '../adapter'
import {
  CUSTOM_OBJECT, API_NAME, METADATA_TYPE, SALESFORCE, CUSTOM_SETTINGS_TYPE,
  LIST_CUSTOM_SETTINGS_TYPE,
} from '../../src/constants'

const customSettingsWithNoNameFieldName = 'noNameField'
const customSettingsWithNoNameField = new ObjectType({
  elemID: new ElemID(SALESFORCE, customSettingsWithNoNameFieldName),
  annotations: {
    [API_NAME]: customSettingsWithNoNameFieldName,
    [METADATA_TYPE]: CUSTOM_OBJECT,
    [CUSTOM_SETTINGS_TYPE]: LIST_CUSTOM_SETTINGS_TYPE,
  },
})

/* eslint-disable @typescript-eslint/camelcase */
describe('Custom settings filter', () => {
  let connection: Connection
  let client: SalesforceClient
  type FilterType = FilterWith<'onFetch'>
  let filter: FilterType

  const NAME_FROM_GET_ELEM_ID = 'getElemIDPrefix'
  const mockGetElemIdFunc = (adapterName: string, _serviceIds: ServiceIds, name: string):
    ElemID => new ElemID(adapterName, `${NAME_FROM_GET_ELEM_ID}${name}`)
  const TestCustomSettingsRecords = [
    {
      attributes: {
        type: 'Test',
      },
      Id: '1',
      Name: 'TestName1',
    },
    {
      attributes: {
        type: 'Test',
      },
      Id: '2',
      Name: 'TestName2',
    },
  ]

  let basicQueryImplementation: jest.Mock

  beforeEach(() => {
    ({ connection, client } = mockAdapter({
      adapterParams: {
        getElemIdFunc: mockGetElemIdFunc,
      },
    }))
    basicQueryImplementation = jest.fn().mockImplementation(async () => (
      {
        totalSize: 2,
        done: true,
        records: TestCustomSettingsRecords,
      }))
    connection.query = basicQueryImplementation
  })

  describe('Custom settings filter ', () => {
    const customSettingsObject = createCustomSettingsObject('configurationobj', LIST_CUSTOM_SETTINGS_TYPE)
    let elements: Element[]
    beforeEach(() => {
      filter = filterCreator(
        {
          client,
          config: {
            dataManagement: undefined,
          },
        }
      ) as FilterType
    })

    beforeEach(async () => {
      elements = [
        customSettingsObject,
        customSettingsWithNoNameField,
      ]
      await filter.onFetch(elements)
    })

    it('Should no change the objects', () => {
      const validObject = elements.find(elm => elm.elemID.isEqual(customSettingsObject.elemID))
      expect(validObject).toEqual(customSettingsObject)
      const noNameObject = elements
        .find(elm => elm.elemID.isEqual(customSettingsWithNoNameField.elemID))
      expect(noNameObject).toEqual(customSettingsWithNoNameField)
    })

    it('Should add two instances for the valid object and no isntances for noName one', () => {
      const validObjectInstances = elements
        .filter(elm => isInstanceElement(elm)
          && elm.type.elemID.isEqual(customSettingsObject.elemID))
      expect(validObjectInstances).toHaveLength(2)
      const noNameObjectInstances = elements
        .filter(elm => isInstanceElement(elm)
          && elm.type.elemID.isEqual(customSettingsWithNoNameField.elemID))
      expect(noNameObjectInstances).toHaveLength(0)
    })
  })

  describe('Custom settings filter ignores hierarchical', () => {
    const customSettingsObject = createCustomSettingsObject('configurationobj', 'Hierarchical')
    let elements: Element[]
    beforeEach(() => {
      filter = filterCreator(
        {
          client,
          config: {
            dataManagement: undefined,
          },
        }
      ) as FilterType
    })

    beforeEach(async () => {
      elements = [
        customSettingsObject,
      ]
      await filter.onFetch(elements)
    })

    it('should result to add zero instances', () => {
      expect(elements).toHaveLength(1)
    })
  })
})