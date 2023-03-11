// @ts-check
import 'jquery'

// TODO: not sure how TS thinks $.ajax is async (doesnt return promise, it it indeed is)
// though now we've promise and separate callbacks which defeates the purpose.
// stop using jquery and replace this
export function makeHTTPPost(
  url: string,
  data: string,
  successCallback: (result: string) => void,
  errorCallback: (statusCode: number, statusText: string, responseText: string) => void) {
  // at least on my jquery version this does NOT return a promise (in fact promisifying breaks)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  $.ajax({
    type: 'POST',
    async: true,
    cache: false,
    url,
    data,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    contentType: 'application/json; charset=utf-8',
    // Type: Function( Anything data, String textStatus, jqXHR jqXHR )
    success: (data, textStatus, jqXHR) => {
      const contentType = jqXHR.getResponseHeader('content-type')
      if (contentType === 'image/png') {
        successCallback(data)// .toString('base64'))
      } else {
        successCallback(String(data))
      }
    },
    // Type: Function( jqXHR jqXHR, String textStatus, String errorThrown )
    error: (jqXHR, textStatus, errorThrown) => { errorCallback(jqXHR.status, jqXHR.statusText, jqXHR.responseText) }
  })
}

export function makeHTTPGet(
  url: string,
  successCallback: (result: any) => void,
  errorCallback: (statusCode: number, statusText: string, responseText: string) => void,
  contentType?: string,
  dataType?: string) {
  // at least on my jquery version this does NOT return a promise (in fact promisifying breaks)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  $.ajax({
    type: 'GET',
    async: true,
    cache: false,
    contentType,
    dataType,
    url,
    // Type: Function( Anything data, String textStatus, jqXHR jqXHR )
    success: (data, textStatus, jqXHR) => { successCallback(data) },
    // Type: Function( jqXHR jqXHR, String textStatus, String errorThrown )
    error: (jqXHR, textStatus, _errorThrown) => { errorCallback(jqXHR.status, jqXHR.statusText, jqXHR.responseText) }
  })
}
