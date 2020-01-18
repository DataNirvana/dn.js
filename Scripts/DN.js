//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    #########################################################################
    A wrapper for D3 to produce maps, line, bar, column, sankey and pie charts using a common CSV derived
    data source. Charts are clickable, so that the interactivity triggers the central data source to be refiltered
    And then all the charts can be updated together .... magic ...

    Can also link to bubble charts produced using Leaflet.js

    #########################################################################
    Version:  January 2020 - v2.55
    #########################################################################
    Copyright © 2020 Data Nirvana Limited

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
    #########################################################################
*/
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// JS minification not quite ready for the static variables!!
function DN() {
    //------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    this.ChartList = [
        { ChartType: 100, Name: "Bar chart" },
        { ChartType: 200, Name: "Pie chart" },
        { ChartType: 300, Name: "Line chart" },
        { ChartType: 400, Name: "Sankey diagram" },
        { ChartType: 500, Name: "Map" },
        { ChartType: 600, Name: "Column chart" },
        { ChartType: 700, Name: "Multivariate bar chart" },
        { ChartType: 800, Name: "Tree Map" }
    ];

    //-----------------------------------------------------------------------------------------------------------------------------------------------------
    // A list of the months ...
    this.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];          


    //------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // Bar chart defaults
    this.defaultBarChartMargins = { top: 10, right: 45, bottom: 0, left: 5 };
    this.defaultYAxisCrossing = 190;
    // Line graph defaults
    this.defaultLineGraphMargins = { top: 10, right: 10, bottom: 80, left: 60 };
    // pie chart defaults
    // 22-Apr-2016 - reduced the margin buffer, but increased the defaultTitleHeight to reflect the actual height of the titles and to better use the space (previously 20 and 20)
    this.defaultPieMarginBuffer = 10;
    this.defaultPieDonutWidth = 40;
    // Pie / donut chart legend rectangle size - should be the same as the font size...
    this.defaultPieDonutLegendRectangleSize = 10;

    // Sankey defaults
    this.defaultSankeyMargins = { top: 10, right: 10, bottom: 5, left: 10 };
    // Column chart defaults
    this.defaultColumnChartMargins = { top: 5, right: 0, bottom: 0, left: 60 };
    // the maxNumToVisualise
    this.defaultSankeyMaxNumToVisualise = 10;

    // General title height default
    this.defaultTitleHeight = 27;
    // Combined with the title height, this should create a 3px buffer or so at the bottom of the charts (depending on the size of the font of course!)
    this.defaultChartBuffer = 3;


    //----- Map defaults
    this.defaultMapCentroid = [37.6, 9.5];
    this.defaultMapZoomLevel = 4;
    this.defaultMapMaxZoomLevel = 18;
    this.defaultMapMinRadius = 7; // pixels ...
    // For more complicated maps, the labels look quite heavy on the map (e.g. a full map of countries in Europe).  This parameter ensures that the labels only appear for more detailed zoom levels.
    this.defaultMapLabelMinZoomLevel = 6;

    // Sep-19 - previously, the max bubble radius was set to be 10% of the map width, irrespective of the zoom
    this.defaultMapBubbleRadiusPercent = 10;

    // Sep-19 - the default power to apply to the size of the bubbles.  Default is 1 (no action).  Numbers between 0 and 1 help to reduce the range (e.g. 0.5 is the square root).  This is useful to make the range in smaller values clearer.
    // The inverse is obviously true for the values larger than 1.
    this.defaultMapBubbleSizeModifier = 1;

    this.defaultMapTransition = 700;

    // The offset for the bubble labels (X) in pixels
    this.defaultBubbleLabelOffsetX = 55;
    // The offset for the bubble labels (Y) in pixels
    this.defaultBubbleLabelOffsetY = 18;

    // e.g. https://api.mapbox.com/styles/v1...
    this.mapTileURL = "";
    this.mapTileAccessToken = "";

}

