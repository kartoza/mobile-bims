import {ApiResponse} from 'apisauce';

interface ApiProblemMetadata {
  status?: number;
  message?: string;
}

export type GeneralApiProblem =
  /**
   * Times up.
   */
  | ({kind: 'timeout'; temporary: true} & ApiProblemMetadata)
  /**
   * Cannot connect to the server for some reason.
   */
  | ({kind: 'cannot-connect'; temporary: true} & ApiProblemMetadata)
  /**
   * The server experienced a problem. Any 5xx error.
   */
  | ({kind: 'server'} & ApiProblemMetadata)
  /**
   * We're not allowed because we haven't identified ourself. This is 401.
   */
  | ({kind: 'unauthorized'} & ApiProblemMetadata)
  /**
   * We don't have access to perform that request. This is 403.
   */
  | ({kind: 'forbidden'} & ApiProblemMetadata)
  /**
   * Unable to find that resource.  This is a 404.
   */
  | ({kind: 'not-found'} & ApiProblemMetadata)
  /**
   * All other 4xx series errors.
   */
  | ({kind: 'rejected'} & ApiProblemMetadata)
  /**
   * Something truly unexpected happened. Most likely can try again. This is a catch all.
   */
  | ({kind: 'unknown'; temporary: true} & ApiProblemMetadata)
  /**
   * The data we received is not in the expected format.
   */
  | ({kind: 'bad-data'} & ApiProblemMetadata);

const extractApiMessage = (data: any): string | undefined => {
  if (!data) {
    return undefined;
  }
  if (typeof data === 'string') {
    return data;
  }
  if (Array.isArray(data)) {
    const messages = data
      .map(item => extractApiMessage(item))
      .filter(Boolean) as string[];
    return messages.length > 0 ? messages.join('; ') : undefined;
  }
  if (typeof data !== 'object') {
    return String(data);
  }

  const commonKeys = [
    'detail',
    'message',
    'error',
    'errors',
    'non_field_errors',
  ];
  for (const key of commonKeys) {
    const nestedMessage = extractApiMessage(data[key]);
    if (nestedMessage) {
      return nestedMessage;
    }
  }

  const fieldMessages = Object.entries(data)
    .map(([key, value]) => {
      const nestedMessage = extractApiMessage(value);
      return nestedMessage ? `${key}: ${nestedMessage}` : null;
    })
    .filter(Boolean) as string[];

  return fieldMessages.length > 0 ? fieldMessages.join('; ') : undefined;
};

const withMetadata = (
  problem: Omit<GeneralApiProblem, 'status' | 'message'>,
  response: ApiResponse<any>,
): GeneralApiProblem => ({
  ...problem,
  status: response.status,
  message: extractApiMessage(response.data),
});

/**
 * Attempts to get a common cause of problems from an api response.
 *
 * @param response The api response.
 */
export function getGeneralApiProblem(
  response: ApiResponse<any>,
): GeneralApiProblem | void | null {
  switch (response.problem) {
    case 'CONNECTION_ERROR':
      return withMetadata({kind: 'cannot-connect', temporary: true}, response);
    case 'NETWORK_ERROR':
      return withMetadata({kind: 'cannot-connect', temporary: true}, response);
    case 'TIMEOUT_ERROR':
      return withMetadata({kind: 'timeout', temporary: true}, response);
    case 'SERVER_ERROR':
      return withMetadata({kind: 'server'}, response);
    case 'UNKNOWN_ERROR':
      return withMetadata({kind: 'unknown', temporary: true}, response);
    case 'CLIENT_ERROR':
      switch (response.status) {
        case 401:
          return withMetadata({kind: 'unauthorized'}, response);
        case 403:
          return withMetadata({kind: 'forbidden'}, response);
        case 404:
          return withMetadata({kind: 'not-found'}, response);
        default:
          return withMetadata({kind: 'rejected'}, response);
      }
    case 'CANCEL_ERROR':
      return null;
  }

  return null;
}
