// ==UserScript==
// @name         Color Google Webmaster Tools Search Query Performance
// @namespace    http://www.alexauswien.at
// @downloadURL  https://raw.githubusercontent.com/aseifert/color-gwt-query-reports/master/userstyle.js
// @version      0.3
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


    // go through the rows do our magic
    var rows = document.querySelectorAll("table#grid > tbody > tr")
    for (var i=0; i < rows.length; i++) {
        var row = rows[i]

        // get impressions
        var imps = row.getElementsByClassName("impressions")[0]
        var impsValue = parseInt(imps.textContent.replace(/[,\.]/, ""))
        if (impsValue < MIN_IMPRESSIONS) continue

        // get clicks
        var clicks = row.getElementsByClassName("clicks")[0]
        var clicksValue = parseInt(clicks.textContent.replace(/[,\.]/, ""))

        // color position
        var pos = row.getElementsByClassName("position")[0]
        processPosition(pos)

        // make CTR more exact
        var ctr = row.getElementsByClassName("click-rate")[0]
        // set element to a more exact CTR value
        ctr_exact = 100.0 * (clicksValue / impsValue)
        ctr.innerHTML = parseInt( (ctr_exact+0.005) *100) / 100.0 + "&nbsp;%"

        // color CTR
        processCTR(ctr, pos)
    }

    // add data for the CTRs
    var chartData = getChartData()
    chartData = augmentChartData(chartData)
    var chart = createChart(chartData)
    chart.render()

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

    function getChartData() {
        var script     = document.querySelector("#tsq-chart").parentNode.nextElementSibling
        if (script.tagName !== "SCRIPT") throw new Error("Chart data not found")
        var dataString = script.textContent.match(/setData\((.+)\);/)[1]
        return JSON.parse( dataString )
    }

    // sprad out values vertically accross the svg
    function calculateSpread(ctrs, clicks, impressions) {
        var max  = Math.max.apply(null, ctrs)
        
        var maxC = Math.max.apply(null, clicks)
        var maxI = Math.max.apply(null, impressions)
        var maxOther = Math.max(maxC, maxI)

        return maxOther / max
    }

    // changes the data array
    function augmentChartData(data) {

        // add new column for CTRs
        data.cols.push({
            id: "Column_2",
            label: "CTR",
            pattern: "",
            type: "number"
        })

        // calculate CTRs and gather spreads and impressions
        ctrs        = []
        clicks      = []
        impressions = []
        data.rows.forEach(function(row, i) {
            impressions.push( row.c[1].v )
            clicks.push( row.c[2].v )
            ctrs.push( 100.0 * clicks[i] / impressions[i] )

        })

        // add values adjusted by spread to the data
        var spread = calculateSpread(ctrs, clicks, impressions)
        data.rows.forEach(function(row, i) {
            row.c.push({
                v: spread * ctrs[i],
                f: ""+ctrs[i]
            })
        })

        return data
    }

    function createChart(data) {
        var chart = new wmt.common.display.charts.Chart(
        "LineChart",
        "tsq-chart",
        {"chartArea":{"height":"140","width":"100%","left":"0","top":"0"},"annotation":{"1":{"style":"line"}},"height":"160","pointSize":0,"colors":["#4d90fe","#dd4b39","#3d9400","#cc9933","#994499","#fb9d00","#c9678e","#2ad0b1","#954e04"],"legend":{"position":"none"},"width":"100%","vAxis":{"baselineColor":"#848484","textPosition":"in","textStyle":{"bold":false,"color":"#848484","fontSize":9},"baseline":0},"focusTarget":"category","hAxis":{"baselineColor":"#848484","textPosition":"out","textStyle":{"bold":false,"color":"#848484","fontSize":9},"showTextEvery":4}});

        chart.setData(data)
        return chart
    }

})()