//-----------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------
// DN Helper methods - the following are all helper methods to access and manipulate the data provided ...
//-----------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
DN.prototype.ChartGroup = function (data) {
    return new DNChartGroup(data);
};
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
DN.prototype.Chart = function () {
    return new DNChart();
};
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
DN.prototype.URLEditor = function () {
    return new DNURLEditor();
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
DN.prototype.GroupBy = function (data, key) { // `data` is an array of objects, `key` is the key (or property accessor) to group by
    // reduce runs this anonymous function on each element of `data` (the `item` parameter,
    // returning the `storage` parameter at the end
    return data.reduce(function (storage, item) {
        // get the first instance of the key by which we're grouping
        var group = item[key];

        // set `storage` for this instance of group to the outer scope (if not empty) or initialize it
        storage[group] = storage[group] || [];

        // add this item to its group within `storage`
        storage[group].push(item);

        // return the updated storage to the reduce function, which will then loop through the next
        return storage;
    }, {}); // {} is the initial value of the storage
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Groups and summarises the data to produce output of the form of {ID1 : Count1, ID2 : Count2}
DN.prototype.GroupByAndSummarise = function (data, keyCol, summaryCol) {

    if (IsDefined(data) && IsDefined(keyCol) && IsDefined(summaryCol)) {

        return data.reduce((groupedData, d) => {
            groupedData[d[keyCol]] = (groupedData[d[keyCol]] || 0) + d[summaryCol];
            return groupedData;
        }, {});

    } else {
        return null;
    }
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Super fast approach to generating a unique list from a list containing duplicates in linear time
// https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
DN.prototype.Unique = function (a) {
    // This commented version is not so efficient - it achieves quadratic time only; the code below is linear
    // a = a.filter((item, pos) => a.indexOf(item) === pos);
    // In ES6 this is equivalent to let uniq = a => [...new Set(a)];
    let seen = {};
    let out = [];
    let len = a.length;
    let j = 0;
    for (let i = 0; i < len; i++) {
        let item = a[i];
        if (seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
DN.prototype.IsDefined = function (variable) {
    return (typeof variable !== 'undefined' && variable !== null);
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
//-- Add the lookup lists here
DN.prototype.BuildObj = function (id, title) {
    return {
        ID: id,
        Title: title
    };
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
//-- Get the title from the list built with BuildObj given the ID
DN.prototype.GetTitleFromObj = function (id, list) {
    let title = "";
    if (IsDefined(list)) {
        for (let i = 0; i < list.length; i++) { // faster than forEach
            let v = list[i];

            if (id === v.ID) {
                title = v.Title;
                break;
            }
        }
    }
    return title;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
//-- Sort the summary data ...
DN.prototype.GetSortFunction = function (sortByValue) {
    let sortFunction = null;
    if (sortByValue === true) {
        sortFunction = function compare(a, b) {
            return d3.ascending(b.Count, a.Count);
        };
    } else {
        sortFunction = function compare(a, b) {
            return d3.ascending(a.ID, b.ID);
        };
    }
    return sortFunction;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
DN.prototype.NumberWithCommas = function (x) {
    if (!IsDefined(x) || x === "" || x === 0 || isNaN(x)) {
        return 0;
    } else {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
};
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
DN.prototype.NumberWith2DP = function (x) {
    let xStr = "--";
    if (isNaN(x) === false) {
        xStr = x.toFixed(2);
    }
    return xStr;
};
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Summarises a number in thousands, millions or billions depending on its size
DN.prototype.NumberAbbreviate = function (x) {
    let xStr = "--";
    if (isNaN(x) === false && x !== 0) {
        if (x > 1000000000) {
            xStr = (x / 1000000000).toFixed(2) + "B";
        } else if (x > 1000000) {
            xStr = (x / 1000000).toFixed(2) + "M";
        } else if (x > 1000) {
            xStr = (x / 1000).toFixed(2) + "K";
        }
    }
    return xStr;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
//-- Dramatically simplified by using the named array approach to access the information ...
DN.prototype.GetValue = function (colToCount, d) {
    return d[colToCount];
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Expands the range of IDs in the summaryCounts (a list of objects with an ID and count) to include the ID keys in the list
    with the full range.
*/
DN.prototype.ExpandRange = function (summaryCounts, fullRange) {

    if (IsDefined(summaryCounts) && IsDefined(fullRange)) {

        fullRange.forEach(function (v) {

            let exists = false;
            for (let i = 0; i < summaryCounts.length; i++) {
                if (summaryCounts[i].ID === v) {
                    exists = true;
                    break;
                }
            }

            if (exists === false) {
                summaryCounts.push({
                    ID: v,
                    Count: 0
                });
            }

        });

        //--2-- Sort the data
        summaryCounts = summaryCounts.sort(dn.GetSortFunction(false));
    }

    return summaryCounts;
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    For pie charts - Simply gets the first X colours from the colour ramp based on the number of indexed required to be displayed
    The colours will not remain fast for specific thematic values - use v2 if that is what is needed ...
    12-May-2016 - the D3 library has improved so there is no need to add the additional element to the charts now
    If no records are selected, the pie charts just dissapear
*/
DN.prototype.StrimColourRamp = function (colourRampList, numColours) {
    let newRamp = colourRampList;

    // lets strim if required ...
    if (IsDefined(colourRampList) && IsDefined(numColours) && numColours > 0) {
        newRamp = [];

        for (let i = 0; i < numColours; i++) {
            newRamp.push(colourRampList[i]);
        }

        // and then lets add the none value
        //newRamp.push("none");
    }

    return newRamp;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    For pie charts - Gets the specific colours from the ramp that match the indexes to be displayed
    The indexesInDataList is an array of indexes of the titles (thematic values) which have been found in the data
    The list of colours which is ordered in the same way as the default order of the list is filtered based on those indexes that are present in the data
    12-May-2016 - the D3 library has improved so there is no need to add the additional element to the charts now
    If no records are selected, the pie charts just dissapear
*/
DN.prototype.StrimColourRamp2 = function (colourRampList, indexesInDataList) {
    let newRamp = colourRampList;

    // lets strim if required ...
    if (IsDefined(colourRampList) && IsDefined(indexesInDataList)) {
        newRamp = [];

        indexesInDataList.forEach(function (v) {
            //for (var i = 0; i < indexesInDataList.length; i++) {
            //newRamp.push(colourRampList[indexesInDataList[i]]);
            newRamp.push(colourRampList[v]);
        });

        // and then lets add the none value
        //newRamp.push("none");
    }

    return newRamp;
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*--
    Gets a list of Year months in the following format 201807, 201806 from the starting year and month to the last full month
    (i.e.if the date is the 13 August 2018, the last month listed would be July).
    Sep-19 - note the the year month concatenation is numeric.
*/
DN.prototype.GetYearMonthFullList = function (startYear, startMonth) {

    let yearMonths = [];

    let now = new Date();

    // Loop through the dates by year and month from the starting combination to the last full month.
    // Quick catch that if this is Jan in the latest year, then the last full month would be December last year ...
    // Sep-19 - this is not really the right place for this catch.  Better to extend the method to include a max year and month (if this is required).
    //let maxY = (now.getMonth() == 0) ? now.getFullYear() - 1 : now.getFullYear();
    for (var y = startYear; y <= now.getFullYear(); y++) {

        // Do a quick catch that we dont want to go beyond the last full month ...
        let maxM = (y === now.getFullYear()) ? now.getMonth() : 12;
        // And if this is the first year we want to start at the given month
        let minM = (y === startYear) ? startMonth : 0;
        for (let m = minM; m < maxM; m++) {

            let leadingZero = "";
            // Remember also to remove the zero indexing so that the numbers are logical to humans!!
            let actualM = m + 1;
            if (actualM < 10) {
                leadingZero = "0";
            }

            // Sep-19 - Force this to be numeric...
            yearMonths.push(+("" + y + "" + leadingZero + "" + actualM));
        }
    }

    return yearMonths;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*--
    Gets the description of the year and month lists given a list in the following format 201807, 201806.
*/
DN.prototype.GetYearMonthDescriptionList = function (yearMonthList, useShortMonthDescription) {
    let descList = [];

    if (IsDefined(yearMonthList)) {
        yearMonthList.forEach(function (v) {

            // Sep-19 - parse as a string to use substring (as the e.g. 201807 convention will be numeric)
            let month = +(v.toString().substring(4));
            let monthText = dn.months[month - 1];
            let yearStr = v.toString().substring(0, 4);

            if (useShortMonthDescription === null || useShortMonthDescription === false) {
                descList.push(dn.BuildObj(v, monthText + " " + yearStr));
            } else {
                descList.push(dn.BuildObj(v, yearStr + "-" + monthText.substring(0, 3)));
            }
        });
    }

    return descList;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*--
    Gets the description of the year lists given a list in the following format 2018, 2019.
*/
DN.prototype.GetYearDescriptionList = function (yearList) {
    let descList = [];

    if (IsDefined(yearList)) {
        yearList.forEach(function (v) {
            descList.push(dn.BuildObj(v, v));
        });
    }

    return descList;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
DN.prototype.GetPercent = function (enumerator, denominator, decimalPlaces, maxIs100) {

    let percent = 0;

    if (enumerator > 0 && denominator > 0) {
        // so e.g. 1dp = 1000 * 52 / 2 / 10 = 2600.0
        percent = Math.round(Math.pow(10, decimalPlaces) * 100 * enumerator / denominator) / Math.pow(10, decimalPlaces);

        if (maxIs100 === true && percent > 100) {
            percent = 100;
        }
    }

    return percent;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
DN.prototype.GetPercentString = function (val, useBrackets, hideIfIs100) {

    let percStr = "";

    if (hideIfIs100 === true && val === 100) {
        // do nothing
    } else {
        percStr = val + "%";
        percStr = (useBrackets === true) ? "(" + percStr + ")" : percStr;
    }

    return percStr;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 *
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 *
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
DN.prototype.GetTextWidth = function (text, font) {
    // re-use canvas object for better performance
    let canvas = dn.GetTextWidth.canvas || (dn.GetTextWidth.canvas = document.createElement("canvas"));
    let context = canvas.getContext("2d");
    context.font = font;
    let metrics = context.measureText(text);
    return metrics.width;
    // to test: console.log(GetTextWidth("hello there   !", "bold 12pt arial"));
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Designed to compare from one year to another.
DN.prototype.CalculatePercentageDifference = function (previousPeriod, previousVal, currentVal, cssPositive, cssNegative) {
    //--4-- Calculate the percentage difference string
    let percDiff = 0;
    let percDiffStr = "";
    let comparatorLogic = "";
    let comparisonClass = "";

    if (previousVal === 0 && currentVal === 0) {
        // CASE 1 - both current year and previous year are zero - we simply ignore

    } else if (previousVal === 0 || currentVal === 0) {
        // CASE 2 - either current year or previous year are zero - we simply state the two totals
        percDiffStr = " compared to " + dn.NumberWithCommas(previousVal);
        comparatorLogic = " in " + previousPeriod;
    } else {
        // CASE 3 - we do a comparison
        // Get the percentage
        percDiff = (currentVal - previousVal) / previousVal * 100;

        // Round the percengage with 1DP if less than 1, 0DP otherwise
        if (percDiff < -1 || percDiff > 1) {
            percDiff = Math.round(percDiff);
        } else {
            // We want one decimal place here
            percDiff = Math.round(percDiff * 10) / 10;
        }

        // if the percDiff is < 100 or >100 change it to be x times less then or x times more than ...
        if (percDiff < -100 || percDiff > 100) {
            // differentiate between 1.0, 1.2 up to 2
            let times = currentVal / previousVal;
            if (percDiff < 0) {
                times = previousVal / currentVal;
            }
            if (times > -3 && times < 3) {
                percDiffStr = Math.round(times * 10) / 10 + " times ";
            } else {
                percDiffStr = Math.round(times) + " times ";
            }
        } else {
            percDiffStr = percDiff + "% ";
        }

        if (percDiff < 0) {
            percDiffStr = percDiffStr.substr(1) + " less ";
        } else {
            percDiffStr = percDiffStr + " more ";
        }

        comparatorLogic = " than in " + previousPeriod + " (" + dn.NumberWithCommas(previousVal) + ")";
    }

    if (previousVal > currentVal) {
        comparisonClass = cssNegative;
    } else if (previousVal < currentVal) {
        comparisonClass = cssPositive;
    }

    //    console.log("Percentage difference is: " + percDiff);
    return [percDiffStr, comparatorLogic, comparisonClass];
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    The filtering is based on the selections in the objsToFilter global array.
    One or two fields can be ignored from the filtering, which is critical so that the Sankey diagrams are effective ...
    listToFilter is an array of IDs and linked objects identifiers of this form - it is stored in a global variable called objsToFilter
    [ {ID:1234, Objs:[a,b,c]},...]
*/
DN.prototype.PreFilterData = function (objListToFilter, data, isAndOperation) {

    // For the or to work, we need at least two types of object
    if (isAndOperation === false) {
        let numObjs = 0;

        objListToFilter.forEach(function (v) {
            if (IsDefined(v.Objs) && v.Objs.length > 0) {
                numObjs++;
            }
        });

        if (numObjs < 2) {
            isAndOperation = true;
        }
    }

    //--3-- Refilter the data - IDs from the same chart should be filtered as OR and IDs from different charts should be filtered as AND ...
    // March 2019 - multivariate column charts are treated as AND, i.e. the intersection, as these are separate variables shown on the same chart...
    let localFilteredJSData = data.filter(function (v) {

        // The starting position for And is true, and it's false for OR...
        let foundDD = isAndOperation;

        for (let i = 0; i < objListToFilter.length; i++) { // faster than forEach
            let v1 = objListToFilter[i];

            //--4b-- Otherwise, we can get the value and then just use the array.prototype.find syntax.
            let tempVal = dn.GetValue(v1.ID, v);

            if (isAndOperation === true) {
                // using the array.prototype.find to find a value in an array ...
                foundDD = foundDD && (v1.Objs.length === 0 || IsDefined(dn.GetObjInList(v1.Objs, null, tempVal)));
            } else {

                // OR operation...
                if (foundDD === true) {
                    break;
                } else {
                    foundDD = (v1.Objs.length === 0 || IsDefined(dn.GetObjInList(v1.Objs, null, tempVal)));
                }

            }
        }

        // Then return this bool as this is the basis on which the filtering is conducted.
        return foundDD;
    });

    return localFilteredJSData;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
 * Another useful utility function to find objects in the given list of objects.
 * If paramName is null the paramValue is compared directly with the object.
 * If it is specified, paramValue is compared with that attribute
*/
DN.prototype.GetObjInList = function (listOfObjs, paramName, paramValue) {
    let obj = null;
    if (IsDefined(listOfObjs) && IsDefined(paramValue)) {

        if (IsDefined(paramName)) {
            obj = listOfObjs.find(x => x[paramName] === paramValue);
        } else {
            obj = listOfObjs.find(x => x === paramValue);
        }
    }
    return obj;
};


//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
DN.prototype.GetDataKeyFromIDString = function (dataIDStr, lookupList) {
    let tempID = 0;

    if (lookupList !== null) {
        // for() with a break clause is faster than forEach here ...
        for (let i = 0; i < lookupList.length; i++) {
            if (dataIDStr === lookupList[i].IDStr) {
                tempID = dn.SetNullToZero(lookupList[i].ID);
                break;
            }
        }
    }

    return tempID;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
DN.prototype.SetNullToZero = function (numVal) {
    // If not defined then set it to zero...
    return (IsDefined(numVal)) ? numVal : 0;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Gets e.g. the width or height from the style of the given object, but getting the attribute, removing "px" and casting to a number
DN.prototype.GetStyleDimension = function (obj, styleName) {
    let val = 0;

    if (IsDefined(obj) && IsDefined(styleName)) {
        val = +(obj.style(styleName).replace("px", ""));
    }

    return val;
};





//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    A group of chart objects - used to store the DNCharts and the common dataset and to organise the filtering of the data as the interactive visualisation is explored.
*/
function DNChartGroup(originalJSData) {

    // We prefer Open Sans but this has to be installed to work, so go with a generic font here
    this.defaultFont = "Trebuchet MS";

    // the transition in ms to give a nice animated feel to the dashboard.
    this.transitionMSDefault = 750;
    this.transitionMSWhilePlaying = 1;
    // defaultTransitionMS

    // the full dataset ...
    this.origJSData = originalJSData;
    // the filtered data ...
    this.filteredJSData = originalJSData;

    // A list of the DNCharts to be displayed interactively in this group
    this.charts = [];

    // an array of the two character chart IDs with sub arrays for the specific objects selected ...
    this.objsToFilter = [];
    /*  This is a list like this...
     {
        ID: graphicID,
        Objs: [valID]
      }
    */

    // Default list of objects to filter on... for stock figures.  This is a list of  chart IDs and the defaultValue of the form { ID:AA, DefaultVal:1234ABC}
    this.singleOptionDimension = null;
    // List of dimensions to pivot on (e.g. Population type, region of origin).  If the selected objects in these charts change, they cause all the other charts to be redrawn.
    this.pivotDimensions = null;

    // Aug-19 - The Other values - used to force the display of Other values to the end of the display list, even if the specific element is to be sorted by value
    this.otherValues = [ "Other" ];

    /**
     * A list of dynamically generated data attributes that would need to be recreated each time the dataset is built (or rebuilt in the case of STOCK datasets
     * - i.e. each time the data is filtered using a stock dimension)
     *  {
            SourceColumnID: sourceCol,
            TargetColumnID: targetCol,
            CountColumnID: countColID,
            MaxNumValues: maxNumValues,
            OtherID: otherID
        }
    */
    this.dynamicallyGeneratedDataAttributeList = [];
    // Could extend to include a function name to do the conversion from source to target.

    // The slider object - it's in the DN chart group as the animation affects all and resetAll needs to kill it!
    this.columnChartSlider = null;

    // The map object, if it exists.
    this.meep = null;
    this.mapMarkerList = {}; // no need for an array, it's a map of elements
    this.mapLabelLayerGroup = null;



    //-----------------------------------------------------------------------------------------------------------------------------------------------------
    // Nov-19 - Make the dropshadows configurable on the bar, column and pie charts
    this.showDropShadow = true;
    //-- FF bug - Set the appropriate CSS class for the dropshadows ...
    this.dropShadowCSS = (isFirefox || isMobile) ? "DropShadowCSS" : "DropShadowSVG";

    // The URL editor functions
    this.urlEditor = null; // new DNURLEditor();

}

//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChartGroup.prototype.Charts = function () {
    return this.charts;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChartGroup.prototype.AddChartToGroup = function (dnChart) {
    // Add this chart to the group of charts
    // Dec-19 - if this chart ID already exists, we want to replace it not add it...  This happens when resizing the dashboard with the new DrawResponsively method...
    if (IsDefined(this.charts)) {
        let chartExists = false;

        for (let i = 0; i < this.charts.length; i++) {
            if (this.charts[i].ChartID === dnChart.ChartID) {
                // We found it, so lets update it...
                this.charts[i] = dnChart;
                chartExists = true;
                break;
            }
        }

        if (!chartExists) {
            this.charts.push(dnChart);
        }
    }
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
//-- Extracts the list of objects to filter given a specific chart ID; the objectList provided is optional and the objsToFilter list will be used if not set
DNChartGroup.prototype.ObjectListToFilter = function (chartID, objectList) {

    let objList = null;

    // If the optional object list is not set, then use the build in list of filters
    if (!IsDefined(objectList)) {
        objectList = this.objsToFilter;
    }

    // loop through and extract the objects to filter
    if (IsDefined(objectList)) {
        let v = dn.GetObjInList(objectList, "ID", chartID);

        if (IsDefined(v)) {
            objList = v.Objs;
        }
    }

    return objList;
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Sets up the default list of objects to filter on.  This is used for stock figures.  This is a list of chart IDs and the defaultValue to be used for the form { ID:"YE", DefaultVal:1929}
DNChartGroup.prototype.SetSingleOptionDimension = function (chartID, defaultValue) {

    // Set the single option
    this.singleOptionDimension = {
        ID: chartID,
        DefaultVal: defaultValue
    };

    // then add it to the dimensions from the start ...
    // Dec-19 - with the responsive resizing of the charts - we need to check if the given chart ID exists already
    // Jan-20 XXX - lets try not doing this at all
    
    if (IsDefined(this.GetFilterParameters(chartID))) {
        for (let i = 0; i < this.objsToFilter.length; i++) {
            if (this.objsToFilter[i].ChartID === chartID) {
                this.objsToFilter[i].Objs = [defaultValue];
                break;
            }
        }
    } else {
        // Add it
        this.objsToFilter.push({
            ID: chartID,
            Objs: [defaultValue]
        });
    }
    
};
//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
 *  Note that this method compares first the chartID.
 *  The currentValue is only compared if it is not null (so set it to null if you just want to compare the chart IDs)...
*/
DNChartGroup.prototype.IsSingleOptionDimension = function (chartID, currentValue) {
    let isSOD = false;

    if (IsDefined(chartID) && IsDefined(this.singleOptionDimension)) {
        if (this.singleOptionDimension.ID === chartID) {
            if (IsDefined(currentValue)) {
                if (this.singleOptionDimension.DefaultVal === currentValue) {
                    isSOD = true;
                }
            } else {
                isSOD = true;
            }
        }
    }

    return isSOD;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
 *  Sets up the default list of objects to filter on.  This is used for stock figures.
 *  This returns the object from the list in the form { ID:"YE", Objs:[1,9,2]}
 */
DNChartGroup.prototype.GetFilterParameters = function (id) {

    let filterParams = null;

    for (let i = 0; i < this.objsToFilter.length; i++) {

        let tempFilters = this.objsToFilter[i];
        if (tempFilters.ID === id) {
            filterParams = tempFilters.Objs;
            break;
        }
    }

    return filterParams;
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Sets up the default list of objects to filter on.  This is used for stock figures.  This is a list of chart IDs with no additional attribution...
DNChartGroup.prototype.SetPivotDimensions = function (chartIDs) {

    // Set the list of pivot dimensions
    this.pivotDimensions = chartIDs;

};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Sets up the default list of objects to filter on.  This is used for stock figures.  This is a list of chart IDs and the defaultValue to be used for the form { ID:"YE", DefaultVal:1929}
DNChartGroup.prototype.IsPivotDimension = function (chartID) {

    // Check for this chart ID in the list of pivot dimension chart IDs
    return IsDefined(this.pivotDimensions) && this.pivotDimensions.length > 0 && IsDefined(dn.GetObjInList( this.pivotDimensions, null, chartID));

};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Identifies if the filters contain other dimensions - i.e. dimensions that are neither the single option dimension or the pivot dimensions.
DNChartGroup.prototype.ObjectsToFilterContainOtherDimensions = function () {

    for (let i = 0; i < this.objsToFilter.length; i++) {
        let obj = this.objsToFilter[i];
        // Only continue if the filter dimension contains some objects to filter on
        if (IsDefined(obj.Objs) && obj.Objs.length > 0) {

            if (obj.ID !== this.singleOptionDimension.ID && this.IsPivotDimension(obj.ID) === false) {
                return true;
            }
        }
    }

    return false;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Identifies if the filters contain dynamically generated data.
DNChartGroup.prototype.ObjectsToFilterContainDynamicDimensions = function () {

    if (IsDefined(this.dynamicallyGeneratedDataAttributeList) && this.dynamicallyGeneratedDataAttributeList.length > 0) {

        for (let i = 0; i < this.objsToFilter.length; i++) {
            let obj = this.objsToFilter[i];
            // Only continue if the filter dimension contains some objects to filter on
            if (IsDefined(obj.Objs) && obj.Objs.length > 0) {

                for (let j = 0; j < this.dynamicallyGeneratedDataAttributeList.length; j++) {
                    if (obj.ID === this.dynamicallyGeneratedDataAttributeList[j].TargetColumnID) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Sets the dropshadow css class to apply to the chart elements
DNChartGroup.prototype.SetDropShadow = function (doShow) {

    this.showDropShadow = doShow;

    //-- FF bug - Set the appropriate CSS class for the dropshadows ...
    this.dropShadowCSS = (isFirefox || isMobile) ? "DropShadowCSS" : "DropShadowSVG";

    if (IsDefined(doShow) && doShow === false) {
        this.dropShadowCSS = "DropShadowNone";
    }

};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
// The Other value - used to force the display of Other values to the end of the display list, even if the specific element is to be sorted by value
DNChartGroup.prototype.SetOtherValues = function (otherValueList) {
    this.otherValues = otherValueList;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// The dynamically generated data
DNChartGroup.prototype.AddDynamicallyGeneratedDataVariable = function (sourceColID, targetColID, countColID, maxNumValues, otherID) {

    // Could extend to include a function name to do the conversion from source to target.
    this.dynamicallyGeneratedDataAttributeList.push({
        SourceColumnID: sourceColID,
        TargetColumnID: targetColID,
        CountColumnID: countColID,
        MaxNumValues: maxNumValues,
        OtherID: otherID
    });
};
//-----------------------------------------------------------------------------------------------------------------------------------------------------
// We use the targetColID as the primary key as in theory the source could be the source for more than one columns, 
// but it can't logically follow that a target column could have more than source, as it would just be reset.
DNChartGroup.prototype.SetDynamicallyGeneratedDataAttribute = function (targetColID, attrName, attrValue) {

    if (IsDefined(this.dynamicallyGeneratedDataAttributeList)) {
        let ddObj = dn.GetObjInList(this.dynamicallyGeneratedDataAttributeList, "TargetColumnID", targetColID);
        // If it exists, lets set it
        if (IsDefined(ddObj)) {
            ddObj[attrName] = attrValue;
        }
    }
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
//-- Clears all the nicely shaded pink selected options ....
DNChartGroup.prototype.ClearSelected = function () {
    // clear all the currently selected filters ...
    this.objsToFilter.forEach(function (v1) {
        v1.Objs.forEach(function (v2) {
            d3.select("#" + v1.ID + "_" + v2 + "_3").style("display", "none");
        });
    });
    // and then reset the filters themselves!
    this.objsToFilter = [];
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChartGroup.prototype.ResetAll = function () {
    // Stop the bar chart slider playing if it is currently playing
    if (IsDefined(this.columnChartSlider)) {
        this.columnChartSlider.StopPlaying();
        // Aug-19 - different default options for STOCK visualisations
        if (IsDefined(this.singleOptionDimension)) {
            this.columnChartSlider.Range(0, 1);
        } else {
            this.columnChartSlider.Range(this.columnChartSlider.defaultRange.begin, this.columnChartSlider.defaultRange.end);
        }

    }

    // If there is a map then recentre and relocate it and set its standard zoom
    if (IsDefined(this.meep)) {
        this.ResetMap();
    }

    // Clear the currently selected objects and refilter the data
    this.ClearSelected();

    // Apr-2019 - if the single option dimension is set, then lets use it ...
    if (IsDefined(this.singleOptionDimension)) {

        this.DoFilter(this.singleOptionDimension.ID + "_" + this.singleOptionDimension.DefaultVal, true);
    } else {

        this.DoFilter(null, true);
    }
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// filter the overarching dataset - the objectID will be a two character chartID, then the specific itemID e.g. SE123
// doReset is true if this a reset.
DNChartGroup.prototype.DoFilter = function (objID, doReset) {

    console.log("DoFilter - " + objID);

    // set the chart group object
    let cg = this;
    // used to record the chart ID
    let graphicID = "";

    // This gets the particular graphic of interest ...
    // Aug-19 - changed this logic round so we pivot on whether the object id is there, rather than whether this is a reset.
    if (IsDefined(objID) && objID !== "") {

        //--1-- Get the chart ID and the object ID ...
        graphicID = objID.substring(0, 2);
        // March 2019 - Why does the object ID filters have a max length of 10 characters?  Updated so that this can be any length for more flexibility
        let valID = objID.substring(3, objID.length);
        //let valID = objID.substring(3, 10);

        // Sep-19 - Use regexp to see if this is a number, and if it is lets parse it as such...
        if (/^\d+$/.test(valID) === true) {
            valID = +valID;
        }


        // Hmmmm!  It's never that easy right!  The logic of this method with the Multi Filter is actually different - the list of objects here has to contain the ones to keep.
        // So get the current list for this specific graphic ID
        let currentList = cg.ObjectListToFilter(graphicID, null);
        // Then look for our object in that list
        let foundObj = false;

        // Set the current list to an empty array if it does not yet exist, or if this is a stock single option dimension visualisation.
        if (!IsDefined(currentList)) {
            currentList = [];
        } else {
            foundObj = IsDefined(dn.GetObjInList( currentList, null, valID));
        }

        // if it existed, then remove it, otherwise add it; and a special case for single option dimensions, we toggle off the previously selected option and reset the value to be the selected element ID
        if (IsDefined(cg.singleOptionDimension) && cg.singleOptionDimension.ID === graphicID) {
            this.ToggleSelected(graphicID, currentList[0]);
            currentList = [valID];

        } else if (foundObj === true) {
            // Filter the list to remove the given element ID
            currentList = currentList.filter(function (value, index, arr) {
                return value !== valID;
            });

        } else {
            // Add the given element ID
            currentList.push(valID);
        }

        //--2-- store the object IDs in an array of object IDs ... Sep-19 Updated this to use a method...
        cg.UpdateObjectIDsToFilter(graphicID, currentList, false);

        //--3-- Refilter the data - IDs from the same chart should be filtered as OR and IDs from different charts should be filtered as AND ...
        // WARNING - at this stage the filtered data will be potentially WRONG for dynamically generated data as this has not yet been regenerated
        cg.filteredJSData = cg.GetFilteredData(null); //, null);

        //--4-- July-2018 - and show / hide the bright pink toggle option for the selected element ID
        cg.ToggleSelected(graphicID, valID);

    } else {
        //--5-- Otherwise - there is no filtering to be done, so we just replace the filtered data with the original JS data
        cg.filteredJSData = cg.origJSData;
    }

    //-----6----- And then apply the filtered data to the visualisation
    cg.ApplyFilter(graphicID, doReset, false);

};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Filter the overarching dataset, based on multiple selections from a specific chart  - useful for e.g. the slider on bar charts
*/
DNChartGroup.prototype.DoMultiFilter = function (chartID, objIDList) {

    //-----1----- Only continue if we have a chart ID and object ID list
    if (IsDefined(chartID) && IsDefined(objIDList)) {

        //-----2----- Iterate through the charts and objects selected and update the selected objects for this chart.
        this.UpdateObjectIDsToFilter(chartID, objIDList, true);

        //-----3----- Refilter the data - IDs from the same chart should be filtered as OR and IDs from different charts should be filtered as AND ...
        this.filteredJSData = this.GetFilteredData(null); //, null);

        //-----4----- And then apply the filtered data to the visualisation
        this.ApplyFilter(chartID, false, false);

    }
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Once the filtered dataset has been updated, this method can be called to apply the new filtered data to the charts, including setting the summary,
    redrawing the charts that need it if this visualisation contains stock or pivot dimensions, then updating the charts and updating the URL.
    If ignoreURLUpdate is set to true, the URL will not be updated - this is required if e.g. the user is navigating back...
 */
DNChartGroup.prototype.ApplyFilter = function (activeChartID, doReset, forceGhosting, ignoreURLUpdate) {

    //-----1----- If this is a Stock visualisation and the stock dimension or pivot dimensions have changed, then lets redraw the visualisation using the defaults
    this.RedrawAllCharts(activeChartID, doReset, forceGhosting);

    //-----2----- Lets refresh all the charts!
    this.UpdateAllCharts();

    //-----3----- Set the summary figures - Dec-19 - we are setting this after the two methods above now as the data cube was not filtered right it seems.
    SetSummary();

    //-----4----- Lastly, then lets update the URL with the list of current filters (Dec-19 - converted this into a separate class)
    if (IsDefined(this.urlEditor) && (!IsDefined(ignoreURLUpdate) || ignoreURLUpdate === false)) {
        this.urlEditor.URLUpdate(this.objsToFilter, this.charts);
    }

};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
 *  Gets a cloned copy of the object IDs to filter (objsToFilter) metadata
 *  Used in DoFilter and DoMultiFilter to update the objsToFilter list
 */
DNChartGroup.prototype.GetObjectIDsToFilter = function () {

    let theList = this.objsToFilter;

    return this.CloneObjectIDsToFilter(theList);
};
//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
 *  Does a deep copy of the object IDs to filter (objsToFilter) metadata
 *  Used in DoFilter and DoMultiFilter to update the objsToFilter list
 */
DNChartGroup.prototype.CloneObjectIDsToFilter = function (theList) {

    // We do a deep copy as messing with this can lead to very unexpected results ...
    let clonedOTF = [];
    for (let i = 0; i < theList.length; i++) {

        let id = theList[i].ID;
        let objList = [];

        if (IsDefined(theList[i].Objs)) {
            for (let j = 0; j < theList[i].Objs.length; j++) {
                objList.push(theList[i].Objs[j]);
            }
        }

        clonedOTF.push({ ID: id, Objs: objList });
    }

    return clonedOTF;
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
 *  There are instances where selected elements of parameters with small values are consumed into the other category
 *  of dynamic data values.  For these, in order for them to be filtered and displayed, we need to search the source IDs.
 *  This method just goes through the given list of objectIDsToFilter and replaces any dynamically generated parameters
 *  with the originals.  (e.g. Country of origin on the PoCs visualisation)
 */
DNChartGroup.prototype.AddDynamicVariablesInObjectIDsToFilter = function (objListToFilter) {

    //--01-- Clone the object list - note there are some cases, like in SetSummary where the object list provided will not be the current one stored in the chart group
    // e.g. When doing a comparison with the previous year in SetSummary
    let clonedObjsToFilter = this.CloneObjectIDsToFilter(objListToFilter);
//    let foundAtLeastOneDynamicDimension = false;

    //--02-- Look for any dynamic variables, replace the target variable ID with the source variable ID
    for (let i = 0; i < clonedObjsToFilter.length; i++) {
        let v = clonedObjsToFilter[i];

        let dynamicDimensionObj = dn.GetObjInList(this.dynamicallyGeneratedDataAttributeList, "TargetColumnID", v.ID);

        v.DDID = null;
        v.IsDD = false;

        if (IsDefined(dynamicDimensionObj)) {
            // Update it with the source column ID....
            v.DDID = dynamicDimensionObj.SourceColumnID;
            v.IsDD = true;
//            foundAtLeastOneDynamicDimension = true;
        }
    }

//    return { foundAtLeastOneDynamicDimension, clonedObjsToFilter};
    return clonedObjsToFilter;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Used in DoFilter and DoMultiFilter to update the objsToFilter list
DNChartGroup.prototype.UpdateObjectIDsToFilter = function(chartID, objIDList, doToggleSelected) {

    //-----0------
    doToggleSelected = (! IsDefined(doToggleSelected)) ? false : doToggleSelected;

    //-----1----- Only continue if we have a chart ID and object ID list
    if (IsDefined(chartID) && IsDefined(objIDList)) {

        //-----2----- Iterate through the charts and objects selected and update the selected objects for this chart.
        let foundGraphic = false;
        let v = dn.GetObjInList(this.objsToFilter, "ID", chartID);

        if (IsDefined(v)) {

            foundGraphic = true;

            ///////////////////////////////////////////////////// WHERE TO PUT THIS IN THIS CONTEXT????  This ensures that the single option dimension remains singular.
            if (IsDefined(this.singleOptionDimension) && this.singleOptionDimension.ID === v.ID) {
                // Do nothing for now
            }

            // Step 1 - Go through the existing list and remove any that are no longer selected
            for (let j = 0; j < v.Objs.length; j++) {
                let objID = v.Objs[j];

                let foundObj = IsDefined(dn.GetObjInList(objIDList, null, objID));
                if (foundObj === false) {
                    v.Objs.splice(j, 1);

                    // Toggle the visualisation if needed
                    if (doToggleSelected === true) {
                        this.ToggleSelected(chartID, objID);
                    }
                }
            }

            // Step 2 - Go through the new list and add any that are not currently selected
            for (let j = 0; j < objIDList.length; j++) {
                let objID = objIDList[j];

                let foundObj = IsDefined(dn.GetObjInList(v.Objs, null, objID));
                if (foundObj === false) {
                    v.Objs.push(objID);

                    // Toggle the visualisation if needed
                    if (doToggleSelected === true) {
                        this.ToggleSelected(chartID, objID);
                    }
                }
            }
        }

        //-----3----- if the chart does not yet have any selections, then add them all here
        if (foundGraphic === false) {
            this.objsToFilter.push({
                ID: chartID,
                Objs: objIDList
            });

            // Toggle the visualisation if needed
            if (doToggleSelected === true) {
                for (let i = 0; i < objIDList.length; i++) {
                    this.ToggleSelected(chartID, objIDList[i]);
                }
            }
        }
    }

};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    If any dynamically generated data variables are requested then this regenerates them in the filtered data in the data cube.
    NB - FILTER THE DATA FIRST!!!  This is used in a specific context with data filtered in a certain way - review the RedrawAllCharts method.
    This needs to be based on the full data available for specific years.
*/
DNChartGroup.prototype.DynamicallyGenerateData = function () {

        //--1-- if we have any dynamically generated data attributes, lets loop through them and apply them
    if (IsDefined(this.dynamicallyGeneratedDataAttributeList) && this.dynamicallyGeneratedDataAttributeList.length > 0) {
        for (let i = 0; i < this.dynamicallyGeneratedDataAttributeList.length; i++) {

            //--2-- Pull out the data attribute info
            let dataAtt = this.dynamicallyGeneratedDataAttributeList[i];

            //--3-- Generate the summary data for the source attribute from the filtered data (essentially a group by command looking at the largest values)
            // Therefore, it's essential that the data is filtered before this.
            let summaryData = this.GetInfo2DFlex(dataAtt.SourceColumnID, null, this.filteredJSData, true, dataAtt.MaxNumValues, dataAtt.CountColumnID);

            //--4-- iterate through the filtered data and set the new column, using the otherID in the data attribute to fill in the other data.
            for (let j = 0; j < this.filteredJSData.length; j++) {
                let sourceObj = this.filteredJSData[j];

                // Start with the other value
                let val = dataAtt.OtherID;
                // Try to find one of the summary values
                let obj = dn.GetObjInList(summaryData, "ID", sourceObj[dataAtt.SourceColumnID]);
                if (IsDefined(obj) && IsDefined(obj.ID)) {
                    val = obj.ID;
                }

                this.filteredJSData[j][dataAtt.TargetColumnID] = val;
            }

            //--5-- iterate through the original data and set the new column, using the otherID in the data attribute to fill in the other data.
            for (let j = 0; j < this.origJSData.length; j++) {
                let sourceObj = this.origJSData[j];

                // Start with the other value
                let val = dataAtt.OtherID;
                // Try to find one of the summary values
                let obj = dn.GetObjInList(summaryData, "ID", sourceObj[dataAtt.SourceColumnID]);
                if (IsDefined(obj) && IsDefined(obj.ID)) {
                    val = obj.ID;
                }
                this.origJSData[j][dataAtt.TargetColumnID] = val;
            }

        }
    }
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Filter the overarching dataset, based on multiple selections from a specific chart  - useful for e.g. the slider on bar charts
*/
DNChartGroup.prototype.ToggleSelected = function (chartID, objID, forceToDisplay) {

    // if this is a map, do nothing as there are no pink toggley bits to update.
    let isMap = IsDefined( this.charts.find(x => (x.ChartID === chartID && x.ChartType === 500)));

    if (isMap === false) {
        let chartEle = d3.select("#" + chartID + "_" + objID + "_3");

        // Only try to set it if the chart element is not null and not empty.
        if (IsDefined(chartEle) && chartEle.empty() === false) {
            // July-2018 - and show / hide the bright pink toggle option
            let currentStyle = chartEle.style("display");
            // Note that d3 will change the empty style to be inline ......
            currentStyle = (currentStyle === "none") ? "" : "none";

            // Force the current element to display ...
            if (IsDefined(forceToDisplay) && forceToDisplay === true) {
                currentStyle = "";
            }

            chartEle.style("display", currentStyle);
        }
    }
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    The filtering is based on the selections in the objsToFilter global array.
    dataVariablesToIgnore - A list of fields/variables that can be ignored from the filtering, which is critical so that the Sankey diagrams are effective ...
*/
DNChartGroup.prototype.GetFilteredData = function (dataVariablesToIgnore) { //dataFieldToIgnore1, dataFieldToIgnore2) {

    // The this key word changes context inside a forEach loop, therefore we need to set this reference to the DNChartGroup here.  It avoids the error with the call to objsToFilter.forEach below...
    let objsToFilter = this.objsToFilter;

    return this.GetFilteredDataBase(objsToFilter, dataVariablesToIgnore); //dataFieldToIgnore1, dataFieldToIgnore2);
};
//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Jan-2020 - Added an additional step in the filtering - if there are dynamic dimensions with relatively small numbers for certain stock dimensions,
    they way well be bundled into an other category, which would not be found by the filtering.
    The fix is to switch the filtering for the dynamic dimensions to use the source column
*/
DNChartGroup.prototype.GetFilteredDataBase = function (objListToFilter, dataVariablesToIgnore) { // dataFieldToIgnore1, dataFieldToIgnore2) {

    //--01-- Lets check each selected data variable in the list of  selected variables to see whether they are dynamic attributes...
    let clonedObjListToFilter = this.AddDynamicVariablesInObjectIDsToFilter(objListToFilter);

    //--02-- Then lets do the filtering on this basis...
    return this.DoDataFiltering(clonedObjListToFilter, dataVariablesToIgnore);

};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    The filtering is based on the selections in the objsToFilter global array.  
    Independent variables are filtered as AND, elements within the same variable are filtered as OR.
    For dynamic dimensions, a special case exists where we include both the source and target of dynamic dimensions as OR.
    One or two fields can be ignored from the filtering, which is critical so that the Sankey diagrams are effective ...
    listToFilter is an array of IDs and linked objects identifiers of this form - it is stored in a global variable called objsToFilter
    [ {ID:1234, Objs:[a,b,c]},...]
*/
    DNChartGroup.prototype.DoDataFiltering = function (objListToFilter, dataVariablesToIgnore) { //dataFieldToIgnore1, dataFieldToIgnore2) {

    let charts = this.charts;
        
    //--00-- Refilter the data using the original data - IDs from the same chart should be filtered as OR and IDs from different charts should be filtered as AND ...
    // March 2019 - multivariate column charts are treated as AND, i.e. the intersection, as these are separate variables shown on the same chart...
    let localFilteredJSData = this.origJSData.filter(function (v) {
        // Innocent until proven guilty!
        let foundDD = true;

        // Now we loop through the selected filters and check these against this data row
        for (let i = 0; i < objListToFilter.length; i++) {
            let v1 = objListToFilter[i];

            //--01-- See whether or not we need to include this data variable in the filtering.
            let doFilterDataVariable = !IsDefined(dataVariablesToIgnore) || !IsDefined(dn.GetObjInList(dataVariablesToIgnore, null, v1.ID));

            if (doFilterDataVariable) {
                //--02-- March 2019 - check if this is a multi variate column chart.  If so, we actually want the valID to become the "graphic ID"
                let isMultiVariate = IsDefined(charts.find(x => (x.ChartID === v1.ID && x.ChartType === 700)));

                if (isMultiVariate === true) {
                    //--03-- If this is multivariate, we select based on all the selected object IDs are set to 1
                    // Note that this is hard coded so that the value we are looking for is always 1...
                    for (let j = 0; j < v1.Objs.length; j++) {
                        foundDD = foundDD && (dn.GetValue(v1.Objs[j], v) === 1);
                    }

                } else {
                    //--04-- Otherwise, we can get the value and then just use the array.prototype.find syntax.
                    let tempFound = (v1.Objs.length === 0 || IsDefined(dn.GetObjInList(v1.Objs, null, dn.GetValue(v1.ID, v))));

                    // Jan-20 - if this is dynamic data, lets check here on the source data too (it's like an extended OR)
                    if (v1.IsDD && tempFound === false) {
                        tempFound = IsDefined(dn.GetObjInList(v1.Objs, null, dn.GetValue(v1.DDID, v)));
                    }

                    foundDD = foundDD && tempFound;
                }
            }
        }

        // Then return this bool as this is the basis on which the filtering is conducted.
        return foundDD;
    });

    return localFilteredJSData;
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChartGroup.prototype.SetFilteredData = function (newData) {
    this.filteredJSData = newData;
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Gets the information summary for a specific chart, effectively a group by function based on one or two given colToCount
    Output: Produces an array of ID and Count objects
    OR Output: Produces a nested array of keys with a sub array of keys and values

    12-May-16 - added maxValues, which enables the number of values to be displayed to be limited. Note that the array of information is strimmed AFTER the sorting ...
    This makes the longer lists of values much easier to view.
*/
DNChartGroup.prototype.GetInfo2DFlex = function (colToCount1, colToCount2, dataCube, sortByValue, maxNumValues, colToSum) {

    let summaryArray = [];
    let summaryArrayOther = [];
    let otherValues = this.otherValues;

    //--1-- Do the filter using either one or two dimensions...
    if (! IsDefined(colToCount2) || colToCount2 === "") {
        // d3.nest will produce something like {"3001": {"2001" : 13000}} using .object, but .entries is more useful for us and produces this nested summary:
        // [{"key":"3006","values":[{"key":"2011","value":0},{"key":"2005","value":943} ...
        // Nest always creates IDs that are string values: https://stackoverflow.com/questions/41579465/d3-nest-turns-key-into-string-value - they are coerced into strings
        let summaryData = d3.nest()
            .key(function (d) { return dn.GetValue(colToCount1, d); })
            .rollup(function (v) {
                return d3.sum(v,
                    function (d) {
                        if (IsDefined(colToSum) && colToSum !== "") {
                            return d[colToSum];
                        } else {
                            return d.Count;
                        }
                    });
            })
            .entries(dataCube);


        // now we need to structure it in an array so that we can sort it..
        for (let i = 0; i < summaryData.length; i++) { // faster than forEach
            let v = summaryData[i];

            // Sep-19 test whether the keys are numeric and parse if so
            if (/^\d+$/.test(v.key) === true) {
                // found a number - so converting it...
                v.key = +v.key;
            }

            // Creates { "ID1":211,"ID2":302,"Count":23232 }, where ID1 is the source and ID2 is the target
            if (IsDefined(otherValues) && otherValues.length > 0 && IsDefined(dn.GetObjInList( otherValues, null, v.key))) {
                summaryArrayOther.push({
                    ID: v.key,
                    Count: v.value
                });
            } else {
                summaryArray.push({
                    ID: v.key,
                    Count: v.value
                });
            }
        }

    } else {
        // d3.nest will produce something like {"3001": {"2001" : 13000}} using .object, but .entries is more useful for us and produces this nested summary:
        // [{"key":"3006","values":[{"key":"2011","value":0},{"key":"2005","value":943} ...
        summaryData = d3.nest()
            .key(function (d) { return dn.GetValue(colToCount1, d); })
            .key(function (d) { return dn.GetValue(colToCount2, d); })
            .rollup(function (v) {
                return d3.sum(v, function (d) {
                    if (IsDefined(colToSum) && colToSum !== "") {
                        return d[colToSum];
                    } else {
                        return d.Count;
                    }
                });
            })
            .entries(dataCube);

        // now we need to structure it in an array so that we can sort it..
        for (let i = 0; i < summaryData.length; i++) {
            let v1 = summaryData[i];

            // Sep-19 test whether the keys are numeric and parse if so
            if (/^\d+$/.test(v1.key) === true) {
                // found a number - so converting it...
                v1.key = +v1.key;
            }

            for (let j = 0; j < v1.values.length; j++) { // faster than forEach
                let v2 = v1.values[j];

                // Sep-19 test whether the keys are numeric and parse if so
                if (/^\d+$/.test(v2.key) === true) {
                    // found a number - so converting it...
                    v2.key = +v2.key;
                }

                // Creates { "ID1":211,"ID2":302,"Count":23232 }, where ID1 is the source and ID2 is the target
                if (IsDefined(otherValues) && otherValues.length > 0 &&
                    (IsDefined(dn.GetObjInList(otherValues, null, v1.key)) || IsDefined(dn.GetObjInList(otherValues, null, v2.key)))) {

                    summaryArrayOther.push({
                        ID1: v1.key,
                        ID2: v2.key,
                        Count: v2.value
                    });
                } else {
                    summaryArray.push({
                        ID1: v1.key,
                        ID2: v2.key,
                        Count: v2.value
                    });
                }
            }
        }
    }

    //--2-- Sort the data
    summaryArray = summaryArray.sort(dn.GetSortFunction(sortByValue));

    //--3-- Aug-19 insert the "others" list - by doing this we force them to appear at the end, which looks more useful.
    summaryArray.push.apply(summaryArray, summaryArrayOther);

    //--4-- Slice the data to just include the first few values, if required ...
    if (IsDefined(maxNumValues) && maxNumValues > 0 && summaryArray.length > maxNumValues) {
        summaryArray = summaryArray.slice(0, maxNumValues);
    }

    if (summaryArray.length > 0 && summaryArray.length === dataCube.length) {
        console.log("dn.js - GetInfo2DFlex - the input and output summary data are the same length which is unusual ("
            + dataCube.length + " versus " + summaryArray.length + ") - check that the inputs are correct ", colToCount1, colToCount2, dataCube);
    }

    return summaryArray;
};
//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Wrapper to make the function easier to handle
DNChartGroup.prototype.GetInfo2D = function (colToCount1, colToCount2) {

    // The this key word changes context inside a forEach loop, therefore we need to set this reference to the DNChartGroup here
    let cg = this;
    // We need to set some reasonable defaults
    let sortByValue = false;
    let maxNumValues = 0;
    let colToSum = "";

    // Get the sorting, max number of values and column to sum from the global list of charts
    let c = dn.GetObjInList(cg.charts, "ChartID", colToCount1);
    if (IsDefined(c)) {
        sortByValue = c.SortByValue;
        maxNumValues = c.MaxNumValues;
        colToSum = c.ColToSum;
    }

    return cg.GetInfo2DFlex(colToCount1, colToCount2, cg.filteredJSData, sortByValue, maxNumValues, colToSum);
};
//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Simple wrapper to make it easier to call ...
DNChartGroup.prototype.GetInfo1D = function (colToCount1) {
    // The this key word changes context inside a forEach loop, therefore we need to set this reference to the DNChartGroup here
    let cg = this;
    return cg.GetInfo2D(colToCount1, null);
};
//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Simple wrapper to make it easier to call and this one forces the key to be numeric
DNChartGroup.prototype.GetInfoIDNumericKey = function (colToCount1) {
    // The this key word changes context inside a forEach loop, therefore we need to set this reference to the DNChartGroup here
    let cg = this;
    let data = cg.GetInfo2D(colToCount1, null);
    if (IsDefined(data) && data.length > 0) {
        for (let i = 0; i < data.length; i++) {
            let num = +data[i].ID;
            data[i].ID = num;
        }
    }
    return data;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Gets the information summary for a multi variate chart ("N Dimensions), in which each of the column names provided contains numeric values that can be summed.
    Output: Produces an array of ID and Count objects
    Added March 2019
    The namesList is the list of objects containing the relevant IDs and Titles ...
*/
DNChartGroup.prototype.GetInfoND = function (namesList) {

    let summaryArray = [];

    //--0-- Get the data
    let cg = this;
    let dataCube = cg.filteredJSData;

    //--1-- Do the filter using either one or two dimensions...
    if (IsDefined(namesList)) {

        for (let i = 0; i < namesList.length; i++) {

            let colID = namesList[i].ID;

            let tempTotal = d3.sum(dataCube, function (d) { return d[colID]; });

            summaryArray.push({
                // { "Source":211,"Target":"302","Count":"23232" },
                ID: colID,
                Count: tempTotal
            });

        }

        //--2-- Sort the data - always by value
        summaryArray = summaryArray.sort(dn.GetSortFunction(true));
    }

    return summaryArray;
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    SankeyifyData - Creates a JSON like structure with an object with a list of links and a list of nodes, which is consumed by the DrawSankey code
    The values for the elements in this chart MUST BE NUMERIC currently
*/
DNChartGroup.prototype.SankeyifyData = function (chartID, useFilteredData) {

    // This is the output and it will store the links and nodes.
    let obj = {};
    obj.nodes = [];
    obj.links = [];

    //-----00----- Set all the relevant variables from the global parameters stored in the chart object
    // Lets get the chart and assign the parameters
    let c = dn.GetObjInList(this.charts, "ChartID", chartID);
    // If the chart is not defined lets exit from here very quickly
    if (!IsDefined(c)) {
        console.error("dn.js - SankeyifyData - Fatal error building the Sankey JSON.  Could not find the chart definition for ID ", chartID);
        return obj;
    }
    // So lets define locally what we need
    let listSource = c.Names1;
    let listTarget = c.Names2;
    let colourRampSource = c.ColourRamp1;
    let colourRampTarget = c.ColourRamp2;
    let sourceChartID = c.SourceChartID;
    let targetChartID = c.TargetChartID;
    let sortByValue = c.SortByValue;


    //-----01----- First identify if any filtering is being conducted by seeing if any objects have been selected from either the source or target lists
    let sourceVals = [];
    let targetVals = [];

    this.objsToFilter.forEach(function (v) {
        if (v.ID === sourceChartID) {
            sourceVals = v.Objs;
        } else if (v.ID === targetChartID) {
            targetVals = v.Objs;
        }
    });

    // We need to check if any if the input or output nodes have been filtered as we will need to update the style accordingly
    let isFiltering = (sourceVals.length > 0 || targetVals.length > 0);

    //--02-- The Sankey needs specific filtering in the core GetFilteredDataBase method.  We need to exclude the source and target variables from the filter
    let dataVariablesToIgnoreWhenFiltering = [sourceChartID, targetChartID];

    //--03-- Dynamic dimensions - if the Sankeys are displaying dynamic dimensions (which probably have a catch-all Other group), we need to:
    // a. Also exclude the variables that were used to produce the dynamic data
    // b. Check to see if the other element has been selected - if it has we are fine, otherwise we need to check the original data used to produce the dynamic data and include this in the other bracket
    // e.g. The user selects "East Africa", then "Zimbabwe", then removes the selection of "East Africa".  Zimbabwe will not be included explicitly in the Sankey, but we need to include it implicityly in the Other group
    let ddObjSource = null;
    let ddObjTarget = null;
    let otherSourceIsSelected = false;
    let otherTargetIsSelected = false;
    if (isFiltering) {
        //-CHECK 1- See if we are dealing with dynamic data
        ddObjSource = dn.GetObjInList(this.dynamicallyGeneratedDataAttributeList, "TargetColumnID", sourceChartID);
        if (IsDefined(ddObjSource)) {
            dataVariablesToIgnoreWhenFiltering.push(ddObjSource.SourceColumnID);
            otherSourceIsSelected = IsDefined(dn.GetObjInList(sourceVals, null, ddObjSource.OtherID));
        }
        ddObjTarget = dn.GetObjInList(this.dynamicallyGeneratedDataAttributeList, "TargetColumnID", targetChartID);
        if (IsDefined(ddObjTarget)) {
            dataVariablesToIgnoreWhenFiltering.push(ddObjTarget.SourceColumnID);
            otherTargetIsSelected = IsDefined(dn.GetObjInList(targetVals, null, ddObjTarget.OtherID));
        }
    }


    //-----04a------ Get the original or the filtered data; Note that the "original" data may not be the original data as such e.g. for visualisations with a Stock dimension (a single option)
    // If we are to use the filtered data, this will produce a specific summary just with our source and target chart IDs
    // For this chart we want to ignore selections from the source or target fields
    let sankeyData = (useFilteredData === true)
        // This is the only use case where these IDs are even passed!!
        ? this.GetFilteredData(dataVariablesToIgnoreWhenFiltering)
        : this.origJSData;

    //-----04b----- Summarise the filtered data as a 2D list of source, target and values
    // First, lets create the summary data, based on a 2D filter
    let summaryData = this.GetInfo2DFlex(sourceChartID, targetChartID, sankeyData, sortByValue, 0, "");

    //-----04c----- Check if this link between the source and target is included in the filtering (if filtering is active) - we will highlight these on the Sankey
    // There are three states: 0 means no filtering, 1 means not selected for filtering and 2 means selected for filtering
    summaryData = summaryData.map(v => {
        let toBeHighlighted = 0;
        if (isFiltering) {
            toBeHighlighted = (sourceVals.length === 0 || IsDefined(dn.GetObjInList(sourceVals, null, v.ID1)))
                && (targetVals.length === 0 || IsDefined(dn.GetObjInList(targetVals, null, v.ID2)))
                ? 2 : 1;
        }
        v.IsFiltered = toBeHighlighted;
        return v;
    });

    //-----05a----- Dynamic data special case!  Then if (1) there is dynamic data and (2) the source other ID is not selected, lets get a filter relating to that and see if there are missing values ...
    summaryData = this.AppendDynamicDataToSankeyLinks(sourceChartID, targetChartID, sourceVals, summaryData, ddObjSource, otherSourceIsSelected, "ID1", sortByValue);
    //-----05b----- And now do the same for the target, id needed
    summaryData = this.AppendDynamicDataToSankeyLinks(sourceChartID, targetChartID, targetVals, summaryData, ddObjTarget, otherTargetIsSelected, "ID2", sortByValue);

    //-----06----- LINKS - Create the list of links
    // Now create the links from this summary data
    for (let i = 0; i < summaryData.length; i++) {
        let v1 = summaryData[i];
        // Ignore zero values
        if (v1.Count > 0) {
            // Now append the info to the list of links
            obj.links.push({
                source: v1.ID1,
                target: v1.ID2,
                value: v1.Count,
                IsFiltered: v1.IsFiltered
            });
        }
    }


    //-----07----- Filter the links data to create the summary data for the source and target nodes
    // So now we know the total count for each pair of source and target objects, which is stored in the links.  We also know from this whether or not it should be included in the filtered total
    // So we can create four summary views of the links data, two for each of the source and target IDs, both with the total and the filtered data
    let sourceData = this.GetInfo2DFlex("source", null, obj.links, sortByValue, 0, "value");
    let targetData = this.GetInfo2DFlex("target", null, obj.links, sortByValue, 0, "value");

    // And then our filtered data
    let tempFilteredData = obj.links.filter(d => d.IsFiltered === 2);
    let filteredSData = dn.GroupByAndSummarise(tempFilteredData, "source", "value");
    let filteredTData = dn.GroupByAndSummarise(tempFilteredData, "target", "value");


    //-----08a----- NODES: And now lets create our nodes - starting with the source nodes
    for (let i = 0; i < sourceData.length; i++) {
        let v = sourceData[i];
        let keyNum = +v.ID;
        // Aug-19 - Ignore zero values
        if (v.Count > 0) {
            let filteredCount = (IsDefined(filteredSData[keyNum])) ? filteredSData[keyNum] : 0;
            // Note - the count is reintroduced by the sankey magic, so we dont need to include the default count
            obj.nodes.push({
                ID: keyNum,
                ChartID: sourceChartID,
                Name: dn.GetTitleFromObj(keyNum, listSource),
                Colour: colourRampSource[i],
                CountFiltered: filteredCount,
                IsFiltering: isFiltering
            });
        }
    }
    //-----08b----- And now the target nodes
    for (let i = 0; i < targetData.length; i++) {
        let v = targetData[i];
        let keyNum = +v.ID;
        // Aug-19 - Ignore zero values
        if (v.Count > 0) {
            let filteredCount = (IsDefined(filteredTData[keyNum])) ? filteredTData[keyNum] : 0;
            // Note - the count is reintroduced by the sankey magic, so we dont need to include the default count
            obj.nodes.push({
                ID: keyNum,
                ChartID: targetChartID,
                Name: dn.GetTitleFromObj(keyNum, listTarget),
                Colour: colourRampTarget[i],
                CountFiltered: filteredCount,
                IsFiltering: isFiltering
            });
        }
    }

    // All good we hope, lets send it out
    return obj;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChartGroup.prototype.AppendDynamicDataToSankeyLinks = function (sourceChartID, targetChartID, filteredVals, summaryData, ddObj, otherElementIsSelected, idColName, sortByValue) {

    //-----05a----- Dynamic data special case!  Then if (1) there is dynamic data and (2) the source other ID is not selected, lets get a filter relating to that and see if there are missing values ...
    if (IsDefined(ddObj) && !otherElementIsSelected) {
        // See of there are any missing values by getting a unique list of the source (and target) chart IDs, and then difference this with the list of the source vals from the objsToFilter list...
        // More specifically, lets reduce the filtered data to a unique list of source IDs by first mapping it to extract the specific column, and then filtering to remove duplicates
        let uniqueIDs = dn.Unique(summaryData.map(x => x[idColName]));
        let missingVals = filteredVals.filter(x => !uniqueIDs.includes(x));

        // If we have missing values, we want to filter the whole dataset, summarise the data again and then append these to the summary data
        if (IsDefined(missingVals) && missingVals.length > 0) {

            let additionalSankeyData = this.filteredJSData.filter(d => IsDefined(dn.GetObjInList(missingVals, null, d[ddObj.SourceColumnID])));
            let additionalSummaryData = this.GetInfo2DFlex(sourceChartID, targetChartID, additionalSankeyData, sortByValue, 0, "");

            // And append these to the summary data, ensuring use a map to add the IsFiltered attribute (all of these will be highlighted).
            if (IsDefined(additionalSummaryData) && additionalSummaryData.length > 0) {
                additionalSummaryData = additionalSummaryData.map(v => { v.IsFiltered = 2; return v; });
                summaryData = summaryData.concat(additionalSummaryData);
            }
        }
    }

    return summaryData;
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Used to re draw all the charts if there is a single option dimension.  DoReset is true for ResetAll type events.
    forceGhosting ensures that the ghosting is applied even if this appears to be a stock dimension that is changing.  This is needed when changing parameters by URL.
*/
DNChartGroup.prototype.RedrawAllCharts = function (activeChartID, doReset, forceGhosting) {
    // The this key word changes context inside a forEach loop, therefore we need to set this reference to the DNChartGroup here
    let cg = this;

    // TO DO 1 - this would be the place where the summary data would need to be pulled out from the call backs ... AJAX ME!!!

    //--01-- Only use this method if this is a stock visualisation - which is specified by having the single option dimension set.
    // Jan-2020 - OR if this is a pivot dimension
    if (IsDefined(cg.charts) && (IsDefined(cg.singleOptionDimension) || IsDefined(cg.pivotDimensions))) {

        // Jan-2020 - in the case of ResetAll but no single option dimension (but if we are here then we have a pivot dimension), we set the active chart ID to be the first pivot dimension in the list
        // This will cause the logic below to trigger a redraw
        if (IsDefined(doReset) && doReset === true && (!IsDefined(activeChartID) || activeChartID === "")) {
            activeChartID = cg.pivotDimensions[0];
        }

        // Jan-2020 - lets check here whether or not the active chart is the single option dimension...
        let activeChartIsSOD = cg.IsSingleOptionDimension(activeChartID, null);

        // Active chart is pivot dimension.
        let activeChartIsPivotDimension = cg.IsPivotDimension(activeChartID);

        //--02-- Backup the options and the filtered data (JavaScript does a deep copy by default)
        let tempData = cg.filteredJSData;
        let tempFilters = cg.objsToFilter;

        let case1FilteredData = null;
        let case2FilteredData = null;

        //--03-- Case 1 - the user has clicked on the stock dimension or one of the pivot dimensions, which we can identify using the active chart ID.
        // In these cases we filter the data using just these dimensions and not other ones (e.g. country of origin on a PoCs chart)
        if (activeChartIsSOD || activeChartIsPivotDimension) {

            //--03a-- Refilter - start by resetting the objects to filter
            cg.objsToFilter = [];
            //--03b-- Find the Stock filter settings and apply just that one ...
            for (let i = 0; i < tempFilters.length; i++) {
                if (cg.IsSingleOptionDimension(tempFilters[i].ID, null) || cg.IsPivotDimension(tempFilters[i].ID)) {
                    cg.objsToFilter.push({
                        ID: tempFilters[i].ID,
                        Objs: tempFilters[i].Objs
                    });
                }
            }
            //--03c-- Then recalculate the filter
            cg.filteredJSData = cg.GetFilteredData(null); //, null);
            case1FilteredData = cg.filteredJSData;
        }


        //--04-- Case 2 - The single option has changed and there are one or more pivot dimensions.  In this case we need to build the generic dataset with all the data for this year...
        if (activeChartIsSOD && IsDefined(cg.pivotDimensions) && cg.pivotDimensions.length > 0) {

            //--04a-- Refilter by initially resetting the objects to filter
            cg.objsToFilter = [];
            //--04b-- Find the Stock filter settings and apply just that one ...
            for (let i = 0; i < tempFilters.length; i++) {
                if (cg.IsSingleOptionDimension(tempFilters[i].ID, null)) {
                    cg.objsToFilter.push({
                        ID: tempFilters[i].ID,
                        Objs: tempFilters[i].Objs
                    });
                }
            }
            //--04c-- Then recalculate the filter
            case2FilteredData = cg.GetFilteredData(null); //, null);

        }


        // So only attempt to do the redraw charts if this is the Stock (single option) dimension or one of the pivot dimensions.
        if (activeChartIsSOD || activeChartIsPivotDimension) {

            //--05-- Dynamically generate data if needed - this step needs to be here, as we need to update this information AFTER the data has been filtered for a specific year and BEFORE the charts are redrawn
            // This assumes that the dynamically generated data is not a pivot dimension or the stock option.
            cg.DynamicallyGenerateData();

            //--06-- Loop through the charts and redraw them
            cg.charts.forEach(function (c) {

                let doRedraw = false;

                //--07-- Redraw all the charts apart from the active chart and the chart showing the STOCK dimension
                // We never change the active chart, and we never change the single option chart and we don't redraw the pivot dimensions unless the stock single option dimension has changed
                if (cg.IsSingleOptionDimension(c.ChartID, null)) {                                                                                                 //-------------------------------------------------------

                    //--08-- Special case - reset all - if there are no other filters applied to the original list of filters, other than the year, then lets kill the ghosting.
                    // we need to count the specific values selected
                    let objCount = 0;
                    tempFilters.forEach(function (v) {
                        if (IsDefined(v.Objs)) {
                            objCount += v.Objs.length;
                        }
                    });

                    // Generate the filtered data
                    if (objCount === 1) {
                        // Do the ghosting
                        c.DoColumnChartGhosting(c.ChartID, c.ChartData, []);
                    }
                    // Do nothing - the chart will be updated
                    //console.debug(c.ChartID + " - Option 1 - stock dimension (Do nothing)");

                } else if (c.ChartID === activeChartID) {                                                                                                                   //-------------------------------------------------------
                    // Do nothing - the chart will be updated
                    //console.debug(c.ChartID + " - Option 2 - active chart (Do nothing)");

                } else if (cg.IsPivotDimension(c.ChartID) && ! activeChartIsSOD) {    //-------------------------------------------------------
                    // Do nothing - the chart will be updated
                    //console.debug(c.ChartID + " - Option 3 - pivot dimension, and not with the stock dimension active (Do nothing)");

                } else if (cg.IsPivotDimension(c.ChartID) && activeChartIsSOD) {    //-------------------------------------------------------

                    cg.filteredJSData = case2FilteredData;
                    doRedraw = true;

                    //console.debug(c.ChartID + " - Option 4 - pivot dimension, with the stock dimension active, so redraw using all the information available for the specific variable of the stock dimension");

                } else {                                                                                                                                                                        //-------------------------------------------------------
                    // The default
                    cg.filteredJSData = case1FilteredData;
                    doRedraw = true;

                }


                if (doRedraw === true) {
//                    console.debug(c.ChartID + " - Option 5 - normal chart, so redraw using all the stock and pivot dimensions.");

                    //--07a-- First step is to remove the existing chart object by killing the containing Div and all its children
                    // 18-Nov-19 - As long as it is not a map...
                    if (c.ChartType !== 500) {     // MAP
                        let element = document.getElementById(c.ChartID + "Div");
                        if (IsDefined(element)) {
                            element.parentNode.removeChild(element);
                        }
                    }

                    //--07b-- Redraw the charts
                    if (c.ChartType === 100) {            // BAR
                        c.DrawBarChart(chartGroup.GetInfo1D(c.ChartID));
                    } else if (c.ChartType === 200) {     // PIE
                        c.DrawPieChart(chartGroup.GetInfo1D(c.ChartID));
                    } else if (c.ChartType === 300) {     // LINE
                        c.DrawLineChart(chartGroup.GetInfo1D(c.ChartID));
                    } else if (c.ChartType === 400) {     // SANKEY
                        c.DrawSankey(chartGroup.SankeyifyData(c.ChartID, false));
                    } else if (c.ChartType === 500) {     // MAP
                        c.DrawMap(chartGroup.GetInfoIDNumericKey(c.ChartID), chartGroup.GetInfoIDNumericKey(c.ChartIDSubGeographic));
                    } else if (c.ChartType === 600) {     // COLUMN
                        c.DrawColumnChart(chartGroup.GetInfo1D(c.ChartID));
                    } else if (c.ChartType === 700) {     // MULTI VARIATE BAR CHART
                        c.DrawMultiVariateBarChart(chartGroup.GetInfoND(c.Names1));
                        // TO DO MULTI VARIATE COLUMN CHART
                    }
                }
            });
        }


        //--09-- Generate the ghosting for the single option dimension in the case where this is a stock visualisation (specified by that it is a single option dimension) and the change to the selection is from another chart dimension - i.e. not the stock option.
        // Updated with the option to force the ghosting if needed.
        // Jan-20 - Reinforced the logic that the single option has to be defined to continue with the ghosting
        if (IsDefined(cg.singleOptionDimension) &&
            ((IsDefined(forceGhosting) && forceGhosting === true) || ! activeChartIsSOD)) {

            //  Do the filtering here of all attributes APART from the single option dimension...
            //--09a-- reset the objects to filter
            cg.objsToFilter = [];
            //--09b-- Find the Stock filter settings and apply just that one ...
            for (let i = 0; i < tempFilters.length; i++) {
                if (!cg.IsSingleOptionDimension(tempFilters[i].ID, null)) {

                    cg.objsToFilter.push({
                        ID: tempFilters[i].ID,
                        Objs: tempFilters[i].Objs
                    });
                }
            }
            //--09c-- Then recalculate the filter
            cg.filteredJSData = cg.GetFilteredData(null); //, null);

            // Now find the stock dimension chart and do the ghosting...
            cg.charts.forEach(function (c) {

                if (cg.IsSingleOptionDimension(c.ChartID, null)) {
                    // Do we assume for now that the STOCK single dimension will always be on a Column Chart - yes and warn if not...
                    if (c.ChartType === 600) {        // BAR

                        // Special case - if there was no filtering - i.e. this is a reset or all filters have been cleared, we want to make the ghosting disappear - so we set all the data to zero.
                        // we need to count the specific values selected
                        let objCount = 0;
                        cg.objsToFilter.forEach(function (v) {
                            if (IsDefined(v.Objs)) {
                                objCount += v.Objs.length;
                            }
                        });

                        // Generate the filtered data
                        let fData = null;
                        if (objCount === 0) {
                            // We create an empty selection in this case
                            fData = [];
                        } else {
                            fData = cg.GetInfo1D(c.ChartID);
                        }

                        // Do the ghosting
                        c.DoColumnChartGhosting(c.ChartID, c.ChartData, fData);

                    } else {
                        console.warn("dn.js - Unsupported chart type for ghosting of stock dimension.");
                    }
                }

            });
        }


        //--10-- Reset the filters and the filtered data.
        cg.objsToFilter = tempFilters;
        // check if there are dynamic dimensions included in the filter.  This is useful optimisation as it avoids having to refilter the data a further time.
        let filtersContainDynamicDimensions = cg.ObjectsToFilterContainDynamicDimensions();

        // We need to regenerate the filtered data here if dynamic data is included in the list of filters
        cg.filteredJSData = (filtersContainDynamicDimensions === true) ?
            cg.GetFilteredData(null) : //, null) :
            tempData;


        //--11-- Toggle the selected options on all the options that are currently set, if this is a stock visualisation or it contains pivot dimensions and it is not a reset
        if (activeChartIsSOD || activeChartIsPivotDimension) {
            if (IsDefined(doReset) === false || doReset === false) {
                for (let i = 0; i < tempFilters.length; i++) {
                    for (let j = 0; j < tempFilters[i].Objs.length; j++) {
                        cg.ToggleSelected(tempFilters[i].ID, tempFilters[i].Objs[j], true);
                    }
                }
            }
        }
    }
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChartGroup.prototype.UpdateAllCharts = function () {
    // The this key word changes context inside a forEach loop, therefore we need to set this reference to the DNChartGroup here
    let cg = this;

    // TO DO - this would be the place where the summary data would need to be pulled out from the call backs ... AJAX ME!!!

    // iterate through the charts and update them ...
    if (IsDefined(cg.charts)) {
        cg.charts.forEach(function (c) {
            let fData = null;

            // Update the existing charts
            if (c.ChartType === 100) {                // COLUMN
                //                fData = cg.GetInfo1D(c.ChartID, this.filteredJSData, c.sortByValue, c.MaxNumValues, c.ColToSum);
                fData = cg.GetInfo1D(c.ChartID);
                c.UpdateBarChart(c.ChartID, c.ChartData, fData);

            } else if (c.ChartType === 200) {        // PIE
                // , this.filteredJSData, c.sortByValue, c.MaxNumValues, c.ColToSum
                fData = cg.GetInfo1D(c.ChartID);
                c.UpdatePieChart(c.ChartID, c.ChartData, fData);

            } else if (c.ChartType === 300) {        // LINE
                // , this.filteredJSData, c.sortByValue, c.MaxNumValues, c.ColToSum
                fData = cg.GetInfo1D(c.ChartID);
                c.UpdateLineChart(c.ChartID, c.ChartData, fData);

            } else if (c.ChartType === 400) {        // SANKEY
                // Rebuild also the sankey data ...  Note that this HAS to be update last as the filtering of the objsToFilter needs to have been already conducted ...
                fData = cg.SankeyifyData(c.ChartID, true);
                c.UpdateSankey(fData);

            } else if (c.ChartType === 500) {        // MAP
                // To do - need to switch based on the geographic level being presented.
                c.UpdateMap(cg.GetInfoIDNumericKey(c.ChartID));

            } else if (c.ChartType === 600) {        // BAR

                fData = cg.GetInfo1D(c.ChartID);
                c.UpdateColumnChart(c.ChartID, c.ChartData, fData);

            } else if (c.ChartType === 700) {        // MULTI VARIATE COLUMN

                // TO DO - Multi Variate column ...
                fData = cg.GetInfoND(c.Names1);
                c.UpdateMultiVariateBarChart(c.ChartID, c.ChartData, fData);


            }
        });
    }
};

//---------------------------------------------------------------------------------------------------------------------
DNChartGroup.prototype.TotalCount = function (summaryData, fieldToSum) {

    // The default field to sum..
    if (! IsDefined(fieldToSum)) {
        fieldToSum = "Count";
    }

    // Use reduce to get the total from the dataset
    let total = 0;
    if (IsDefined(summaryData)) {
        total = summaryData.reduce((total, x) => {
            return total + x[fieldToSum];
        }, 0); // []);
    }

    return total;
};

//---------------------------------------------------------------------------------------------------------------------
DNChartGroup.prototype.ResetMap = function () {
//    let cg =
    if (IsDefined(this.meep)) {
        this.meep.setView(dn.defaultMapCentroid, dn.defaultMapZoomLevel);
    }
};


//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Summarises the data in two dimensions and identifies the maximum value
DNChartGroup.prototype.FindMaxValue = function (dimension1, dimension2) {

    // We want to group the data by the chart ID and the static dimension
    let dataSummary = this.GetInfo2DFlex(dimension1, dimension2, this.origJSData, false, 0, "");

    let maxVal = 0;
    for (let i = 0; i < dataSummary.length; i++) {
        if (dataSummary[i].Count > maxVal) {
            maxVal = dataSummary[i].Count;
        }
    }

    return maxVal;
};




//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    The DN chart object - a wrapper to create an interactive D3 chart
 */
function DNChart() {
    // Two digit alpha ID for each chart - e.g. AB
    this.ChartID = "";
    // The type of chart: 100 is Column chart, 200 is Pie Chart, 300 is Line chart, 400 is Sankey, 500 is Map (in hundreds to support future extensions)
    this.ChartType = 0;

    // Jan-2020 make the declaration of options more flexible all the other params are declared in here...
    this.Options = {};

    // the ID of the Div to link this chart to
    this.DivID = "";
    // If this chart is linked to a chart group, a reference to the chart group object will be included here, to support the filtering ...
    this.ChartGroup = null;
    // The default dataset for this chart ...
    this.ChartData = null;
    // The second geographic level Maps only)
    this.ChartDataSubGeographic = null;

    this.DoDraw = true;

    // Whether or not to sort by the name or the value
    this.SortByValue = false;
    // The maximum number of values to display
    this.MaxNumValues = 0;
    // The name of the attibute in the json data to count - the default is "Count".  Useful if there are multiple options to count.
    this.ColToSum = "";

    // Whether or not to show the slider widget for the bar charts.  This lets users focus down on the data from just a discrete range of the bars (e.g. 6 months)
    // If true, the slider is show, if false then the bars are individually selectable (same functionality as the column charts).
    this.ShowSlider = false;

    // The placement and size of the chart in the div
    this.OffsetX = 0;
    this.OffsetY = 0;
    this.MaxWidth = 0;
    this.MaxHeight = 0;
    this.LegendOffset = 0; // The amount that pie chart and column chart legends are offset (in the column charts, this used to be called YAxisCrossing)

    this.LegendMaxCharLength = 0; // The length at which to truncate text in legends - not currently exposed (defaults are 29 for Pies and 25 for column charts)

    // Styles and the colour scheme to use
    this.ColourRamp1 = []; // Pie and Sankey only
    this.ColourRamp2 = []; // Sankeys only
    this.CssClass = ""; // Column chart only

    // The list of names
    this.Names1 = [];
    this.Names2 = []; // Sankeys only


    // The chart title
    this.ChartTitle = "";

    // the IDs of the source and target charts to link to (Sankey's only and optional)
    this.SourceChartID = "";
    this.TargetChartID = "";

    // Map specific
    this.ChartIDSubGeographic = ""; // for maps ...
    this.Centroid = [0,0];
    this.ZoomLevel = 0;

    // Oct-19 - If set, will ensure that all maps in all slices have a consistent maximum value size - useful if animating over multiple years as then the size of the bubbles is comparable over time.
    this.MapMaxValue = 0;

}


//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Constructor 0 - for Generic charts ...
DNChart.prototype.GenericChart = function (chartID, chartType, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, namesList, chartTitle, doDraw) {

    //this.Options["ChartID"] = IsDefined(chartID) ? chartID : this.Options["ChartID"];
    //this.Options["ChartType"] = IsDefined(chartType) ? chartType : this.Options["ChartType"];
    //this.Options["ChartGroup"] = IsDefined(chartGroup) ? chartGroup : this.Options["ChartGroup"];

    //this.Options["DivID"] = IsDefined(divID) ? divID : this.Options["DivID"];
    //this.Options["OffsetX"] = IsDefined(offsetX) ? offsetX : this.Options["OffsetX"];
    //this.Options["OffsetY"] = IsDefined(offsetY) ? offsetY : this.Options["OffsetY"];
    //this.Options["MaxWidth"] = IsDefined(chartWidth) ? chartWidth : this.Options["MaxWidth"];
    //this.Options["MaxHeight"] = IsDefined(chartHeight) ? chartHeight : this.Options["MaxHeight"];
    //this.Options["Names1"] = IsDefined(namesList) ? namesList : this.Options["Names1"];
    //this.Options["ChartTitle"] = IsDefined(chartTitle) ? chartTitle : this.Options["ChartTitle"];
    //this.Options["DoDraw"] = IsDefined(doDraw) ? doDraw : this.Options["DoDraw"];

    this.ChartID = chartID;
    this.ChartType = chartType;
    this.DivID = divID;

    this.OffsetX = offsetX;
    this.OffsetY = offsetY;
    this.MaxWidth = chartWidth;
    this.MaxHeight = chartHeight;

    this.Names1 = namesList;
    this.ChartTitle = chartTitle;

    // Link this chart with the chart group
    this.ChartGroup = chartGroup;
    chartGroup.AddChartToGroup(this);

    this.DoDraw = doDraw;

    // TO DO - this would be the place where the summary data would need to be pulled out from the call backs ... AJAX ME!!!

    if (doDraw === true) {
        if (this.ChartType === 100) {            // BAR
            this.DrawBarChart(chartGroup.GetInfo1D(this.ChartID));
        } else if (this.ChartType === 200) {     // PIE
            this.DrawPieChart(chartGroup.GetInfo1D(this.ChartID));
        } else if (this.ChartType === 300) {     // LINE
            this.DrawLineChart(chartGroup.GetInfo1D(this.ChartID));
        } else if (this.ChartType === 400) {     // SANKEY
            this.DrawSankey(chartGroup.SankeyifyData(this.ChartID, false));
        } else if (this.ChartType === 500) {     // MAP
            this.DrawMap(chartGroup.GetInfoIDNumericKey(this.ChartID), chartGroup.GetInfoIDNumericKey(this.ChartIDSubGeographic));
        } else if (this.ChartType === 600) {     // COLUMN
            this.DrawColumnChart(chartGroup.GetInfo1D(this.ChartID));
        } else if (this.ChartType === 700) {     // MULTI VARIATE BAR CHART
            this.DrawMultiVariateBarChart(chartGroup.GetInfoND(this.Names1));
            // TO DO MULTI VARIATE COLUMN CHART
        }
    }

    // return the chart
    return this;
};

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Constructor 1 - for Bar charts ...
DNChart.prototype.BarChart = function (chartID, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, legendOffset, cssClass,
    sortByValue, maxNumValues, colToSum, namesList, chartTitle, doDraw) {

    //this.Options["LegendOffset"] = IsDefined(legendOffset) ? legendOffset : this.Options["LegendOffset"];
    //this.Options["CssClass"] = IsDefined(cssClass) ? cssClass : this.Options["CssClass"];
    //this.Options["SortByValue"] = IsDefined(sortByValue) ? sortByValue : this.Options["SortByValue"];
    //this.Options["MaxNumValues"] = IsDefined(maxNumValues) ? maxNumValues : this.Options["MaxNumValues"];
    //this.Options["ColToSum"] = IsDefined(colToSum) ? colToSum : this.Options["ColToSum"];
    //this.Options["LegendMaxCharLength"] = this.Options["LegendMaxCharLength"] === 0 ? 25 : this.Options["LegendMaxCharLength"];

    // Unique to bar charts
    this.LegendOffset = legendOffset;
    this.CssClass = cssClass;

    this.SortByValue = sortByValue;
    this.MaxNumValues = maxNumValues;
    this.ColToSum = colToSum;

    // Set the generic default for bar charts if this has not been set ...
    if (this.LegendMaxCharLength === 0) {
        this.LegendMaxCharLength = 25;
    }

    return this.GenericChart(chartID, 100, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, namesList, chartTitle, doDraw);
};


//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Constructor 2 - for Pie charts ...
DNChart.prototype.PieChart = function (chartID, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, legendOffset, colourRamp, namesList, chartTitle, doDraw) {

    // Unique to Pies
    this.ColourRamp1 = colourRamp;
    this.LegendOffset = legendOffset;

    // Set the generic default for pie charts if this has not been set ...
    if (this.LegendMaxCharLength === 0) {
        this.LegendMaxCharLength = 29;
    }

    return this.GenericChart(chartID, 200, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, namesList, chartTitle, doDraw);
};

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Constructor 3 - for Line charts ...
DNChart.prototype.LineChart = function (chartID, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, cssClass, namesList, chartTitle, doDraw) {

    // Unique to line and column charts
    this.CssClass = cssClass;

    return this.GenericChart(chartID, 300, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, namesList, chartTitle, doDraw);
};

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Constructor 4 - for Sankey charts ...
DNChart.prototype.SankeyChart = function (chartID, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, sortByValue,
    colourRampSource, coulourRampTarget, namesListSource, namesListTarget, sourceChartID, targetChartID, chartTitle, doDraw) {

    // Jan-2020 - Check that d3-sankey.js is installed and flag an error if not
    if (typeof d3.sankey !== "function") {
        console.error("d3-sankey.js is not available!  This is required to produce the sankey diagrams in DN.js.\nDownload it from https://github.com/d3/d3-sankey and/or reference the library in your project.");
    }

    // Unique to Sankeys
    this.SortByValue = sortByValue;

    this.ColourRamp1 = colourRampSource;
    this.ColourRamp2 = coulourRampTarget;

    this.Names1 = namesListSource;
    this.Names2 = namesListTarget;

    this.SourceChartID = sourceChartID;
    this.TargetChartID = targetChartID;

    return this.GenericChart(chartID, 400, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, namesListSource, chartTitle, doDraw);
};


//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Constructor 5 - for Maps ...
DNChart.prototype.Map = function (chartID, chartIDSubGeographic, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, namesList1, namesList2, chartTitle,
    centroid, zoomLevel, doDraw) {

    // Jan-2020 - Check that Leaflet is installed and flag an error if not
    if (typeof L !== "object") {
        console.error("Leaflet.js is not available!  This is required to produce the maps in DN.js.\nDownload it from https://leafletjs.com/ and/or reference the library in your project.");
    }

    // These are for the data and labels for the sub-national geographic data
    this.ChartIDSubGeographic = chartIDSubGeographic;
    this.Names2 = namesList2;

    this.Centroid = centroid;
    this.ZoomLevel = zoomLevel;

    return this.GenericChart(chartID, 500, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, namesList1, chartTitle, doDraw);
};


//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Constructor 6 - for Column charts ...
DNChart.prototype.ColumnChart = function (chartID, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, legendOffset, cssClass, sortByValue, maxNumValues, colToSum, namesList,
    chartTitle, showSlider, doDraw) {

    // Jan-2020 - Check that D3RangeSlider is installed and flag an error if not
    if (IsDefined( showSlider) && showSlider === true && typeof CreateD3RangeSlider !== "function") {
        console.error("d3RangeSlider.js is not available!  This is required to support the slider functionality in bar charts DN.js.\nDownload it from XXX Add Github and/or reference the library in your project.");
    }


    // Unique to column charts
    this.LegendOffset = legendOffset;
    this.CssClass = cssClass;

    this.SortByValue = sortByValue;
    this.MaxNumValues = maxNumValues;
    this.ColToSum = colToSum;

    // Determine how the user will sub-select the data (using individual bars or the slider)
    this.ShowSlider = showSlider;

    // Set the generic default for column charts if this has not been set ...
    if (this.LegendMaxCharLength === 0) {
        this.LegendMaxCharLength = 25;
    }

    return this.GenericChart(chartID, 600, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, namesList, chartTitle, doDraw);
};


//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Constructor 7 - for Multi Variate Bar charts ...

// TO DO - need to pass a list of columnNames in here as well as a chart ID...

// Everything we need is in the namesList - in this case this is a list of column IDs, and their proper names
/////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////

DNChart.prototype.MultiVariateBarChart = function (chartID, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, legendOffset, cssClass,
    namesList, chartTitle, doDraw) {

    // Unique to MV bar charts
    this.LegendOffset = legendOffset;
    this.CssClass = cssClass;

    // Would the sort by value be useful????

//    this.SortByValue = sortByValue;
//    this.MaxNumValues = maxNumValues;
//    this.ColToSum = colToSum;

    // Set the generic default for column charts if this has not been set ...
    if (this.LegendMaxCharLength === 0) {
        this.LegendMaxCharLength = 25;
    }

    return this.GenericChart(chartID, 700, divID, chartGroup, offsetX, offsetY, chartWidth, chartHeight, namesList, chartTitle, doDraw);
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.DrawChartWrapper = function (parentDivID, chartID, cssClass, x, y, w, h, dataA, dataB) {

    //--00-- Set a good CSS default
    if (!IsDefined(cssClass)) {
        cssClass = "ChartBox";
    }

    //--01-- See of the object exists already and create it if not - assiging it to the parent DIV
    let chartWrapper = null;

    if (d3.select("#" + chartID + "Div").empty()) {
        chartWrapper = d3.select("#" + parentDivID).append("div")
            .attr("id", chartID + "Div");
    } else {
        chartWrapper = d3.select("#" + chartID + "Div");
    }

    //--03-- Style the div wrapper accordingly
    chartWrapper
        .attr("class", cssClass)
        .style("left", x + "px")
        .style("top", y + "px")
        .style("width", w + "px")
        .style("height", h + "px")
        ;

    //--04-- Set the optional data A attribute if defined
    if (IsDefined(dataA)) {
        chartWrapper
            .attr("data-a", dataA);
    }

    //--05-- Set the optional data B attribute if defined
    if (IsDefined(dataB)) {
        chartWrapper
            .attr("data-b", dataB);
    }

    return chartWrapper;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// The chartWrapperObj is the div wrapper, normally with an ID of chartID + "Div"
DNChart.prototype.DrawChartSVGCanvas = function (chartWrapperObj, chartID, x, y, w, h, translateX, translateY) {

    //--00-- Get the chart wrapper object if it was null...
    if (! IsDefined(chartWrapperObj)) {
        chartWrapperObj = d3.select("#" + chartID + "Div");
    }

    //--01-- Create the SVG canvas...
    let svg = chartWrapperObj.append("svg")
        .attr("id", chartID)
        .attr("width", w)
        .attr("height", h)
        .style("left", x)
        .style("top", y)
        .append("g")
        .attr("transform", "translate(" + translateX + "," + translateY + ")");

    return svg;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// The chartWrapperObj is the div wrapper, normally with an ID of chartID + "Div"
DNChart.prototype.DrawChartTitle = function (chartWrapperObj, chartID, cssClass, titleText) {

    let doDraw = false;

    //--00-- Get the chart wrapper object if it was null...
    if (!IsDefined(chartWrapperObj)) {
        chartWrapperObj = d3.select("#" + chartID + "Div");
    }

    // Add the chart title if there is some text to include
    if (IsDefined(titleText) && titleText !== "") {

        let cTitle = chartWrapperObj.select("." + cssClass);

        // Create the title DIV if it didn't exist already
        if (cTitle.empty()) {
            cTitle = chartWrapperObj.append("div")
                .attr("class", cssClass);
        }

        // And then set the text
        cTitle.html(titleText);

        doDraw = true;
    }
    return doDraw;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Removes any existing SVG with a given Chart ID
DNChart.prototype.RemoveExistingSVG = function () {

    // Dec-19 - If this chart exists already - then blow it away
    let objExists = d3.select("#" + this.ChartID);
    if (!objExists.empty()) {
//        console.warn("Chart " + this.ChartID+" already exists - removing it!");
        objExists.remove();
    }

};

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// If set, will ensure that all maps in all slices have a consistent maximum value size - useful if animating over multiple years as then the size of the bubbles is comparable over time.
DNChart.prototype.SetMapMaxValue = function (maxVal) {
    this.MapMaxValue = maxVal;
};

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.GetOption = function (oName) {
    return this.Options[oName];
};
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.SetOption = function (oName, oVal) {
    this.Options[oName] = oVal;
};
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.SetOptions = function (options) {
    this.Options = options;
    return this;
};
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.CheckOptionsDefined = function (oNameList, chartType, chartName) {
    if (IsDefined(oNameList) && oNameList.length) {
        for (let i = 0; i < oNameList.length; i++) {
            if (!IsDefined(this.GetOption(oNameList[i]))) {
                console.warn("dn.js - " + chartType + " ("
                    + ((IsDefined(chartName) && chartName !== "") ? chartName : "unknown name")
                    + ") is missing the required option definition for: " + oNameList[i] + ".  Fix this by adding it to the declaration of your chart.");
            }
        }
    }
};



//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.DrawBarChart = function (chartData) {

    // Check all the required parameters have been defined
    //this.CheckOptionsDefined(
    //    ["DivID", "Names1", "OffsetX", "OffsetY", "MaxWidth", "MaxHeight", "LegendOffset", "ChartTitle", "CssClass", "LegendMaxCharLength", "ShowHoverOver"],
    //    dn.GetObjInList(this.ChartGroup.ChartList, "ChartType", this.ChartType).Name,
    //    IsDefined(this.ChartTitle) ? this.ChartTitle : ""
    //);

    // Set all the relevant variables from the global parameters
    let chartID = this.ChartID;
    let divID = this.DivID;
    let lookupList = this.Names1;
    let xLoc = this.OffsetX;
    let yLoc = this.OffsetY;
    let maxWidth = this.MaxWidth;
    let maxHeight = this.MaxHeight;
    let yAxisCrossing = this.LegendOffset;
    let chartTitle = this.ChartTitle;
    let customStyle = this.CssClass;
    let maxTxtLength = this.LegendMaxCharLength;

    this.ChartData = chartData;
    let cg = this.ChartGroup;
    let chartType = this.ChartType;
    let showHoverOver = this.ShowHoverOver;

    //-----0----- Remove any existing SVG with the same ID as this chart - this has become an issue when managing the resizing...
    this.RemoveExistingSVG();

    //--0-- Ensure that the DIV ID is set and use a good default if not ...
    if (!IsDefined(divID) || divID === "") {
        divID = "DataVis";
    }

    // Jul-18 - Allow custom styles to be set for the bars
    customStyle = (! IsDefined(customStyle) || customStyle === "") ? "BChart" : customStyle;

    maxWidth = (!IsDefined(maxWidth) || maxWidth === 0) ? 490 : maxWidth;
    maxHeight = (!IsDefined(maxHeight) || maxHeight === 0) ? 300 : maxHeight;
    yAxisCrossing = (!IsDefined(yAxisCrossing) || yAxisCrossing === 0) ? dn.defaultYAxisCrossing : yAxisCrossing;

    // Set the titles using the lookup lists
    this.ApplyTitleFromLookupList(chartData, lookupList, maxTxtLength, false);

    let margin = dn.defaultBarChartMargins;
    let width = maxWidth;
    let height = maxHeight;

    // Append the div wrapper to the given div.
    let chartWrapper = this.DrawChartWrapper(divID, chartID, null, xLoc, yLoc, width, height, yAxisCrossing, (margin.left + margin.right));

    let heightReductionDueToTitle =
        this.DrawChartTitle(chartWrapper, chartID, "ChartTitle", chartTitle)
            ? dn.defaultTitleHeight + dn.defaultChartBuffer : 0;


    let chartWidth = width - margin.left - margin.right;
    let chartHeight = height - heightReductionDueToTitle - margin.top - margin.bottom;

    // math.round causes concertina extension issues for charts with large numbers of bars ...
    let barHeight = Math.floor(chartHeight / chartData.length);

    // Now we have to assume that the data vis people are not stupid and dont try to add in too many bars into the space
    // but we do want to ensure a max so that there is general consistency between the views.
    let maxBarHeight = 40;
    barHeight = (barHeight > maxBarHeight) ? maxBarHeight : barHeight;

    // get the actual height of the chart ....
    let actualHeight = barHeight * chartData.length;
    chartHeight = actualHeight;

    let barGap = Math.round(barHeight * 0.25);

    // 18 July fix - due to updated D3 code.
    let x = d3.scaleLinear().range([0, chartWidth - yAxisCrossing]);

    // 12 and 9 originally ...
    let y = d3.scaleBand().rangeRound([-8, chartHeight + 3], .1);

    let yAxis = d3.axisLeft(y);

    let svg = this.DrawChartSVGCanvas(chartWrapper, chartID, 0, 0, width, height, margin.left, margin.top);

    this.AddSVGDropShadow(svg);

    // Setup the ranges for the x and y axis
    // 12-May-2016 - For the y-axis, we now don't want to include any text at all - we can produce prettier results ourselves
    x.domain([0, d3.max(chartData, function (d) { return d.Count; })]);
    y.domain(chartData.map(function (d) {
        return "";
    }));


    let bar = svg.selectAll("g")
        .data(chartData)
        .enter().append("g")
        .attr("transform", function (d, i) { return "translate(0," + (i * barHeight) + ")"; });

    bar.append("rect")
        .attr("id", function (d) { return chartID + "_" + d.ID + "_1"; })
        .attr("x", function (d) { return yAxisCrossing; })
        .attr("width", function (d) { return x(d.Count); })
        .attr("height", barHeight - barGap)
        .attr("rx", 1)
        .attr("ry", 1)
        .attr("class", "BChartDisabled " + cg.dropShadowCSS)
        .style('cursor', 'pointer')

        .on("mouseover", function (v) {
            focus.style("display", null);
            d3.select("#" + chartID + "_" + v.ID + "_2").attr("class", "BChartHover");
        })
        .on("mouseout", function (v) {
            focus.style("display", "none");
            d3.select("#" + chartID + "_" + v.ID + "_2").attr("class", customStyle);
        })
        .on("mousemove", function (v, i) {
            let coordinates = d3.mouse(this);

            //XXX HACKY - we need a better way to access the filtered numbers ...
            // Jan-20 - previously the filtered count was approximated by comparing the heights of the filtered and the full bars
            // This obviously does not work when the bars are representing large ranges of numbers e.g from 0 to 1m.
            // Get the data value for the selected data from the data attribute of the _2 filtered bars or the _5 ghosting bars if this is a stock visualisation
            let currentCount = d3.select("#" + chartID + "_" + v.ID + "_2").attr("data-a");

            // 18-Nov-2015 - improve the hover over text by showing the selected numbers (and the totals)
            //let w1 = d3.select("#" + chartID + "_" + v.ID + "_1").attr("width");
            //let w2 = d3.select("#" + chartID + "_" + v.ID + "_2").attr("width");
            //let tempCount = Math.round(w2 / w1 * v.Count);

            showHoverOver(chartID, chartType, [coordinates[0], coordinates[1] + (i * barHeight)],
                focus, v.Title, currentCount, v.Count);

        })
        .on("click", function (v) {
            focus.style("display", "none");
            // Do the filtering based on this class of the given chart
            cg.DoFilter(chartID + "_" + v.ID);
        });

    // Append the blocks that will be the bars of the chart
    bar.append("rect")
        .attr("id", function (d) { return chartID + "_" + d.ID + "_2"; })
        .attr("x", function (d) { return yAxisCrossing; })
        .attr("width", function (d) { return x(d.Count); })
        .attr("height", barHeight - barGap)
        .attr("rx", 1)
        .attr("ry", 1)
        .attr("data-a", function (d) { return d.Count; })
        .style("pointer-events", "none")
        .attr("class", customStyle);

    // show selected rect ... these show which bars have been clicked on
    bar.append("rect")
        .attr("id", function (d) { return chartID + "_" + d.ID + "_3"; })
        .attr("x", yAxisCrossing - 4)
        .attr("width", 4)
        .attr("height", barHeight - barGap)
        .attr("rx", 1)
        .attr("ry", 1)
        .style("pointer-events", "none")
        .style("display", "none")
        .attr("class", "BChartClicked");

    // draw the hover over group of elements
    let focus = this.DrawHoverOver(svg);

    bar.append("text")
        .attr("id", function (d) { return chartID + "_" + d.ID + "_4"; })
        .attr("x", function (d) { return x(d.Count) - 2 + yAxisCrossing; })
        .attr("y", barHeight / 2)
        .attr("dx", ".75em")
        .attr("class", "BChartText")
        .text(function (d) { return dn.NumberWithCommas(d.Count); })
        ;

    // 12-May-2016 - the built in axis is unfortunately not that flexible when it comes to text, so better to do our own customisation here ....
    bar.append('text')
        .attr('x', yAxisCrossing - 4)
        .attr('y', barHeight / 2)
        .attr('text-anchor', 'end')
        .attr("class", "y BCAxis")
        .text(function (d) { return d.Title + " -"; })
        .style('cursor', 'pointer')
        .on("click", function (d, i) {

            cg.DoFilter(chartID + "_" + chartData[i].ID);

            // Jan-20 - this was redundant
            // And then update the styles - Note that d3 will change the empty style to be inline.
//            let currentStyle = d3.select("#" + chartID + "_" + chartData[i].ID + "_3").style("display");
//            currentStyle = (currentStyle === "none") ? "" : "none";
//            d3.select("#" + chartID + "_" + chartData[i].ID + "_3").style("display", currentStyle);
        });
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.DrawMultiVariateBarChart = function (chartData) {

    // Draw the multi variate column chart in the same way as a normal column chart...
    this.DrawBarChart(chartData);

};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Draws vertical bars, otherwise known as columns.  Very useful for timelines...
*/
DNChart.prototype.DrawColumnChart = function (chartData) {

    //-----0----- Set all the relevant variables from the global parameters
    let chartID = this.ChartID;
    let divID = this.DivID;
    let lookupList = this.Names1;
    let xLoc = this.OffsetX;
    let yLoc = this.OffsetY;
    let maxWidth = this.MaxWidth;
    let maxHeight = this.MaxHeight;
    let xAxisCrossing = this.LegendOffset;
    let chartTitle = this.ChartTitle;
    let customStyle = this.CssClass;
    let maxTxtLength = this.LegendMaxCharLength;

    let showSlider = this.ShowSlider;
    let sliderHeight = 26; // pixels

    this.ChartData = chartData;
    let cg = this.ChartGroup;
    let chartType = this.ChartType;
    let showHoverOver = this.ShowHoverOver;

    // Aug-19 - set the max slider width based on whether or not this is a STOCK visualisation or not.  We identify whether this chart is the STOCK option by whether a stock option has been specified, and whether the stock ID is the same as this chart id.
    let isStockVisualisation = (IsDefined(cg.singleOptionDimension) && cg.singleOptionDimension.ID === chartID);

    //-----0----- Remove any existing SVG with the same ID as this chart - this has become an issue when managing the resizing...
    this.RemoveExistingSVG();

    //--0-- Ensure that the DIV ID is set and use a good default if not ...
    if (! IsDefined(divID) || divID === "") {
        divID = "DataVis";
    }

    // Jul-18 - Allow custom styles to be set for the bars
    customStyle = (! IsDefined(customStyle) || customStyle === "") ? "CChart" : customStyle;

    maxWidth = (! IsDefined(maxWidth) || maxWidth === 0) ? 490 : maxWidth;
    maxHeight = (!IsDefined(maxHeight) || maxHeight === 0) ? 300 : maxHeight;
    xAxisCrossing = (!IsDefined(xAxisCrossing) || xAxisCrossing === 0) ? dn.defaultYAxisCrossing : xAxisCrossing;

    //-----2----- Set the titles using the lookup lists
    this.ApplyTitleFromLookupList(chartData, lookupList, maxTxtLength, false);

    //-----3----- Append the div wrapper to the given div and add the chart title.
    let chartWrapper = this.DrawChartWrapper(divID, chartID, null, xLoc, yLoc, maxWidth, maxHeight, null, null);

    // Add the chart title
    let heightReductionDueToTitle =
        this.DrawChartTitle(chartWrapper, chartID, "ChartTitle", chartTitle)
            ? dn.defaultTitleHeight + dn.defaultChartBuffer: 0;

    // Tweak the height reduction if we are to show a slider...
    if (showSlider === true) {
        heightReductionDueToTitle += sliderHeight;
    }

    //-----4----- Define the bar graph margins and heights and  set the chart widths and heights.
    let margin = dn.defaultColumnChartMargins;

    let chartWidth = maxWidth - margin.left - margin.right;
    let chartHeight = maxHeight - heightReductionDueToTitle - margin.top - margin.bottom;

    // math.round causes concertina extension issues for charts with large numbers of bars ...
    let barWidth = Math.floor(chartWidth / chartData.length);

    // Now we have to assume that the data vis people are not stupid and dont try to add in too many bars into the space
    // but we do want to ensure a max so that there is general consistency between the views.
    let maxBarWidth = 40;
    barWidth = (barWidth > maxBarWidth) ? maxBarWidth : barWidth;

    // get the actual width of the chart ....
    let actualWidth = barWidth * chartData.length;
    chartWidth = actualWidth;

    let barGap = Math.round(barWidth * 0.25);

    // Add in the two data attibutes
    chartWrapper
        .attr("data-a", xAxisCrossing)
        .attr("data-b", (margin.top + margin.bottom + heightReductionDueToTitle));

    //-----5----- Create the x and y axis
    let x = d3.scaleBand().rangeRound([-8, chartWidth + 3], .1);
    // We want the y axis to be as large as possible - so all the space apart from the top margin, below the xAxis and the title ...
    let y = d3.scaleLinear().range([0, chartHeight - xAxisCrossing]);

    let svg = this.DrawChartSVGCanvas(chartWrapper, chartID, 0, 0, maxWidth, maxHeight, margin.left, margin.top);

    // Add the SVG drop shadow
    this.AddSVGDropShadow(svg);

    // Setup the ranges for the x and y axis
    x.domain(chartData.map(function (d) { return d.Title; }));
    y.domain([d3.max(chartData, function (d) { return d.Count; }), 0]);

    // Define and add the X Axis
    var xAxis = d3.axisBottom(x).ticks(20);

    svg.append("g")
        .attr("class", "CCAxis")
        .attr("transform", "translate(0," + (chartHeight - xAxisCrossing) + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function (d) {
            return "rotate(-45)";
        })
        .style('cursor', 'pointer')
        .on("click", function (d, i) {
            cg.DoFilter(chartID + "_" + chartData[i].ID);
        });

    // And the yAxis
    let yAxis = d3.axisLeft(y).ticks(5);

    // gridlines in y axis function
    function make_y_gridlines() {
        return d3.axisLeft(y)
            .ticks(5);
    }

    // Add the Y Axis gridlines
    svg.append("g")
        .attr("class", "CCAxisGrid")
        .call(make_y_gridlines()
            .tickSize(-chartWidth)
            .tickFormat("")
        );

    // Add the Y Axis
    svg.append("g")
        .attr("class", "CCAxis")
        .call(yAxis);


    //-----6----- Now we start drawing the bars
        // Note that the object that we select here will be an empty selection as we have not created the bars yet, so it doesn't seem to matter what we put in there!
    // See - http://www.jeromecukier.net/2011/08/09/d3-adding-stuff-and-oh-understanding-selections/
    let bar = svg.selectAll("barBase")
        .data(chartData)
        .enter().append("g")
        .attr("transform", function (d, i) { return "translate(" + (i * barWidth) + ",0)"; });

    bar.append("rect")
        .attr("id", function (d) { return chartID + "_" + d.ID + "_1"; })
        .attr("y", function (d) { return y(d.Count); })
        .attr("width", barWidth - barGap)
        .attr("height", function (d) { return (d.Count === 0) ? 0 : chartHeight - y(d.Count) - xAxisCrossing; })
        .attr("rx", 1)
        .attr("ry", 1)
        .attr("class", "CChartDisabled " + cg.dropShadowCSS)
        .style('cursor', 'pointer')

        .on("mouseover", function (v) {
            focus.style("display", null);
            d3.select("#" + chartID + "_" + v.ID + "_2").attr("class", "CChartHover");
        })
        .on("mouseout", function (v) {
            focus.style("display", "none");
            d3.select("#" + chartID + "_" + v.ID + "_2").attr("class", customStyle);
        })
        .on("mousemove", function (v, i) {
            let coordinates = d3.mouse(this);

            // Jan-20 - previously the filtered count was approximated by comparing the heights of the filtered and the full bars
            // This obviously does not work when the bars are representing large ranges of numbers e.g from 0 to 1m.
            // Get the data value for the selected data from the data attribute of the _2 filtered bars or the _5 ghosting bars if this is a stock visualisation
            let objSubID = 2;

            if (isStockVisualisation) {
                objSubID = 5;
            }

            let currentCount = d3.select("#" + chartID + "_" + v.ID + "_" + objSubID).attr("data-a");

            showHoverOver(chartID, chartType, [coordinates[0] + (i * barWidth), coordinates[1]],
                focus, v.Title, currentCount, v.Count);

        })
        .on("click", function (v) {
            focus.style("display", "none");
            // Do the filtering based on this class of the given chart
            cg.DoFilter(chartID + '_' + v.ID);
        });


    // Aug-19 - Draw the empty rectangles for the ghosting by single option dimension, if that is active.
    // The order for drawing is important, as we want these to appear behind the selected bars...
    if (isStockVisualisation === true) {
        // We use _5 as _4 has been used for text bar labels in e.g. the column charts.  This leaves scope for consistent extension here.
        // Append the blocks that will be the ghosted columns of the chart
        bar.append("rect")
            .attr("id", function (d) { return chartID + "_" + d.ID + "_5"; })
            .attr("y", chartHeight - xAxisCrossing - 1)  //.attr("y", function (d) { return y(d.Count); })
            .attr("width", barWidth - barGap)
            .attr("height", 0) // Always set to be 1 pixel by default, so they are drawn, but do not intrude.
            .attr("rx", 1)
            .attr("ry", 1)
            .attr("data-a", function (d) { return d.Count; }) // Added Jan-20 to improve the hoverover numbers...
            .style("pointer-events", "none")
            .attr("class", "CChartGhosting");
    }

    // Append the blocks that will be the selected, most visible, bars of the chart
    bar.append("rect")
        .attr("id", function (d) { return chartID + "_" + d.ID + "_2"; })
        .attr("y", function (d) { return y(d.Count); })
        .attr("width", barWidth - barGap)
        .attr("height", function (d) { return (d.Count === 0) ? 0 : chartHeight - y(d.Count) - xAxisCrossing; })
        .attr("rx", 1)
        .attr("ry", 1)
        .attr("data-a", function (d) { return d.Count; } ) // Added Jan-20 to improve the hoverover numbers...
        .style("pointer-events", "none")
        .attr("class", customStyle);

    // show selected rect ... these show which bars have been clicked on
    bar.append("rect")
        .attr("id", function (d) { return chartID + "_" + d.ID + "_3"; })
        .attr('y', chartHeight - xAxisCrossing)
        .attr("width", barWidth - barGap)
        .attr("height", 4)
        .attr("rx", 1)
        .attr("ry", 1)
        .style("pointer-events", "none")
        .style("display", "none")
        .attr("class", "CChartClicked");


    //-----7----- Show the slider
    if (showSlider === true) {

        // Append the div wrapper - there is an issue with the maxHeight versus chartHeight above, so we need to position this absolutely over the bar chart itself.
        // This is used in the createD3RangeSlider function below (see that the ID is passed in)
        let sliderDiv = d3.select("#" + chartID + "Div").append("div")
            .attr("class", "CCSliderWrapper")
            .style("top", (maxHeight - sliderHeight) + "px")
            .style("width", chartWidth + 35 + "px")
            .attr("id", chartID + "Slider");

        // And then create the range slider
        let slider = CreateD3RangeSlider(0, lookupList.length, "#" + chartID + "Slider", true, 1000, isStockVisualisation);

        // Aug-19 - specify the length of the slider based on whether this is a STOCK visualisation or not (if yes, then just one year / dimension, and if no, the default would be all)
        if (isStockVisualisation === false) {
            slider.Range(0, lookupList.length);
        } else {
            // For stock visualisations - it's good to have it at the start as then the animation works by default
            slider.Range(0, 1);
        }

        // Wire up the onChange event for the slider to pull out the selected value(s) from the lookupList
        slider.OnChange(function (newRange) {
            let selectedList = [];
            for (let i = newRange.begin; i < newRange.end; i++) {
                // NB - ensure the selected values are included as is (i.e. correctly numeric or strings) - otherwise the comparison in the MultiFilter does not work.
                selectedList.push(lookupList[i].ID);
            }

            cg.DoMultiFilter(chartID, selectedList);

        });

        // Set this as the global bar chart slider ....
        cg.columnChartSlider = slider;
    }

    //-----8----- Add the hoverover object
    let focus = this.DrawHoverOver(svg);

};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.DrawLineChart = function (chartData) {

    // Set all the relevant variables from the global parameters
    var chartID = this.ChartID;
    var divID = this.DivID;
    var xLoc = this.OffsetX;
    var yLoc = this.OffsetY;
    var maxWidth = this.MaxWidth;
    var maxHeight = this.MaxHeight;
    var chartTitle = this.ChartTitle;
    var customStyle = this.CssClass;

    this.ChartData = chartData;
    var cg = this.ChartGroup;
    let chartType = this.ChartType;
    let showHoverOver = this.ShowHoverOver;

    //-----0----- Remove any existing SVG with the same ID as this chart - this has become an issue when managing the resizing...
    this.RemoveExistingSVG();

    //--0-- Ensure that the DIV ID is set and use a good default if not ...
    if (!IsDefined(divID) || divID === "") {
        divID = "DataVis";
    }

    // Jul-18 - Allow custom styles to be set for the bars
    customStyle = (!IsDefined(customStyle) || customStyle === "") ? "LChart" : customStyle;

    maxWidth = (!IsDefined(maxWidth) || maxWidth === 0) ? 500 : maxWidth;
    maxHeight = (!IsDefined(maxHeight) || maxHeight === 0) ? 300 : maxHeight;

    // if need to expose this, then need to add another param ...
    var margin = dn.defaultLineGraphMargins;

    var heightReductionDueToTitle = (IsDefined(chartTitle) && chartTitle !== "") ? dn.defaultTitleHeight + dn.defaultChartBuffer : 0;

    // Append the div wrapper to the given div
    let chartWrapper = this.DrawChartWrapper(divID, chartID, null, xLoc, yLoc, maxWidth, maxHeight,
        (margin.left + margin.right),
        (margin.top + margin.bottom - heightReductionDueToTitle)
    );

    this.DrawChartTitle(chartWrapper, chartID, "ChartTitle", chartTitle);

    // Set the dimensions of the canvas / graph
    var canvasHeight = maxHeight - heightReductionDueToTitle;
    var canvasWidth = maxWidth;

    var width = maxWidth - margin.left - margin.right;
    var height = maxHeight - margin.top - margin.bottom;

    // Parse the date / time (D3 API v4 means time.format changed to the below.)
    let parseDate = d3.timeParse("%Y%m");
    let bisectDate = d3.bisector(function (d) { return d.ID; }).left;

    // Set the ranges
    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // Define the axes
    var xAxis = d3.axisBottom(x).ticks(20).tickFormat(d3.timeFormat("%Y-%b"));
    var yAxis = d3.axisLeft(y).ticks(5);

    // Define the line
    var timeline = d3.line().curve(d3.curveCardinal)
        .x(function (d) { return x(d.ID); })
        .y(function (d) { return y(d.Count); });

    // Adds the svg canvas
    let svg = this.DrawChartSVGCanvas(chartWrapper, chartID, 0, 0, canvasWidth, canvasHeight, margin.left, margin.top);

    // Get the data
    chartData.forEach(function (d) {
        d.ID = parseDate(d.ID);
        d.Count = +d.Count;
    });

    // Scale the range of the data
    x.domain(d3.extent(chartData, function (d) { return d.ID; }));
    y.domain([0, d3.max(chartData, function (d) { return d.Count; })]);

    this.AddSVGDropShadow(svg);

    // Add the X Axis
    svg.append("g")
        .attr("class", "LCAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function (d) {
            return "rotate(-45)";
        });

    // Add the Y Axis
    svg.append("g")
        .attr("class", "LCAxis")
        .call(yAxis);

    // gridlines in x axis function
    function make_x_gridlines() {
        return d3.axisBottom(x)
            .ticks(10);
    }
    // add the X gridlines
    svg.append("g")
        .attr("class", "LGrid")
        .attr("transform", "translate(0," + height + ")")
        .call(make_x_gridlines()
            .tickSize(-height)
            .tickFormat("")
        );

    // gridlines in y axis function
    function make_y_gridlines() {
        return d3.axisLeft(y)
            .ticks(5);
    }
    // add the Y gridlines
    svg.append("g")
        .attr("class", "LGrid")
        .call(make_y_gridlines()
            .tickSize(-width)
            .tickFormat("")
        );

    // Add the paths ...
    svg.append("path")
        .datum(chartData)
        .attr("class", "LChartDisabled " + cg.dropShadowCSS)
        .attr("d", timeline)

        .on("mouseover", function (v) {
            focus.style("display", null);
        })
        .on("mouseout", function (v) {
            focus.style("display", "none");
        })
        .on("mousemove", function (v) {

            var x0 = x.invert(d3.mouse(this)[0]),
                i = bisectDate(chartData, x0, 1),
                d0 = chartData[i - 1],
                d1 = chartData[i],
                d = x0 - d0.Count > d1.Count - x0 ? d1 : d0;

            showHoverOver(chartID, chartType, d3.mouse(this), focus,
                dn.months[d.ID.getMonth() - 1] + " " + d.ID.getFullYear(),
                d.Count, d.Count);
        })
        ;

    // Add the active path with the "chart ID" ...
    svg.append("path")
        .datum(chartData)
        .attr("id", chartID + "_2")
        .attr("class", customStyle)
        .style("pointer-events", "none")
        .attr("d", timeline);

    // draw the hover over group of elements
    var focus = this.DrawHoverOver(svg);

};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
// the legend offset moves the legend a number of pixels to the right from its initial left-justified position - useful for legends with limited text or in smaller shapes...
DNChart.prototype.DrawPieChart = function (chartData) {

    // Set all the relevant variables from the global parameters
    let chartID = this.ChartID;
    let divID = this.DivID;
    let lookupList = this.Names1;
    let xLoc = this.OffsetX;
    let yLoc = this.OffsetY;
    let maxWidth = this.MaxWidth;
    let maxHeight = this.MaxHeight;
    let legendOffset = this.LegendOffset;
    let chartTitle = this.ChartTitle;
    let customColourRamp = this.ColourRamp1;
    let maxTxtLength = this.LegendMaxCharLength;
    let useSimpleColours = false; //#################################### CHECK THIS #########################################

    this.ChartData = chartData;
    let cg = this.ChartGroup;
    let chartType = this.ChartType;
    let showHoverOver = this.ShowHoverOver;

    //-----0----- Remove any existing SVG with the same ID as this chart - this has become an issue when managing the resizing...
    this.RemoveExistingSVG();

    //--0-- Ensure that the DIV ID is set and use a good default if not ...
    if (!IsDefined(divID) || divID === "") {
        divID = "DataVis";
    }

    maxWidth = (!IsDefined(maxWidth) || maxWidth === 0) ? 250 : maxWidth;
    maxHeight = (!IsDefined(maxHeight) || maxHeight === 0) ? 250 : maxHeight;

    // for the legend rectangle size 16 better for 1em (16px) and the default is 10px.
    let legendRectSize = (IsDefined(dn.defaultPieDonutLegendRectangleSize) && dn.defaultPieDonutLegendRectangleSize > 0) ? dn.defaultPieDonutLegendRectangleSize : 10;
    let legendSpacing = 4;

    // Jan-2020 - Added to shuffle the pie charts up a little...
    let heightFudge = 5;
    let clickedRectOffsetX = 4 + legendRectSize - 10;
    let clickedRectOffsetY = 6 + legendRectSize - 10;

    // Set the dimensions of the canvas / graph
    let margin = { top: dn.defaultPieMarginBuffer - heightFudge, right: dn.defaultPieMarginBuffer, bottom: dn.defaultPieMarginBuffer, left: dn.defaultPieMarginBuffer };
    let width = maxWidth;
    let height = maxHeight;

    let donutWidth = dn.defaultPieDonutWidth;
    let pieBuffer = margin.left + margin.right;


    // Associate the titles with the data from the lookup list ....
    // also record the indexes that have been found in a list and strim the list of colours, if that particular colour does not exist in it (keeping the special colour)
    //var indexesInDataList = [];

    // To do - this could be optimised better ....
    // Set the titles using the lookup lists
    let indexesInDataList = this.ApplyTitleFromLookupList(chartData, lookupList, maxTxtLength, true);



    if (IsDefined(lookupList)) {
        if (!IsDefined(useSimpleColours) || useSimpleColours === false) {
            customColourRamp = dn.StrimColourRamp2(customColourRamp, indexesInDataList);
        } else {
            customColourRamp = dn.StrimColourRamp(customColourRamp, chartData.length);
        }
    }

    // Append the div wrapper to the given div
    let chartWrapper = this.DrawChartWrapper(divID, chartID, null, xLoc, yLoc, maxWidth, height, donutWidth, pieBuffer);

    let heightReductionDueToTitle =
        this.DrawChartTitle(chartWrapper, chartID, "ChartTitle", chartTitle)
            ? dn.defaultTitleHeight + dn.defaultChartBuffer : 0;

    let chartWidth = width;
    let chartHeight = height - heightReductionDueToTitle - (heightFudge * 2);

    let radius = (Math.min(chartWidth - margin.left - margin.right, chartHeight - margin.top - margin.bottom) / 2);

    // D3 - category20b has moved in the V4 API and is no longer available in the V5 API...
//    let color = d3.scaleOrdinal(d3.schemeCategory20b);
    let color = d3.scaleOrdinal(d3.schemeCategory10);
    if (IsDefined(customColourRamp)) {
        color = d3.scaleOrdinal().range(customColourRamp);
    }

    // 22-Apr-2016 - this should start at 0, 0, no need here for an additional buffer
    let svg = this.DrawChartSVGCanvas(chartWrapper, chartID, 0, 0, chartWidth, chartHeight, (chartWidth / 2), (chartHeight / 2));

    // Jan-20 - Append a data-a value to contain the total for the chart ...  this is used in the hover over
    // While it would seem to make sense to use the SVG object, actually we need to reselect it here...
    d3.select("#" + chartID).attr("data-a", d3.sum(chartData.map(function (d) {
        return d.Count;
    })));

    let arc = d3.arc()
        .innerRadius(radius - donutWidth)
        .outerRadius(radius);

    let pie = d3.pie()
        .sort(null)
        .value(function (d) { return d.Count; });

    this.AddSVGDropShadow(svg);

    let path = svg.selectAll('path')
        .data(pie(chartData))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr("class", "PChartPath " + cg.dropShadowCSS)
        .attr('fill', function (d, i) { return color(d.data.Title); })
        .style('cursor', 'pointer')
        // This is used below in the arcTween function
        .each(function (d) { this._current = d; });

    // the on mouseover ....
    path.on('mouseover', function (d) {
        focus.style("display", null);
    });

    path.on('mouseout', function () {
        focus.style("display", "none");
    });

    path.on('mousemove', function (d, i) {

        // Jan-20 - The total should be the total of the filtered data
        let total = +d3.select("#" + chartID).attr("data-a");

        //let total = d3.sum(chartData.map(function (d) {
        //    return d.Count;
        //}));

        showHoverOver(chartID, chartType, d3.mouse(this), focus, d.data.Title, d.data.Count, total);
    });

    path.on('click', function (v) {
        cg.DoFilter(chartID + "_" + v.data.ID);
    });


    // check the legendOffset is functioning
    legendOffset = (!IsDefined(legendOffset)) ? 0 : +legendOffset;

    let legend = svg.selectAll('.PCLegend')
        .data(color.domain())
        .enter()
        .append('g')
        .attr('class', 'PCLegend')
        .attr('transform', function (d, i) {
            var height = legendRectSize + legendSpacing;
            var offset = height * color.domain().length / 2;
            var horz = -5 * legendRectSize + legendOffset;
            var vert = i * height - offset;
            return 'translate(' + horz + ',' + vert + ')';
        });

    legend.append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .style('fill', color)
        .style('stroke', color)
        .style('cursor', 'pointer')
        .attr("id", function (d, i) {
            return chartID + "_" + chartData[i].ID + "_2";
        })
        .on("click", function (d, i) {
            cg.DoFilter(chartID + "_" + chartData[i].ID);
        })
        ;

    // Show that objects have been clicked ..
    legend.append('rect')
        .attr("id", function (d, i) {
            return chartID + "_" + chartData[i].ID + "_3";
        })
        .attr('width', 4)
        .attr('height', legendRectSize)
        .attr('x', -1 * legendRectSize + clickedRectOffsetX) // originally 4
        .attr('y', legendRectSize - legendSpacing - clickedRectOffsetY) // originally 6
        .attr("rx", 1)
        .attr("ry", 1)
        .style("pointer-events", "none")
        .style("display", "none")
        .attr("class", "PChartClicked");

    // The text ...
    legend.append('text')
        .attr('x', legendRectSize + legendSpacing)
        .attr('y', legendRectSize - legendSpacing + 2)
        .text(function (d) { return d; })
        .style('cursor', 'pointer')
        .on("click", function (d, i) {
            cg.DoFilter(chartID + "_" + chartData[i].ID);
        });


    // draw the hover over group of elements (do this last so it's on top...)
    let focus = this.DrawHoverOver(svg);
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.DrawSankey = function (chartData) {

    // Set all the relevant variables from the global parameters
    let chartID = this.ChartID;
    let divID = this.DivID;

    let xLoc = this.OffsetX;
    let yLoc = this.OffsetY;
    let maxWidth = this.MaxWidth;
    let maxHeight = this.MaxHeight;
    let chartTitle = this.ChartTitle;

    this.ChartData = chartData;

    //-----0----- Remove any existing SVG with the same ID as this chart - this has become an issue when managing the resizing...
    this.RemoveExistingSVG();

    //--0-- Ensure that the DIV ID is set and use a good default if not ...
    if (!IsDefined(divID) || divID === "") {
        divID = "DataVis";
    }

    //--1-- Calculate the max width and height of the div enforcing some reasonable minimum sizes
    maxWidth = (!IsDefined(maxWidth) || maxWidth === 0) ? 500 : maxWidth;
    maxHeight = (!IsDefined(maxHeight) || maxHeight === 0) ? 300 : maxHeight;

    //--2-- Build the Div wrapper ....
    let chartWrapper = this.DrawChartWrapper(divID, chartID, null, xLoc, yLoc, maxWidth, maxHeight, null, null);

    //--3-- Add the chart title
    this.DrawChartTitle(chartWrapper, chartID, "ChartTitle", chartTitle);

    //--4-- Then build the Sankey chart itself
    this.UpdateSankey(chartData);
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.UpdateSankey = function (chartData) {

    // Set all the relevant variables from the global parameters
    let chartID = this.ChartID;
    let chartType = this.ChartType;

    let listSource = this.Names1;
    let listTarget = this.Names2;
    let sourceField = this.SourceChartID;
    let targetField = this.TargetChartID;

    let chartWidth = this.MaxWidth;
    let chartHeight = this.MaxHeight;

    let cg = this.ChartGroup;   

    //--01a-- Margin stuff and general setup
    let margins = dn.defaultSankeyMargins;
    let formatComma = d3.format(",");
    let minNumberLimit = 0;

    let showHoverOver = this.ShowHoverOver;

    //--01b-- Remove the existing chart
    d3.select("#" + chartID).remove();

    //--02-- Adds the svg canvas
    let svg = this.DrawChartSVGCanvas(null, chartID, 0, 0, chartWidth, chartHeight, margins.left, margins.top);

    //--XX-- Check that we have some data to present!  We do this after the drawing of the SVG canvas as that should wipe it clean
    if (chartData.nodes.length === 0 || chartData.links.length === 0) {
        console.warn("dn.js - UpdateSankey - No nodes and / or links provided to UpdateSankey - quitting as there is no action to take.", chartData);
        return;
    }

    //--03-- Reset the margins after setting the SVG wrapper
    chartWidth = chartWidth - margins.left - margins.right;
    chartHeight = chartHeight - margins.top - margins.bottom;

    //--04-- Add the sankey diagram
    let sank = d3.sankey()
        // We are using the ID as the lookup value - could be parameterised if needed
        .nodeId(d => d.ID)
        // All Sankeys are justified be default - this could be parameterised if needed
        .nodeAlign(d3.sankeyJustify)
        // Organise the sankey diagram so that no layout iterations are required - this will keep the order of the nodes as provided.
        // if you want to let the Sankey do some work in making the diagram look prettier - then we can look at adding a sort function parameter to guide this
        .nodeSort(null)
        .nodeWidth(40)
        .nodePadding(10)
        // We remove the title from the height, plus a 7px buffer so that the Sankey has some space at the bottom of the chart ...!
        .extent([[0, 0], [chartWidth, chartHeight - dn.defaultTitleHeight - dn.defaultChartBuffer - 7]]);

    //--05-- Map our data
    let { nodes, links } = sank(chartData);

    //--06-- Add the nodes, setting an id and a blank data-a attribute which we use to store the selected total for each source and target node...
    let node = svg.append("g").selectAll(".SankeyNode")
        .data(nodes)
        .join("g")
        .attr("class", "SankeyNode")
        .attr("id", function (d) {
            return chartID + "_" + d.ID;
        });

    // Append the rectangles
    node
        .append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .style("fill", function (d) {
            return "#" + d.Colour;
        });


    //--07-- Add the links
    let link = svg.append("g").selectAll(".SankeyLink")
        .data(links)
        .join("g")
        .append("path")
        .attr("d", d3.sankeyLinkHorizontal()) //this is the method that does all the whizzy cool curves...

        .style("stroke-width", function (d) { return Math.max(1, d.width); })
        .sort(function (a, b) { return b.dy - a.dy; });


    //--08-- Style the links and update the selected count in the data-a attribute of the nodes
    link.attr("class", function (d) {
        // The default case is to use our generic Sankey css class; otherwise if there is filtering, we highlight the filtered links and fade the others
        let styleName = "";
        switch (d.IsFiltered) {
            case 1:
                styleName = "SankeyLinkFaded";
                break;
            case 2:
                styleName = "SankeyLinkHighlight";
                break;
            default: // is 0
                styleName = "SankeyLink";
        }
        return styleName;
    });

    //--09-- Wire up the onclick of the nodes to do the usual filtering
    node.selectAll("rect").on('click', function (v) {
        // Note that this is not the chart's chartID, but the source and target "chartID" as a Sankey combines two datasets...
        let chartID = v.ChartID;
        cg.DoFilter(chartID + "_" + v.ID);
    });


    //--09-- Add the labels using html with a tspan in a separate style for the values
    let paddingBetweenLabelAndNode = 6;
    node.append("text")
        .attr("x", function (d) { return d.x0 - paddingBetweenLabelAndNode; })
        .attr("y", function (d) { return d.y0 + (d.y1 - d.y0) / 2; })
        .attr("class", "SankeyTxtTitle")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .html(function (d) {
            let htmlStr = d.Name;
            if (d.value < minNumberLimit) {
                // do nothing
            } else {
                // Switch the value to be displayed depending on whether we are filtering or not
                let selectedValue = d.value;
                if (d.IsFiltering) {
                    selectedValue = d.CountFiltered;
                }
                htmlStr = htmlStr + "  <tspan class='SankeyTxtNum'>(" + formatComma(selectedValue) + ")</tspan>";
            }
            return htmlStr;
        })
        .filter(function (d) { return d.x0 < chartWidth / 2; })
        .attr("x", paddingBetweenLabelAndNode + sank.nodeWidth())
        .attr("text-anchor", "start");

    //--10a-- draw the hover over group of elements (do this last so it's on top...)
    let focus = this.DrawHoverOver(svg);

    //--10b-- Wire up the nodes
    node.on('mouseover', function (d) {
        focus.style("display", null);
    }).on('mouseout', function () {
        focus.style("display", "none");
    }).on('mousemove', function (d, i) {

        let coordinates = d3.mouse(this);
        // Switch the value to be displayed depending on whether we are filtering or not (if the values are the same only the total will be displayed)
        let selectedValue = d.value;
        if (d.IsFiltering) {
            selectedValue = d.CountFiltered;
        }
        showHoverOver(chartID, chartType, [coordinates[0], coordinates[1]], focus, d.Name, selectedValue, d.value);
    });

    //--10c-- Wire up the links
    link.on('mouseover', function (d) {
        focus.style("display", null);
    }).on('mouseout', function () {
        focus.style("display", "none");
    }).on('mousemove', function (d, i) {

        let coordinates = d3.mouse(this);
        showHoverOver(chartID, chartType, [coordinates[0], coordinates[1]], focus, d.source.Name + " -> " + d.target.Name, d.value, d.value);
    });

};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.DrawMap = function (chartData, chartDataSubGeographic) {

    // Set all the relevant variables from the global parameters
    let chartID = this.ChartID;
    let chartIDSubGeographic = this.ChartIDSubGeographic;
    let divID = this.DivID;
    let xLoc = this.OffsetX;
    let yLoc = this.OffsetY;
    let maxWidth = this.MaxWidth;
    let maxHeight = this.MaxHeight;
    let chartTitle = this.ChartTitle;

    let lookupList1 = this.Names1;

    this.ChartData = chartData;
    this.ChartDataSubGeographic = chartDataSubGeographic;

    let cg = this.ChartGroup;
    let c = this;

    let centroid = this.Centroid;
    let zoomLevel = this.zoomLevel;

    //-----0----- Remove any existing SVG with the same ID as this chart - this has become an issue when managing the resizing...
    this.RemoveExistingSVG();

    //--0-- Ensure that the DIV ID is set and use a good default if not ...
    if (!IsDefined(divID) || divID === "") {
        divID = "DataVis";
    }

    //--1-- Set sensible defaults ...
    maxWidth = (!IsDefined(maxWidth) || maxWidth === 0) ? 500 : maxWidth;
    maxHeight = (!IsDefined(maxHeight) || maxHeight === 0) ? 300 : maxHeight;

    if (!IsDefined(centroid)) {
        centroid = dn.defaultMapCentroid;
    }
    if (!IsDefined(zoomLevel)) {
        zoomLevel = dn.defaultMapZoomLevel;
    }

    //--2-- Create the relevant div wrapper ...
    let chartWrapper = this.DrawChartWrapper(divID, chartID, null, xLoc, yLoc, maxWidth, maxHeight, null, null);

    //-- Append the title and calculate the height reduction due to the title; note that with the maps, we want them to go right to the edge, so we dont include the chart buffer
    let heightReductionDueToTitle =
        (this.DrawChartTitle(chartWrapper, chartID, "ChartTitle", chartTitle)) ?
            dn.defaultTitleHeight : 0;

    let chartHeight = maxHeight - heightReductionDueToTitle;

     //-- Append the Map - we only want to append the map once (Jan-20), so we need to check if it existed already
    let mapWrapper = null;
    let mapWrapperID = chartID + "Map";
    let sizeHasChanged = false;

    if (d3.select("#" + mapWrapperID).empty()) {
        mapWrapper = chartWrapper.append("div")
            .attr("id", mapWrapperID);
    } else {
        mapWrapper = d3.select("#" + mapWrapperID);

        // get the current width and height (we do this to identify if the map has been resized)
        let currentW = dn.GetStyleDimension(mapWrapper, "width");
        let currentH = dn.GetStyleDimension(mapWrapper, "height");
        sizeHasChanged = (currentW !== maxWidth || currentH !== chartHeight);
    }

    //-- Append the Map extents
    mapWrapper
        .style("left", "0px")
        .style("top", "0px")
        .style("width", maxWidth + "px")
        .style("height", chartHeight + "px");

    //-- Add the hover over object ... if it didnt already exist (we only want one of these objects!)
    if (d3.select("#" + chartID + "Hover").empty()) {
        chartWrapper.append("div")
            //    d3.select("#" + chartID + "Div").append("div")
            .attr("id", chartID + "Hover")
            .attr("class", "MapHoverBox");
    }

    //--3-- Create the map ... (but only if it does not already exist)
    let meep = cg.meep;

    if (IsDefined(cg.meep)) {
        // Do nothing, unless the size has changed, in which case we recentre the view by invalidating the size
        if (sizeHasChanged) {
            meep.invalidateSize(true);
            // The fly to seems to be unnecessary!
//            meep.flyTo(centroid, zoomLevel);
            //meep.setView(centroid, zoomLevel, true); // Without animation, but results in a brief map flicker...
        }

    } else {

        // set the default view
        meep = L.map(chartID + "Map").setView(centroid, zoomLevel);

        // Set the attribution prefix
        meep.attributionControl.setPrefix('<a href="http://leafletjs.com" title="Produced using Leaflet maps" style="font-family:' + cg.defaultFont + ';">Leaflet.js</a> ');

        //-- Set the default tiles
        L.tileLayer(dn.mapTileURL,
            {
                attribution: ' <a href="https://www.mapbox.com/" style="font-family:' + cg.defaultFont + ';">&copy; Mapbox</a>',
                maxZoom: dn.defaultMapMaxZoomLevel,
                id: 'mapbox.streets',
                accessToken: dn.mapTileAccessToken
            })
            .addTo(meep);

        //-- Hide or show labels on zoomend depending on the zoom level (too far out means we want to hide them)
        meep.on('zoomend', function () {

            let zl = meep.getZoom();

            if (zl < dn.defaultMapLabelMinZoomLevel) {
                cg.mapLabelLayerGroup.clearLayers();
            } else {
                // Do nothing
            }

            // Always update the map!
            c.UpdateMap(cg.GetInfoIDNumericKey(c.ChartID));
        });

        // Create the label layer group (Nov-19 - moved into this group here)
        cg.mapLabelLayerGroup = new L.LayerGroup().addTo(meep);
    }
    // assign the map to the chartgroup (NOTE that this explicitly assumes there will be only one map)...
    cg.meep = meep;


    //--4-- Join the summary data with the geo list data
    c.JoinDataWithMapLookupList(chartData, lookupList1, 50);

    // get the total count
    let totalCount = cg.TotalCount(chartData);

    // Calculate the maximum bubble size and the coefficient to apply to all the other bubbles to get them scaled correctly.
    let coeff = c.CalculateBubbleCoefficient(zoomLevel);


    //--5-- Remove any existing bubbles from the map and clear the labels
    if (IsDefined(cg.mapMarkerList)) {
        for (let key in cg.mapMarkerList) {

            // Remove the bubble from the map
            meep.removeLayer(cg.mapMarkerList[key]); //.removeLayer(meep);
        }
        // then cleare the map marker list here
        cg.mapMarkerList = {};
        // And clear the map labels too
        cg.mapLabelLayerGroup.clearLayers();
    }


    //--6-- loop through the level 1 data and present it as a bubble on the map
    for (let i = 0; i < chartData.length; i++) {
        let v1 = chartData[i];

        //--6a-- If the count is greater than zero, then lets try to calculate the radius
        let radius = this.CalculateBubbleRadius(coeff, v1.Count);

        //--6b-- Get the percentage to present in the hover over and the label
        let perc = dn.GetPercent(v1.Count, totalCount, 0, true);
        // And then generate the text string to display
        let valueStr = dn.NumberWithCommas(v1.Count) + " (" + perc + "%)";

        // Dec-19 - if the ColumnChart slider is playing, we want to remove the map transitions too.
        // For the bubbles, the transition is embedded in CSS, so we need to add a custom CSS modifier MapMarkerNoTransition
        let cssNoTransition = "";
        if (this.GetTransitionDuration() === cg.transitionMSWhilePlaying) {
            cssNoTransition = " MapMarkerNoTransition";
        }


        //--6c-- Create the static grey bubble that will always show the max scale ...

        let chartID1 = chartID + "_" + v1.ID + "_1";
        cg.mapMarkerList[chartID1] = c.DrawBubble(
            chartID,
            v1.ID,
            // Remember tha the Centroid is latitude, longitude ...
            [v1.Latitude, v1.Longitude],
            "MapMarker1" + cssNoTransition,
            radius,
            v1.Title,
            valueStr
        );
        cg.mapMarkerList[chartID1].addTo(meep);

        // And the dyamic marker bubble that will change size if filtered
        let chartID2 = chartID + "_" + v1.ID + "_2";
        cg.mapMarkerList[chartID2] = c.DrawBubble(
            chartID,
            v1.ID,
            [v1.Latitude, v1.Longitude],
            "MapMarker2" + cssNoTransition,
            radius,
            v1.Title,
            valueStr
        );
        cg.mapMarkerList[chartID2].addTo(meep);

        //--6d-- Add a divIcon containing the label
        // Sep-19 - But only if the current zoom level is more detailed than the default minimum for labels (this is to avoid clutter)
        if (zoomLevel >= dn.defaultMapLabelMinZoomLevel) {
            c.DrawMapLabel([v1.Latitude, v1.Longitude], dn.defaultBubbleLabelOffsetX, dn.defaultBubbleLabelOffsetY, "MapLabel", "MapLabelText", v1.Title, valueStr)
                .addTo(cg.mapLabelLayerGroup);
        }
    }

};

//------------------------------------------------------------------------------------------------------------------
DNChart.prototype.UpdateMap = function (dataFiltered) {

    let cg = this.ChartGroup;
    let drawLabel = this.DrawMapLabel;

    //--0-- Lets get our bubble coefficient again - this could be stored in the DNChart object ...
    let zl = cg.meep.getZoom();
    let coeff = this.CalculateBubbleCoefficient(zl);

    // get the total count
    let totalCount = cg.TotalCount(dataFiltered);

    //--1-- Clear all the existing labels - we do this in a timeout so that the animation looks cool...
    setTimeout(function () {
        cg.mapLabelLayerGroup.clearLayers();
    }, this.GetTransitionDuration(true));

    //--2-- loop through the level 1 data and present it as a bubble on the map
    for (let i = 0; i < this.ChartData.length; i++) {
        let v1 = this.ChartData[i];

        //--2a-- Get the related object in the filtered data (which may not exist if there is no data for it) and calculate the count
        let v2 = dn.GetObjInList( dataFiltered, "ID", v1.ID);

        let tempCount = 0;
        if (IsDefined(v2)) {
            tempCount = v2.Count;
        }

        //--2b-- Get our new radius of the original data and our current filtered data
        let radius1 = this.CalculateBubbleRadius(coeff, v1.Count);
        let radius2 = this.CalculateBubbleRadius(coeff, tempCount);

        //--2c-- Get the percentage and the description text - two cases:
        // Case 1 - this map area (country etc) has not been sub-filtered (e.g by slicing by demographics), so the percentage should be the % of the current total filtered count
        // Case 2 - otherwise, we get the "local percentage" - i.e. the % of this object that is subfiltered ...
        let perc = 0;
        let str = "";
        if (v1.Count === tempCount) {
            perc = dn.GetPercent(tempCount, totalCount, 0, true);
            str = dn.NumberWithCommas(tempCount) + " (" + perc + "%)";
        } else {
            perc = dn.GetPercent(tempCount, v1.Count, 0, true);
            str = dn.NumberWithCommas(tempCount) + " of " + dn.NumberWithCommas(v1.Count) + " (" + perc + "%)";
        }

        //--2d-- Apply this new description text to the options value that is used to generate the hover over

        let mm1 = cg.mapMarkerList[this.ChartID + "_" + v1.ID + "_1"];
        let mm2 = cg.mapMarkerList[this.ChartID + "_" + v1.ID + "_2"];
        // Set the text, and apply the new radii for the original grey total (_1) and the filtered data (_2); and redraw the filtered data
        if (IsDefined(mm1)) {
            mm1.options.textValue = str;
            mm1.setRadius(radius1);
        }
        if (IsDefined(mm2)) {
            mm2.options.textValue = str;
            mm2.setRadius(radius2);
            mm2.redraw();
        }
        // Flag a warning if mm1 or mm2 were not defined
        if (!IsDefined(mm1) || !IsDefined(mm2)) {
            console.warn("No map markers for ID:", v1.ID, v1.Title);
        }

        //--2e-- Lastly add our label to appear above the circles, again in a timeout; but only if the user is sufficiently zoomed in
        // Sep-19 - updated to include a Min Zoom level to reduce the density of labels displayed
        if (zl >= dn.defaultMapLabelMinZoomLevel) {
            setTimeout(function () {
                drawLabel([v1.Latitude, v1.Longitude], dn.defaultBubbleLabelOffsetX, dn.defaultBubbleLabelOffsetY, "MapLabel", "MapLabelText", v1.Title, str)
                    .addTo(cg.mapLabelLayerGroup);
            }, this.GetTransitionDuration(true));
        }
    }
};

//------------------------------------------------------------------------------------------------------------------
// Gets the coefficient to scale the size of the bubbles between a min and a max, using the maximum value from the data and the maximum radius as a % of the width of the map
DNChart.prototype.CalculateBubbleCoefficient = function (currentZoomLevel) {

    /*
    // Get the maxWidth in metres.... This was needed with circles not circle markers as circles use the local lat long coordinate system.
    var dist = meep.distance(
        [meep.getCenter().lat, meep.getBounds().getEast()],
        [meep.getCenter().lat, meep.getBounds().getWest()]
    );
    // Max radius is 10% of this;
    let maxRadius = dist * 0.1;
    */

    // Lets experiment with the percentage - use the bubble radius as a minimum and then add when the difference increases...
    // We're using the cube of the difference here, which is pretty aggressive, but seems to work for country level datasets
    let radiusPercent = dn.defaultMapBubbleRadiusPercent +
        (((currentZoomLevel - dn.defaultMapZoomLevel) > 0) ? Math.pow((currentZoomLevel - dn.defaultMapZoomLevel), 3) : 0);

    // Max radius is 10% of the map width (updated in Sep-19 to use a global chart group parameter)
    let maxRadius = d3.select("#" + this.ChartID + "Map").node().getBoundingClientRect().width * radiusPercent / 100; // 0.1;
    let maxArea = Math.PI * Math.pow(maxRadius, 2);

    // Oct-19 How can we make this sticky???
    // Get the max data value so that we can produce our scalar ...
    let maxVal = 0;
    if (this.MapMaxValue > 0) {
        maxVal = this.MapMaxValue;
    } else {
        for (let i = 0; i < this.ChartData.length; i++) {
            if (this.ChartData[i].Count > maxVal) {
                maxVal = this.ChartData[i].Count;
            }
        }
    }

    // use a natural log on the max val to reduce it
    maxVal = Math.pow(maxVal, dn.defaultMapBubbleSizeModifier);

    let coeff = maxArea / maxVal;

    return coeff;
};


//------------------------------------------------------------------------------------------------------------------
/*
   Gets the bubble radius for a specific value given the coefficient (that will scale the bubble for the map width and relative to the maximum data value)
    The algorithm uses the area for comparison rather than the radius per se as the user sees the volume of the bubble
    The area coefficient is calculated by CalculateBubbleCoefficient and ensures that all bubbles are sized between a reasonable max and min size
    Both values should be numeric
*/
DNChart.prototype.CalculateBubbleRadius = function (areaCoefficient, dataVal) {

    let radius = 0;

    if (dataVal > 0) {

        // use a power or natural log on the max val to reduce it
        dataVal = Math.pow(dataVal, dn.defaultMapBubbleSizeModifier);

        let area = dataVal * areaCoefficient;

        // a = PI*r*r therefore r = SQRT(a/PI)
        radius = Math.round(Math.sqrt(area / Math.PI));

        // And catch reallllly small radii
        if (radius < dn.defaultMapMinRadius) {
            radius = dn.defaultMapMinRadius;
        }
    }

    return radius;
};


//------------------------------------------------------------------------------------------------------------------
DNChart.prototype.DrawBubble = function (chartID, objID, centroid, cssClass, radius, hoverTextTitle, hoverTextValue) {

    let cg = this.ChartGroup;

    //--1-- Lets get stuck in with producing the bubble
    let bubble = L.circleMarker(centroid, {
        textTitle: hoverTextTitle, // the first line of text
        textValue: hoverTextValue, // the second line of text
        className: cssClass,
        radius: radius
    });

    //--2-- And then add in the over, out and move mouse events to support the hover over
    bubble.on('mouseover', function (e) {
        d3.select("#" + chartID + "Hover").style("display", "inline");
    });
    bubble.on('mouseout', function (e) {
        d3.select("#" + chartID + "Hover").style("display", "none");
    });
    bubble.on('mousemove', function (e) {

        //--2a-- Build the text and get the estimate of it's length using the HTML 5 Canvas objects.
        let str = this.options.textTitle + ": " + this.options.textValue;
        let hoverWidth = dn.GetTextWidth(str, "13px " + cg.defaultFont) + 0;  // try also 11px ... Sep-19 - increased from 12px and reduced from 15 to 7

        //--2b-- Use the leaflet event object to get the X and Y of the mouse
        // Get the offset X and Y to push the hover object into the bottom right quadrant
        let mouseOffsetX = 12;
        let mouseOffsetY = 30;
        let hoverLeft = e.containerPoint.x + mouseOffsetX;
        let hoverTop = e.containerPoint.y + mouseOffsetY;

        //--2c-- Check that these are not beyond the extents of the map...
        let containerW = d3.select("#" + chartID + "Map").node().getBoundingClientRect().width;
        let containerH = d3.select("#" + chartID + "Map").node().getBoundingClientRect().height;

        let hoverHeight = d3.select("#" + chartID + "Hover").node().getBoundingClientRect().height;

        // Adjust if too far to the right
        if (containerW - hoverLeft - mouseOffsetX - 2 < hoverWidth) {
            hoverLeft = containerW - hoverWidth - mouseOffsetX - 2;
        }
        // Adjust if too far down
        if ((containerH - hoverTop + 30) < hoverHeight) {
            hoverTop = containerH - 2;
        }

        // NOTE - Too far to the left and too far up ~should~ not possible due to where the hover box is displayed (the bottom right hand quadrant)

        //--2d-- And finally lets actually display the hover object in the right place with our string
        d3.select("#" + chartID + "Hover")
            .style("left", hoverLeft + "px")
            .style("top", hoverTop + "px")
            .style("width", hoverWidth + "px")
            .html(str);

    });

    //--3-- And then lastly the usual style approach to doing the filtering...
    bubble.on('click', function (e) {
        cg.DoFilter(chartID + "_" + objID);
    });

    return bubble;
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.DrawMapLabel = function (centroid, offsetX, offsetY, cssClassWrapper, cssClassText, strTitle, strValue) {

    //-----XXX----- Add a divIcon containing the label
    // https://leafletjs.com/reference-1.3.4.html#icon
    // https://leafletjs.com/reference-1.3.4.html#divicon
    let theDivIcon = L.divIcon({
        className: cssClassWrapper,
        iconAnchor: [offsetX, offsetY],
        html: "<div class='" + cssClassText + "'>" + strTitle
            + ":</div><div class='" + cssClassText + "'>" + strValue + "</div>"
    });

    let label = L.marker(centroid, {
        icon: theDivIcon
    });

    return label;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.DrawHoverOver = function (svgObj) {

    //--1-- Create the group
    let focus = svgObj.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(-100, -100)") // Added Jan-20 to support the Sankey's
        .style("display", "none");

    //--2-- Create the background rectangle
    focus.append("rect")
        .attr("x", -10)
        .attr("y", -15)
        .attr("width", "100")
        .attr("height", "30")
        .attr("rx", 3)
        .attr("ry", 3)
        ;

    //--3-- Create the circle to show the current area being selected
    focus.append("circle")
        .attr("r", 4.5);

    //--4-- Create the placeholder for the text
    focus.append("text")
        .attr("x", 9)
        .attr("dy", ".35em");

    // return the focus object
    return focus;
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.ShowHoverOver = function (chartID, chartType, localCoordinates, focusObj, titleTxt, currentCount, totalCount) {

    let txtToDisplay = "";

    //-----1----- Build the text to display
    if (totalCount === currentCount) {
        txtToDisplay = titleTxt + ": " + dn.NumberWithCommas(totalCount);
    } else {
        // 16 Oct 2018 - finally added in the % here
        let percentage = (currentCount === 0 || totalCount === 0) ? 0 : Math.round(currentCount / totalCount * 100);

        txtToDisplay = titleTxt + ": " +
            dn.NumberWithCommas(currentCount) + " of " +
            dn.NumberWithCommas(totalCount) +
            " (" + percentage + "%)";
    }

    //-----2----- Set the text to display
    focusObj.select("text").text(txtToDisplay);

    //-----3----- Oct-18 use the text length to set the width of the background rectangle
    var rectLength = focusObj.select("text").node().getComputedTextLength() + 25;
    focusObj.select("rect").attr("width", rectLength);

    //-----4----- Check that the hover text doesnt exceed the boundaries of the chart and adjust if needed
    // Some of the thresholds here are a little rough and ready still.
    let chartWidth = +d3.select("#" + chartID).attr("width");
    let chartHeight = +d3.select("#" + chartID).attr("height");

    let minX = 0; //focusObj.select("rect").attr("x") * -1;
    let minY = +focusObj.select("rect").attr("y") * -1;
    let bottomBuffer = 60;


    // Do some little fiddles based on different charts - these are probably necessary as the extent of different charts is not quite right.
    if (chartType === 100) {
        chartWidth = chartWidth + 3;
        minY = 7;
    } else if (chartType === 200) { // Pie chart
        // if this is a pie chart, then the coordinate system is (0,0) in the middle, not top left, so need to adjust the extents accordingly...
        chartWidth = chartWidth / 2 + 8;
        chartHeight = chartHeight / 2;
        minX = minX + (chartWidth * -1);
        minY = minY + (chartHeight * -1) + 2;

        bottomBuffer = 18;

    } else if (chartType === 300) { // Line chart
        minY = 5;
        chartWidth = chartWidth - 52;
    } else if (chartType === 600) {
        chartWidth = chartWidth - 52;
        minY = 7;
        bottomBuffer = 40;
    }

    // And then make the relevant adjustments
    if (chartWidth - localCoordinates[0] < rectLength) { // Gone too far to the right
        localCoordinates[0] = chartWidth - rectLength;
    }
    if (localCoordinates[0] < minX) { // Gone too far to the left
        localCoordinates[0] = minX;
    }
    if (chartHeight - localCoordinates[1] < bottomBuffer) { // Gone too low
        localCoordinates[1] = chartHeight - bottomBuffer;
    }
    if (localCoordinates[1] < minY) { // Gone too high
        localCoordinates[1] = minY;
    }


    //-----5----- Move it
    focusObj.attr("transform", "translate(" + localCoordinates[0] + "," + localCoordinates[1] + ")");

};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
DNChart.prototype.AddSVGDropShadow = function (svgObj) {

    // Nov-19 - Make the dropshadows more configurable
    if (this.ChartGroup.showDropShadow === true) {

        // filters - see https://gist.github.com/cpbotha/5200394
        var filter = svgObj.append("filter")
            .attr("id", "drop-shadow")
            .attr("width", "170%")
            .attr("height", "170%");
        filter.append("feComponentTransfer")
            .attr("in", "SourceAlpha")
            .attr("out", "faded")
            .append("feFuncA").attr("type", "table").attr("tableValues", "0 0.4");
        filter.append("feGaussianBlur")
            .attr("in", "faded")
            .attr("stdDeviation", 2)
            .attr("result", "blur");
        filter.append("feOffset")
            .attr("in", "blur")
            .attr("dx", 2)
            .attr("dy", 2)
            .attr("result", "offsetBlur");
        var feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
            .attr("in", "offsetBlur");
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");
    }
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Pulls the title accross from the lookup list to the summary data (lists of objects with ID and Count attributes) and returns the data with the Title.
DNChart.prototype.ApplyTitleFromLookupList = function (chartData, lookupList, maxTxtLength, doCheckIndexes) {

    // This list of indexes is used for the pie charts to identify the values in the colour ramp to keep and the ones to ignore.
    var indexesInDataList = [];

    if (IsDefined(chartData)) {

        // Set the titles for each chart data object using the lookup lists
        for (let i = 0; i < chartData.length; i++) {
            let v1 = chartData[i];

            let tempTitle = v1.ID;

            if (IsDefined(lookupList)) {
                for (let j = 0; j < lookupList.length; j++) {
                    let v2 = lookupList[j];
                    // If we find a match, update the title and move on...
                    if (v1.ID === v2.ID) {
                        tempTitle = v2.Title;

                        // Optimise not doing this to save a few CPU cycles
                        if (IsDefined(doCheckIndexes) && doCheckIndexes === true && Contains(indexesInDataList, j) === false) {
                            indexesInDataList.push(j);
                        }

                        break;
                    }
                }
            }

            // Abbreviate it if needed ...
            if (!IsDefined(tempTitle)) {
                tempTitle = v1.ID;
            } else if (tempTitle.length > maxTxtLength) {
                tempTitle = tempTitle.substring(0, maxTxtLength) + "...";
            }
            v1.Title = tempTitle;
        }
    }

    return indexesInDataList;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Pulls the title, latitude and longitude accross from the lookup list to the summary data (lists of objects with ID and Count attributes) and returns the data with the Title.
// Note that this assumes that the ID will always be an integer - this is probably ok, but beware!
DNChart.prototype.JoinDataWithMapLookupList = function (chartData, lookupList, maxTxtLength) {

    if (IsDefined(chartData)) {

        // Set the titles for each chart data object using the lookup lists
        for (let i = 0; i < chartData.length; i++) {
            let v1 = chartData[i];

            let tempTitle = v1.ID;

            if (IsDefined(lookupList)) {

                // use array.prototype.find - this should be more efficient than an inner for loop.
                let v2 = dn.GetObjInList( lookupList, "ID", v1.ID);

                if (IsDefined(v2)) {
                    tempTitle = v2.Title;
                    v1.Latitude = v2.Latitude;
                    v1.Longitude = v2.Longitude;
                }
            }

            // Abbreviate it if needed ...
            if (!IsDefined(tempTitle)) {
                tempTitle = v1.ID;
            } else if (tempTitle.length > maxTxtLength) {
                tempTitle = tempTitle.substring(0, maxTxtLength) + "...";
            }
            v1.Title = tempTitle;
        }
    }
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// e.g. SE, rootSE, tempSE .... where rootSE and tempSE are arrays of the ID and data vals, in their original and filtered forms.
DNChart.prototype.UpdateBarChart = function (chartID, chartFullData, chartFilteredData) {

    //-----0----- Get the chart wrapper objects
    let chartObj = d3.select("#" + chartID);
    let chartDivObj = d3.select("#" + chartID + "Div");

    if (IsDefined(chartObj) && IsDefined(chartDivObj)) {

        //-----1----- Recreate the D3 x axis - we want to keep the same overall scale, but we need to rebuild it so that we can calculate the new height of the bars.
        // We store the two key attributes in data fields, so that we can reuse them here.  These define the limitations on the size of the chart.
        let yAxisCrossing = chartDivObj.attr("data-a");
        let widthBuffer = chartDivObj.attr("data-b");
        // The width stored will be the full width, so we need to take off the width buffer
        let width = chartObj.attr("width") - widthBuffer - yAxisCrossing;

        // Generate the x scale in pixels - also removing the space for the y axis and the names of the categories next to it.
        let x = d3.scaleLinear().range([0, width]);
        // keep the max range based on the full data
        x.domain([0, d3.max(chartFullData, function (d) { return d.Count; })]);

        //-----2----- Now iterate through the data and update the heights
        for (let i = 0; i < chartFullData.length; i++) {
            let v1 = chartFullData[i];

            // get each bar or data object in turn and set it to 0, or the val from the filtered data ....
            let tempObjIDtoMod = chartID + "_" + v1.ID + "_2";
            let newWidth = 0;

            //--2a-- Now find the value for this object in the filtered data and get the new value
            // Refectored to avoid the inner loop
            let v2 = dn.GetObjInList(chartFilteredData, "ID", v1.ID);
            if (IsDefined(v2)) {
                newWidth = v2.Count;
            }

            //--2b-- make a pretty transition to the new value ...
            d3.select("#" + tempObjIDtoMod)
                .transition().duration(this.GetTransitionDuration())  // originally 750
                .attr("data-a", newWidth) // Added Jan-20
                .attr("width", x(newWidth));

            //--2c-- Update the text values to be the filtered numbers
            d3.select("#" + chartID + "_" + v1.ID + "_4").text(dn.NumberWithCommas(newWidth));
        }
    }
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
// e.g. SE, rootSE, tempSE .... where rootSE and tempSE are arrays of the ID and data vals, in their original and filtered forms.
DNChart.prototype.UpdateMultiVariateBarChart = function (chartID, chartFullData, chartFilteredData) {

    // Multi Variate Column Chart - data has already been filtered, so we just need to update the column chart ...
    this.UpdateBarChart(chartID, chartFullData, chartFilteredData);

};

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// e.g. SE, rootSE, tempSE .... where rootSE and tempSE are arrays of the ID and data vals, in their original and filtered forms.
DNChart.prototype.UpdateColumnChart = function (chartID, chartFullData, chartFilteredData) {

    //-----0----- Get the chart wrapper objects
    let chartObj = d3.select("#" + chartID);
    let chartDivObj = d3.select("#" + chartID + "Div");

    if (IsDefined(chartObj) && IsDefined(chartDivObj)) {

        //-----1----- Recreate the D3 y axis - we want to keep the same overall scale, but we need to rebuild it so that we can calculate the new height of the bars.
        // We store the two key attributes in data fields, so that we can reuse them here.  These define the limitations on the size of the chart.
        let xAxisCrossing = chartDivObj.attr("data-a");
        let heightBuffer = chartDivObj.attr("data-b");
        // The height stored will be the full height, so we need to take off the height buffer
        let height = chartObj.attr("height") - heightBuffer - xAxisCrossing;

        // Generate the y scale in pixels - also removing the space for the x axis and the names of the categories underneath it.
        let y = d3.scaleLinear().range([0, height]);
        // keep the max range based on the full data
        y.domain([d3.max(chartFullData, function (d) { return d.Count; }), 0]);

        //-----2----- Now iterate through the data and update the heights
        for (let i = 0; i < chartFullData.length; i++) {
            let v1 = chartFullData[i];

            // get each bar or data object in turn and set it to 0, or the value from the filtered data ....
            let tempObjIDtoMod = chartID + "_" + v1.ID + "_2";
            // Note that our defaults are 0 for the height as this is already in pixels.  For the Y value we need to load that into our chart to get the actual value
            // It looks a bit weird in the logic below but it's because the chart origin is bottom left, while the SVG default is top left.
            let newHeight = 0;
            let newY = y(0);
            let filteredCount = 0; //v1.Count;

            //--2a-- Now find the value for this object in the filtered data and get the new value
            // Refectored to avoid the inner loop
            let v2 = dn.GetObjInList(chartFilteredData, "ID", v1.ID);
            if (IsDefined(v2)) {
                // Lets get the new height and Y attributes based on the filtered value
                newHeight = height - y(v2.Count);
                newY = y(v2.Count);
                filteredCount = v2.Count;
            }

            //--2b-- make a pretty transition to the new value ...
            d3.select("#" + tempObjIDtoMod)
                .attr("data-a", filteredCount) // Added Jan-20 to improve the hoverover numbers... we want to ensure that this gets actioned immediately
                .transition().duration(this.GetTransitionDuration())  // originally 750
                .attr("y", newY)
                .attr("height", newHeight);
        }
    }
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
// e.g. SE, rootSE, tempSE .... where rootSE and tempSE are arrays of the ID and data vals, in their original and filtered forms.
DNChart.prototype.UpdateLineChart = function (chartID, chartFullData, chartFilteredData) {

    //-----0----- Get the chart wrapper objects
    var chartObj = d3.select("#" + chartID);
    var chartDivObj = d3.select("#" + chartID + "Div");

    if (IsDefined(chartObj) && IsDefined(chartDivObj)) {

        //-----1----- Recreate the D3 x and y axis
        width = chartObj.attr("width");
        height = chartObj.attr("height");

        // get the data from the two specific data attributes
        var tempDataVA = chartDivObj.attr("data-a");
        var tempDataVB = chartDivObj.attr("data-b");

        width = width - (+tempDataVA);
        height = height - (+tempDataVB);

        // Parse the date / time
        var parseDate = d3.timeParse("%Y%m");

        // Set the ranges
        var x = d3.scaleTime().range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);

        // Scale the range of the data based on the full data
        x.domain(d3.extent(chartFullData, function (d) { return d.ID; }));
        y.domain([0, d3.max(chartFullData, function (d) { return d.Count; })]);

        // Define the line
        var timeline = d3.line().curve(d3.curveCardinal)
            .x(function (d) { return x(d.ID); })
            .y(function (d) { return y(d.Count); });


        //-----2----- Parse the filtered data
        chartFilteredData.forEach(function (d) {
            d.ID = parseDate(d.ID);
            d.Count = +d.Count;
        });

        //-----3----- now rebuild a line with the same start and end times, but using the filtered data, and 0 if the info is not available ...
        var tempData = [];
        for (let i = 0; i < chartFullData.length; i++) {
            let v1 = chartFullData[i];

            var tempV = new Object();
            tempV.ID = v1.ID;
            tempV.Count = 0;

            for (let j = 0; j < chartFilteredData.length; j++) {
                var v2 = chartFilteredData[j];

                if (v1.ID.getTime() === v2.ID.getTime()) {
                    tempV.Count = v2.Count;
                    break; // STOOOOP
                }
            }

            tempData.push(tempV);
        }

        //-----4----- And then lastly, lets add the timeline, with a little bit of animation, using our new temporary data
        d3.select("#" + chartID + "_2")
            .datum(tempData)
            .transition().duration(this.GetTransitionDuration())  // originally 750
            .attr("d", timeline);
    }
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
// e.g. SE, rootSE, tempSE .... where rootSE and tempSE are arrays of the ID and data vals, in their original and filtered forms.
DNChart.prototype.UpdatePieChart = function (chartID, chartFullData, chartFilteredData) {

    //-----0----- Get the chart wrapper objects
    let chartObj = d3.select("#" + chartID);
    let chartDivObj = d3.select("#" + chartID + "Div");

    if (IsDefined(chartObj) && IsDefined(chartDivObj)) {

        //-----1----- Rebuild the pie shell
        let width = chartObj.attr("width");
        let height = chartObj.attr("height");

        // get the data from the two specific data attributes
        let tempDataVA = chartDivObj.attr("data-a");
        let tempDataVB = chartDivObj.attr("data-b");
        let donutW = (IsDefined(tempDataVA)) ? +tempDataVA : dn.defaultPieDonutWidth;
        let pieBuffer = (IsDefined(tempDataVB)) ? +tempDataVB : dn.defaultPieMarginBuffer;

        // get the radius of the pie
        let radius = Math.min(width - pieBuffer, height - pieBuffer) / 2;

        // and now, set the desired arc of the pie charts ....
        let arc = d3.arc()
            .innerRadius(radius - donutW)
            .outerRadius(radius);

        let pie = d3.pie()
            .sort(null)
            .value(function (d) { return d.Count; });

        //-----2----- now lets get the dataset using the filtered data, with zeros for the full data where it exists (but still with all the values )
        let tempData = [];
        for (let i = 0; i < chartFullData.length; i++) {
            let v1 = chartFullData[i];

            var tempV = new Object();
            tempV.ID = v1.ID;
            tempV.Title = v1.Title;
            tempV.Count = 0;

            for (let j = 0; j < chartFilteredData.length; j++) {
                let v2 = chartFilteredData[j];
                if (v1.ID === v2.ID) {
                    tempV.Count = v2.Count;
                    break; // STOOOP
                }
            }

            tempData.push(tempV);
        }

        //-----3----- and now, replot the pie charts ....
        let pieObjIP = d3.select("#" + chartID);

        // Jan-20 - update the total
        pieObjIP.attr("data-a", d3.sum(chartFilteredData.map(function (d) {
            return d.Count;
        })));

        // And update the pie segments
        pieObjIP.selectAll("path")
            .data(pie(tempData))
            .transition()
            .duration(this.GetTransitionDuration())  // originally 750
//            .attrTween("d", arcTweenP);
            // fancy interpolation function for arcs ...
            .attrTween("d", function (a) {
                var i = d3.interpolate(this._current, a);
                this._current = i(0);
                return function (t) {
                    return arc(i(t));
                };
            });

    }
};



//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Used only when the bar chart contains stock figures, for which only one bar will be highlighted.  In DN, the visualisation is of stock figures when the singleOptionDimension is set
    Creates a slightly darker grey area on bars that are not currently selected so that the trend over time is visible.
*/
DNChart.prototype.DoColumnChartGhosting = function (chartID, chartFullData, chartFilteredData) {

    //-----0----- Get the chart wrapper objects
    let chartObj = d3.select("#" + chartID);
    let chartDivObj = d3.select("#" + chartID + "Div");

    if (IsDefined(chartObj) && IsDefined(chartDivObj)) {

        //-----1----- Recreate the D3 y axis - we want to keep the same overall scale, but we need to rebuild it so that we can calculate the new height of the bars.
        // We store the two key attributes in data fields, so that we can reuse them here.  These define the limitations on the size of the chart.
        let xAxisCrossing = chartDivObj.attr("data-a");
        let heightBuffer = chartDivObj.attr("data-b");
        // The height stored will be the full height, so we need to take off the height buffer
        let height = chartObj.attr("height") - heightBuffer - xAxisCrossing;

        // Generate the y scale in pixels - also removing the space for the x axis and the names of the categories underneath it.
        let y = d3.scaleLinear().range([0, height]);
        // keep the max range based on the full data (note that this might change in the future)
        y.domain([d3.max(chartFullData, function (d) { return d.Count; }), 0]);

        //-----2----- Now iterate through the data and update the heights
        for (let i = 0; i < chartFullData.length; i++) {
            let v1 = chartFullData[i];

            // get each bar or data object in turn and set it to 0, or the value from the filtered data ....
            let tempObjIDtoMod = chartID + "_" + v1.ID + "_5";
            // Note that our defaults are 0 for the height as this is already in pixels.  For the Y value we need to load that into our chart to get the actual value
            // It looks a bit weird in the logic below but it's because the chart origin is bottom left, while the SVG default is top left.
            let newHeight = 0;
            let newY = y(0);
            let filteredCount = 0; // v1.Count;

            //--2a-- Now find the value for this object in the filtered data and get the new value
            // Jan-20 - refactor to avoid the inner loop...
            let v2 = dn.GetObjInList(chartFilteredData, "ID", v1.ID);
            if (IsDefined(v2)) {
                // Lets get the new height and Y attributes based on the filtered value
                newHeight = height - y(v2.Count);
                newY = y(v2.Count);
                filteredCount = v2.Count;
            }

            //--2b-- make a pretty transition to the new value ...
            d3.select("#" + tempObjIDtoMod)
                .attr("data-a", filteredCount) // Added Jan-20 to improve the hoverover numbers... we want to make sure that this gets actioned immediately
                .transition().duration(this.GetTransitionDuration())  // originally 750
                .attr("y", newY)
                .attr("height", newHeight);
        }
    }
};


//-----------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Used only when the bar chart contains stock figures, for which only one bar will be highlighted.  In DN, the visualisation is of stock figures when the singleOptionDimension is set
    Creates a slightly darker grey area on bars that are not currently selected so that the trend over time is visible.
*/
DNChart.prototype.GetTransitionDuration = function (isMap) {

    let cg = this.ChartGroup;

    // Option 1 - set a reasonable default to use in case of a disaster with the two options below
    let transitionMS = 2000; // TEST

    if (IsDefined(cg)) {
        // Option 2a - use the default transition
        transitionMS = cg.transitionMSDefault;
        // Option 2b - use the default map transition
        if (IsDefined(isMap) && isMap === true) {
            transitionMS = dn.defaultMapTransition;
        }

        // Option 3 - if the vis includes a bar chart slider and it is playing, lets minimise these animations as they distract!
        if (IsDefined(cg.columnChartSlider) && cg.columnChartSlider.IsPlaying()) {
            transitionMS = cg.transitionMSWhilePlaying; // 1;
        }
    }

    return transitionMS;
};



/*
 * -----------------------------------------------------------------------------------------------------------------------------------------------------
    -----------------------------------------------------------------------------------------------------------------------------------------------------
    DNURLEditor - Gets and Sets the parameters in the page URL.
    Gets parameters also from parent pages where the visualisation is embedded in an IFrame.
    Logic is based on https://usefulangle.com/post/81/javascript-change-url-parameters
    -----------------------------------------------------------------------------------------------------------------------------------------------------
    -----------------------------------------------------------------------------------------------------------------------------------------------------
*/
// Our initialiser for the URL Editor
function DNURLEditor() {

}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
 * Apply the filters (if any) provided in the given (or the default is the current) page URL.
 * These will be of the form domain/page?ChartID1=a,b,c&ChartID2=x,y,z where the chart IDs are the usual 2 alpha code identifiers
 * We need to provide the list of chart IDs to look for as the charts have probably not been created if this is called in the pre filtering stage
 * Supplying the current URL is optional, while the chartIDList and the dnChartGroup are mandatory.
 * Logic is based on https://usefulangle.com/post/81/javascript-change-url-parameters
*/
DNURLEditor.prototype.URLApplyFilters = function (chartIDList, currentURL, dnChartGroup, doToggleSelectedObjects) {

    //--00-- Use the chart IDs and identify any changes, and pull out the most significant dimension to use..
    let chartType = 4;  // 1 is Stock, 2 is Pivot and 3 is Other
    let activeChartID = null;

    //--01-- If the dnChartGroup, or the chart ID List is not defined, lets just get out of here immediately...
    if (!IsDefined(dnChartGroup) || !IsDefined(chartIDList) || chartIDList.length===0) {
        return activeChartID;
    }

    //--02-- Only run this if this is a modern browser
    if (typeof URLSearchParams === "function" && IsDefined(chartIDList)) {

        //--03a-- if the current URL is null, then lets get it again here...  We have this option as the filtering etc that is conducted when the charts are loaded may have changed this.
        if (!IsDefined(currentURL)) {
            currentURL = new URL(window.location.href);
        }

        //--03b-- - If no parameters at all have been returned, and there is a single option dimension set, then lets get out of here
        let numParamsSet = 0;
        if (IsDefined(dnChartGroup.singleOptionDimension)) {
            // We go through each chart and see if any parameters related to this were set.
            for (let i = 0; i < chartIDList.length; i++) {
                let cValListStr = currentURL.searchParams.get(chartIDList[i]);
                if (IsDefined(cValListStr) && cValListStr !== "") {
                    numParamsSet++;
                }
            }
            if (numParamsSet === 0) {
                console.log("dn.js - No URL parameters were set, and there is a stock dimension, so not applying the URL filters", currentURL);
                return activeChartID;
            }
        }

        //--04-- loop through the list of given chart IDs
        for (let i = 0; i < chartIDList.length; i++) {

            let cID = chartIDList[i];
            let cValList = [];

            //--04a-- Identify what kind of chart this is - Stock single option, pivot or normal (the default is 3 == normal)
            let currentChartType = 3;
            if (dnChartGroup.IsSingleOptionDimension(cID, null) === true) {
                currentChartType = 1;
            } else if (dnChartGroup.IsPivotDimension(cID)) {
                currentChartType = 2;
            }

            //--04b-- get the value list and see if some values have been set and convert this to an array, ensuring that the numeric values are cast appropriately
            let cValListStr = currentURL.searchParams.get(cID);
            if (IsDefined(cValListStr) && cValListStr !== "") {

                cValList = cValListStr.split(",");

                // Ensure the numeric parameters are cast appropriately and count the number of parameters
                if (IsDefined(cValList) && cValList.length > 0) {
                    for (let j = 0; j < cValList.length; j++) {
                        // Sep-19 - Use regexp to see if this is a number, and if it is lets parse it as such...
                        if (/^\d+$/.test(cValList[j]) === true) {
                            cValList[j] = +cValList[j];
                        }
                    }
                }
            }

            //--04c-- And get the current/previous list (depends on your viewpoint right?!) for this chart ID from the objListToFilter
            let prevObjList = dnChartGroup.ObjectListToFilter(cID);

            //--04d-- This is the heart of the matter - we difference the two arrays to identify the union minus the intersection - i.e. the values unique to one list or the other
            let difference = [];
            if (!IsDefined(prevObjList) && !IsDefined(cValList)) {   // Case 1 - both lists are null, so ignore
                // Do nothing
            } else if (!IsDefined(prevObjList)) {                                // Case 2- the previous list is null, so just take the new list from the URL
                difference = cValList;
            } else if (!IsDefined(cValList)) {                                      // Case 3- the new list from the URL is null, so just take the previous list
                difference = prevObjList;
            } else {                                                                            // Case 4- do a differencing of the two array lists

                // This gets the union of both lists minus the intersection (i.e. the unique values)
                // https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
                difference =
                    prevObjList.filter(x => !cValList.includes(x))
                        .concat(
                            cValList.filter(x => !prevObjList.includes(x)));
            }
            // Check it...
            //console.log(cID, "difference: ", difference);

            //--04e-- Act on the difference if it contains more than one value; typically this will probably only contain one value, but it may contain more
            // E.g. changing a single option dimension would result in each array having one different value...
            if (difference.length > 0) {

                //--ACTION 1-- Update the active chart ID if this chart is more important than the one currently set
                if (currentChartType < chartType) {
                    chartType = currentChartType;
                    activeChartID = cID;
                }

                //--ACTION 2-- Toggle the selected object(s) on the chart
                if (IsDefined(doToggleSelectedObjects) && doToggleSelectedObjects === true) {
                    if (dnChartGroup.IsSingleOptionDimension(cID, null)) {
                        // We ignore the toggling if this is a single option dimension... as this will be well handled in chartGroup.ApplyFilter
                    } else {
                        for (let j = 0; j < difference.length; j++) {
                            dnChartGroup.ToggleSelected(cID, difference[j]);
                        }
                    }
                }

                //--ACTION 3-- Update the objects to filter list so it is up-to-date
                dnChartGroup.UpdateObjectIDsToFilter(cID, cValList, false);
            }
        }
    }

    // Then lastly, lets refilter the data if there is some filtering to do!
    if (IsDefined(activeChartID) && activeChartID !== "") {

        //--4-- Refilter the data - IDs from the same chart should be filtered as OR and IDs from different charts should be filtered as AND ...
        // WARNING - at this stage the filtered data will be potentially WRONG for dynamically generated data as this has not yet been regenerated
        // Normally we would call dnChartGroup.ApplyFilter after running this method to ensure that dynamically generated data is regenerated
        dnChartGroup.SetFilteredData(
            dnChartGroup.GetFilteredData(null)); //, null));
    }

    // Check it and return it...
    console.log("Active chart:", activeChartID, dnChartGroup.objsToFilter);
    return activeChartID;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Sep-2019 - Update the filters stored in the URL.  In this way the pages can be shared as is to enable better collaboration
// ObjListToFilter looks like [{ID:1234,Objs:[a,b,c]}, ...]
DNURLEditor.prototype.URLUpdate = function (objListToFilter, fullChartList) {

    //--1-- Only run this if this is a modern browser
    if (typeof URLSearchParams === "function") {

        //--2-- get the current URL
        let currentURL = new URL(window.location.href);

        let hasChanged = false;

        //--3-- Go through the objects to Filter and append / set / delete the parameters as needed.
        // which way to loop?
        for (let i = 0; i < objListToFilter.length; i++) {
            let obj = objListToFilter[i];
            let cID = obj.ID;


            //--3a-- Build the CSV list of objects
            let cObjList = "";
            if (IsDefined(obj.Objs) && obj.Objs.length > 0) {
                cObjList = obj.Objs.join(",");
            }

            let cValListStr = currentURL.searchParams.get(cID);

            //--3c-- If it exists - delete or update it; otherwise add it
            if (IsDefined(cValListStr) && cValListStr !== "") {

                //--3d-- Delete it if there are no current objects selected; otherwise update it.
                if (cObjList === null || cObjList === "") {               // Delete
                    currentURL.searchParams.delete(cID);
                    hasChanged = true;
                } else {                                                                    // Update
                    currentURL.searchParams.set(cID, cObjList);
                    hasChanged = true;
                }
            } else if (IsDefined(cObjList) && cObjList !== "") {          // Add
                currentURL.searchParams.append(cID, cObjList);
                hasChanged = true;
            }
        }


        //--4-- Then there is a case for ResetAll, where we need to delete the chart lists from the parameter query where it does not exist in the list of objects to filter anymore
        for (let i = 0; i < fullChartList.length; i++) {
            let cID = fullChartList[i].ChartID;

            let cValListStr = currentURL.searchParams.get(cID);

            // If it exists in the search string, but not in the list of objects to filter, then delete it
            if (IsDefined(cValListStr) && cValListStr !== "") {
                // originally - this.objsToFilter
                if (!IsDefined(dn.GetObjInList(objListToFilter, "ID", cID))) {
                    currentURL.searchParams.delete(cID);
                    hasChanged = true;
                }
            }
        }

        //--5-- If there have been changes, then lets update the URL
        if (hasChanged === true) {
            // See https://stackoverflow.com/questions/824349/how-do-i-modify-the-url-without-reloading-the-page
            window.history.pushState({}, null, currentURL);
        }

    }
};
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Sep-2019 - Update the filters stored in the URL.  In this way the pages can be shared as is to enable better collaboration
DNURLEditor.prototype.URLGetParameter = function (paramName) {

    let values = null;

    //--1-- Only run this if this is a modern browser
    if (typeof URLSearchParams === "function") {

        //--2-- get the current URL
        let currentURL = new URL(window.location.href);

        // Get the values associated with the given parameter
        let cValListStr = currentURL.searchParams.get(paramName);

        //--3c-- check it exists
        if (IsDefined(cValListStr) === true && cValListStr !== "") {

            values = cValListStr;

            // Convert the string into an array...
            if (values.indexOf(",") !== -1) {
                values = values.split(",");
            } else {
                values = [values];
            }

        } else {
            // Empty list!
            values = [];
        }
    }

    return values;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Shares the URL to the clipboard
DNURLEditor.prototype.URLShare = function () {

    //--1-- Only run this if this is a modern browser
    if (typeof URLSearchParams === "function") {

        //--2-- get the current URL and append it to a temporary input box - bit hacky, but see https://stackoverflow.com/questions/49618618/copy-current-url-to-clipboard
        let dummy = document.createElement('input');

        document.body.appendChild(dummy);
        dummy.value = window.location.href;
        dummy.select();

        //--3-- Copy it to the clipboard
        document.execCommand('copy');

        //--4-- Remove the temporary child element
        document.body.removeChild(dummy);

        //--5-- Inform the user
        ShowInfoSplash("The link to the current view has been copied to the clipboard", "InfoClassSuccess");
        HideInfoSplash(3000);
    }
};

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
DNURLEditor.prototype.GetParentUrl = function () {

    let isInIframe = (parent !== window),
        parentUrl = null;

    if (isInIframe) {
        parentUrl = document.referrer;
    }

    return parentUrl;
};


// The new SWEET ES6 class syntax does not yet minify well!
var dn = new DN();
