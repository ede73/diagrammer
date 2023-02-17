// @ts-check
import 'jquery'

/**
 *
 * @param {string} url
 * @param {string} data
 * @param {function(string):void} successCallback
 * @param {function(number, string, string):void} errorCallback
 */
export function makeHTTPPost (url, data, successCallback, errorCallback) {
  // eslint-disable-next-line no-undef
  $.ajax({
    type: 'POST',
    async: true,
    cache: false,
    url,
    data,
    contentType: 'application/json; charset=utf-8',
    // Type: Function( Anything data, String textStatus, jqXHR jqXHR )
    success: (data, textStatus, jqXHR) => successCallback(String(data)),
    // Type: Function( jqXHR jqXHR, String textStatus, String errorThrown )
    error: (jqXHR, textStatus, errorThrown) =>
      errorCallback(jqXHR.status, jqXHR.statusText, jqXHR.responseText)
  })
}

/**
 *
 * @param {string} url
 * @param {function(any):void} successCallback
 * @param {function(number,string,string):void} errorCallback
 */
export function makeHTTPGet (url, successCallback, errorCallback, contentType = undefined, dataType = undefined) {
  // eslint-disable-next-line no-undef
  $.ajax({
    type: 'GET',
    async: true,
    cache: false,
    contentType,
    dataType,
    url,
    // Type: Function( Anything data, String textStatus, jqXHR jqXHR )
    success: (data, textStatus, jqXHR) => successCallback(data),
    // Type: Function( jqXHR jqXHR, String textStatus, String errorThrown )
    error: (jqXHR, textStatus, errorThrown) =>
      errorCallback(jqXHR.status, jqXHR.statusText, jqXHR.responseText)
  })
}
