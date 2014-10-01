// ==UserScript==
// @name         Color Google Webmaster Tools Search Query Performance
// @namespace    http://www.alexauswien.at
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


    // color stuff
    var rows = document.querySelectorAll("table#grid > tbody > tr")

    for (var i=0; i < rows.length; i++) {
        var row = rows[i]

        var imps = row.getElementsByClassName("impressions")[0]
        var impsValue = parseInt(imps.textContent.replace(/[,\.]/, ""))
        if (impsValue < MIN_IMPRESSIONS) continue

        var clicks = row.getElementsByClassName("clicks")[0]
        var clicksValue = parseInt(clicks.textContent.replace(/[,\.]/, ""))

        var pos = row.getElementsByClassName("position")[0]
        processPosition(pos)

        var ctr = row.getElementsByClassName("click-rate")[0]
        // set element to a more exact CTR value
        ctr_exact = 100.0 * (clicksValue / impsValue)
        ctr.innerHTML = parseInt( (ctr_exact+0.005) *100) / 100.0 + "&nbsp;%"

        processCTR(ctr, pos)
    }

    // wait 3 seconds for the svg to load and then add a CTR graph to the svg
    var svg;
    setTimeout(function() {
        svg = document.querySelector("svg")
        processSVG(svg)
    }, 3000);

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

    function processSVG(svg) {
        var graph       = svg.querySelector("g").querySelector("g").lastChild
        var impressions = graph.firstChild
        var clicks      = graph.lastChild

        var impressionsPath     = impressions.getAttribute("d")
        var impressionsCommands = impressionsPath.split(/[LM]/)
        var clicksPath          = clicks.getAttribute("d")
        var clicksCommands      = clicksPath.split(/[LM]/)

        var SVG_HEIGHT   = 140
        var MAGIC_NUMBER = 21

        // sadly I don't know what I did here
        function estimateGoogleY(y) {
            return SVG_HEIGHT - MAGIC_NUMBER - y / 1.2
        }

        // y as offset from the top
        function calculateCtrY(y) {
            return SVG_HEIGHT - y
        }

        // sprad out values vertically accross the svg
        function calculateSpread(values) {
            var max = Math.max.apply(null, values)
            return (SVG_HEIGHT - MAGIC_NUMBER) / max
        }

        var ctrs = []
        // go through all the impressions and clicks and calculate the ratio
        for (var i=1; i < clicksCommands.length; i++) {
            // a command looks like this: "<cmd_name><x_coord>,<y_coord>"
            var clicksCommand      = clicksCommands[i]
            var impressionsCommand = impressionsCommands[i]
            var x = parseFloat(clicksCommand.split(",")[0] || 0)

            var clicksY      = estimateGoogleY(parseFloat(clicksCommand.split(",")[1]))
            var impressionsY = estimateGoogleY(parseFloat(impressionsCommand.split(",")[1]))

            var ctr = clicksY / impressionsY
            ctrs.push(ctr)
        }

        // y coordinates should be spread out across the svg
        var spread = calculateSpread(ctrs)
        var coords = []
        for (var i=1; i < clicksCommands.length; i++) {
            // we'll just take the x coord from the clicks commands
            var clicksCommand = clicksCommands[i]
            var x = parseFloat(clicksCommand.split(",")[0] || 0)

            var y = ctrs[i-1]
            y = calculateCtrY( y * spread )
            coords.push( [x, parseInt(y)] )
        }

        // create SVG path from the coorinates
        var pathString = "M" + coords[0][0] + "," + coords[0][1]
        for (var i=1; i < coords.length; i++) {
            pathString += "L" + coords[i][0] + "," + coords[i][1]
        }

        // create new HTML element and append to the svg graph
        var newPath = document.createElementNS("http://www.w3.org/2000/svg", 'path')
        newPath.style.stroke      = "lightgreen"
        newPath.style.strokeWidth = "2"
        newPath.style.fillOpacity = "1"
        newPath.style.fill        = "none"
        newPath.setAttribute("d", pathString)
        graph.appendChild(newPath)

        // TODO: y labels on the right side

        // <text text-anchor="start" x="1200" y="11.15" font-family="Arial" font-size="9" stroke="none" stroke-width="0" fill="#848484">120</text>
        // <text text-anchor="start" x="1200" y="45.89" font-family="Arial" font-size="9" stroke="none" stroke-width="0" fill="#848484">90</text>
        //<text text-anchor="start" x="1200" y="80.65" font-family="Arial" font-size="9" stroke="none" stroke-width="0" fill="#848484">60</text>
        //<text text-anchor="start" x="1200" y="115.4" font-family="Arial" font-size="9" stroke="none" stroke-width="0" fill="#848484">30</text>
    }

})()
