import 'jquery';
export function makeHTTPPost(url, data, successCallback, errorCallback) {
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
        success: (data, textStatus, jqXHR) => {
            const contentType = jqXHR.getResponseHeader('content-type');
            if (contentType === 'image/png') {
                successCallback(data);
            }
            else {
                successCallback(String(data));
            }
        },
        error: (jqXHR, textStatus, errorThrown) => { errorCallback(jqXHR.status, jqXHR.statusText, jqXHR.responseText); }
    });
}
export function makeHTTPGet(url, successCallback, errorCallback, contentType, dataType) {
    $.ajax({
        type: 'GET',
        async: true,
        cache: false,
        contentType,
        dataType,
        url,
        success: (data, textStatus, jqXHR) => { successCallback(data); },
        error: (jqXHR, textStatus, _errorThrown) => { errorCallback(jqXHR.status, jqXHR.statusText, jqXHR.responseText); }
    });
}
