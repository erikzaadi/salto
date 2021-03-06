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
import { client as clientUtils } from '@salto-io/adapter-components'
import { createConnection } from './connection'
import { WORKATO } from '../constants'
import { Credentials } from '../auth'
import { getMinSinceIdPagination } from './pagination'

const {
  getWithPageOffsetPagination, DEFAULT_RETRY_OPTS, RATE_LIMIT_UNLIMITED_MAX_CONCURRENT_REQUESTS,
} = clientUtils

const DEFAULT_MAX_CONCURRENT_API_REQUESTS: Required<clientUtils.ClientRateLimitConfig> = {
  total: RATE_LIMIT_UNLIMITED_MAX_CONCURRENT_REQUESTS,
  // this is arbitrary, could not find official limits
  get: 10,
}

const DEFAULT_PAGE_SIZE: Required<clientUtils.ClientPageSizeConfig> = {
  get: 10,
}

export const paginate: clientUtils.GetAllItemsFunc = async function *paginate({
  conn,
  pageSize,
  getParams,
}) {
  if (getParams?.paginationField === 'since_id') {
    // special handling for endpoints that use descending ids, like the recipes endpoint
    yield* getMinSinceIdPagination({ conn, pageSize, getParams })
  } else {
    yield* getWithPageOffsetPagination({ conn, pageSize, getParams })
  }
}
export default class WorkatoClient extends clientUtils.AdapterHTTPClient<
  Credentials, clientUtils.ClientRateLimitConfig
> {
  constructor(
    clientOpts: clientUtils.ClientOpts<Credentials, clientUtils.ClientRateLimitConfig>,
  ) {
    super(
      WORKATO,
      clientOpts,
      createConnection,
      {
        pageSize: DEFAULT_PAGE_SIZE,
        rateLimit: DEFAULT_MAX_CONCURRENT_API_REQUESTS,
        retry: DEFAULT_RETRY_OPTS,
      }
    )
  }

  protected getAllItems = paginate
}
