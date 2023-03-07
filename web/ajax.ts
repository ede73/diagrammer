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
  return $.ajax({
    type: 'POST',
    async: true,
    cache: false,
    url,
    data,
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

export async function makeHTTPGet(
  url: string,
  successCallback: (result: any) => void,
  errorCallback: (statusCode: number, statusText: string, responseText: string) => void,
  contentType?: string,
  dataType?: string) {
  return await $.ajax({
    type: 'GET',
    async: true,
    cache: false,
    contentType,
    dataType,
    url,
    // Type: Function( Anything data, String textStatus, jqXHR jqXHR )
    success: (data, textStatus, jqXHR) => { successCallback(data) },
    // Type: Function( jqXHR jqXHR, String textStatus, String errorThrown )
    error: (jqXHR, textStatus, errorThrown) => { errorCallback(jqXHR.status, jqXHR.statusText, jqXHR.responseText) }
  })
}
