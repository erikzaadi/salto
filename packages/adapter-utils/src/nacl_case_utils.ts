/*
*                      Copyright 2021 Salto Labs Ltd.
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

const NACL_ESCAPING_SUFFIX_SEPARATOR = '@'

export const pathNaclCase = (name?: string): string =>
  (name ? name.split(NACL_ESCAPING_SUFFIX_SEPARATOR)[0] : '')

/* eslint-disable quote-props */
// Current values in this mapping should not be changed
// Values in the map should be unique
// Adding more values should be with a leading z as an indication the value has more than one letter
const defaultNaclCaseMapping = {
  '?': 'a',
  '-': 'b',
  '\\': 'c',
  '/': 'd',
  '&': 'e',
  ':': 'f',
  '|': 'g',
  '[': 'h',
  ']': 'i',
  '(': 'j',
  ')': 'k',
  '!': 'l',
  '@': 'm',
  '#': 'n',
  '*': 'o',
  '%': 'p',
  ';': 'q',
  '"': 'r',
  ' ': 's',
  '\'': 't',
  '_': 'u',
  '.': 'v',
  '^': 'w',
  '<': 'x',
  '>': 'y',
  '`': 'za',
  '~': 'zb',
  '$': 'zc',
  ',': 'zd',
} as Record<string, string>

const suffixFromList = (specialCharsMappingList: string[]): string => {
  if (specialCharsMappingList.length === 0
      // If all the special chars are _ then the suffix is empty
      || specialCharsMappingList
        .every(mappedSpecialChar => mappedSpecialChar === defaultNaclCaseMapping._)) {
    return ''
  }
  if (specialCharsMappingList
    .every(mappedSpecialChar => mappedSpecialChar === specialCharsMappingList[0])) {
    return `${NACL_ESCAPING_SUFFIX_SEPARATOR}${specialCharsMappingList[0]}`
  }
  return `${NACL_ESCAPING_SUFFIX_SEPARATOR}${specialCharsMappingList.join('')}`
}

export const naclCase = (name?: string): string => {
  // replace all special chars with _
  // then add a special chars mapping after the separator for uniqueness
  if (name === undefined) {
    return ''
  }
  const specialCharsMappingList: string[] = []
  const replaceChar = (char: string): string => {
    specialCharsMappingList.push(defaultNaclCaseMapping[char] ?? `_${char.charCodeAt(0).toString().padStart(5, '0')}`)
    return '_'
  }
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, replaceChar)
  return `${cleanName}${suffixFromList(specialCharsMappingList)}`
}
