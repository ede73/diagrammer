//@ts-check
import { getSavedGraph } from './localStorage.js';
// Tried npm i --save-dev @types/jquery, worked
// Fails in browser, but works while editing!
//import $ from "jquery";

function ParseResult(err) {
    alert(err);
}

export function exportGraphs() {
    $.ajax({
        type: "POST",
        async: true,
        cache: false,
        url: "web/saveExport.php",
        data: JSON.stringify(getSavedGraph()),
        contentType: "application/json; charset=utf-8",
        // dataType: "json",
        success: function (msg) {
            alert("Exported");
        },
        error: function (err) {
            alert("ERROR: " + JSON.stringify(err));
            if (err.status == 200) {
                ParseResult(err);
            } else {
                alert('Error:' + err.responseText + '  Status: ' + err.status);
            }
        }
    });
}

export function importGraphs() {
    $.ajax({
        type: "GET",
        async: true,
        cache: false,
        // url: "web/localstorage.json",
        url: "web/loadExport.php",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (msg) {
            localStorage.setItem("graphs", JSON.stringify(msg));
            alert("Imported, reload the page!");
        },
        error: function (err) {
            alert("ERROR: " + JSON.stringify(err));
            if (err.status == 200) {
                ParseResult(err);
            } else {
                alert('Error:' + err.responseText + '  Status: ' + err.status);
            }
        }
    });
}
