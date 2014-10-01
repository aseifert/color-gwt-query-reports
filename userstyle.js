// ==UserScript==
// @name         Color Google Webmaster Tools Search Query Performance
// @namespace    http://www.alexauswien.at
// @version      0.1
// @description  Colors search query performance as shown by Neil Patel (but slightly altered) in his [blog post](http://www.quicksprout.com/2013/12/30/how-3-simple-google-analytics-reports-will-increase-your-search-engine-traffic/)
// @match        https://www.google.com/webmasters/tools/top-search-queries*
// @copyright    2014+, Alexander Seifert <alexander.seifert@gmail.com>
// ==/UserScript==


(function() {

    // minimum number of impressions to do the calculation for
    // (bc the metrics are not really interpretable if you only had 3 impressions)
    var MIN_IMPRESSIONS = 10

    // color of successful performers
    var COLOR_SUCCESS = "lightgreen"

    // color of mildly succcessful performers
    var COLOR_WARNING = "khaki"

    // color of bad performers
    var COLOR_FAILURE = "lightsalmon"

    // up until what position (right excluded) do we consider the performance successful
    var GOOD_POS_MAX = 3.5

    // up until what position (right excluded) do we consider the performance mildly successful
    var MID_POS_MAX  = 6.5

    // what's the highest CTR we consider successful with good positions
    var GOOD_POS_CTR_CUTOFF = 20

    // what's the highest CTR we consider successful with medium positions
    var MID_POS_CTR_CUTOFF  = 8

    // what's the highest CTR we consider successful with bad positions
    var BAD_POS_CTR_CUTOFF  = 3


    // color stuff
    var rows = document.querySelectorAll("table#grid > tbody > tr")

    for (var i=0; i < rows.length; i++) {
        var row = rows[i]

        var cnt = row.getElementsByClassName("count")[0]
        var cntValue = parseInt(cnt.textContent.replace(/[,\.]/, ""))
        if (cntValue < MIN_IMPRESSIONS) continue

        var pos = row.getElementsByClassName("position")[0]
        processPosition(pos)

        var ctr = row.getElementsByClassName("click-rate")[0]
        processCTR(ctr, pos)
    }

    // add CTR to svg
    var svg = document.querySelector("svg")
    var graph = svg.querySelector("g").querySelector("g")

    var x = svg.querySelector("g").querySelector("g").lastChild.firstChild
    var d = x.getAttribute("d")
    var commands = d.split("L")

    var cmd, x, y;
    var SVG_HEIGHT   = 140
    var MAGIC_NUMBER = 9
    for (var i=0; i < commands.length; i++) {
        var cmd = commands[i]
        x = parseFloat(cmd.split(",")[0])
        y = SVG_HEIGHT - parseFloat(cmd.split(",")[1]) / 1.4
        console.log(x, y)
    }



    function processPosition(pos) {
        var posValue = parseFloat(pos.textContent.replace(",", "."))

        if (posValue < GOOD_POS_MAX) {
            pos.style["background-color"] = COLOR_SUCCESS
        } else if (posValue < MID_POS_MAX) {
            pos.style["background-color"] = COLOR_WARNING
        } else {
            pos.style["background-color"] = COLOR_FAILURE
        }
    }

    function processCTR(ctr, pos) {
        var ctrValue = parseInt(ctr.textContent.split(/[^\d]/)[0])
        var posValue = parseFloat(pos.textContent.replace(",", "."))

        if (posValue < GOOD_POS_MAX) {
            if (ctrValue >= GOOD_POS_CTR_CUTOFF) ctr.style["background-color"] = COLOR_SUCCESS
            else ctr.style["background-color"] = COLOR_FAILURE
        }
        else if (posValue < MID_POS_MAX) {
            if (ctrValue >= MID_POS_CTR_CUTOFF) ctr.style["background-color"] = COLOR_SUCCESS
            else ctr.style["background-color"] = COLOR_FAILURE
        }
        else {
            if (ctrValue >= BAD_POS_CTR_CUTOFF) ctr.style["background-color"] = COLOR_SUCCESS
            else ctr.style["background-color"] = COLOR_FAILURE
        }
    }

})()
