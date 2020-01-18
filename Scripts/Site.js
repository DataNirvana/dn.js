//------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    #########################################################################
    Core site code used in all pages
    Jan 2020 - Key modification is to switch from relying on JQuery to D3.

    #########################################################################
    Version:  January 2020 - v2.63
    #########################################################################
    Copyright © 2004-2020 Data Nirvana Limited

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

var jsVersion = 2.63;

// Checks if this is being viewed in a mobile (or tablet context)
// Useful browser check to help functionality to filter where there are STILL quirks!  Based on: http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
window.mobilecheck = function () {
    var check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};
var isMobile = window.mobilecheck();

// Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
// Firefox 1.0+
var isFirefox = typeof InstallTrigger !== 'undefined';
// At least Safari 3+: "[object HTMLElementConstructor]"
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
// Chrome 1+
var isChrome = !!window.chrome && !isOpera;
// Finds the specific version if IE since v5 - useful as HTML 5 functionality is only 12+
// http://tanalin.com/en/articles/ie-version-js/
// http://codepen.io/gapcode/pen/vEJNZN
// Original query much more succinct but does not work in IE12+
//var isIE = /*@cc_on!@*/false || !!document.documentMode;
function GetIEVersion() {
    var ieV = "";
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf('MSIE ');
    var trident = ua.indexOf('Trident/');
    var edge = ua.indexOf('Edge/');

    if (document.all && !document.compatMode) {     // 5.x
        ieV = "IE v5";
    } else if (document.all && !window.XMLHttpRequest) {      // 6 or older
        ieV = "IE v6";
    } else if (document.all && !document.querySelector) {       // 7 or older
        ieV = "IE v7";
    } else if (document.all && !document.addEventListener) { // 8 or older
        ieV = "IE v8";
    } else if (document.all && !window.atob) { // 9 or older
        ieV = "IE v9";
    } else if (document.all || msie > 0) { // 10 or older
        // IE 10
        //ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';
        let v = parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        ieV = "IE v" + v;
    } else if (trident > 0) {
        // IE 11
        //ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';
        var rv = ua.indexOf('rv:');
        let v = parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
        ieV = "IE v" + v;
    } else if (edge > 0) {
        // IE 12+ / Spartan
        //ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';
        let v = parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
        ieV = "IE v" + v;
    }
    return ieV;
}
var isIE = (GetIEVersion() !== "");

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Our EasyModal widget for the session expiration...
var emSesh = null;


//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Check if a variable is defined
function IsDefined(variable) {
    return (typeof variable !== 'undefined' && variable !== null);
}

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// Get the browser width and height
function WidthAndHeight() {
    //--00-- Get the width and height of the browser
    // Removed the window.innerwidth and inner height as these are not the right dimensions for mobile devices.
    let docWidth = document.documentElement.clientWidth || document.body.clientWidth;
    let docHeight = document.documentElement.clientHeight || document.body.clientHeight;

    // Alternative approach - compare the innerWidth with the above to get the scale and set the view port
    /*
        let clientWidth = document.documentElement.clientWidth;
        let clientHeight = document.documentElement.clientHeight;
        let scale = Math.round(clientWidth * 10 / docWidth) / 10;

        let viewport = document.querySelector("meta[name=viewport]");
        viewport.setAttribute("content", "width=device-width, initial-scale=" + scale + ", maximum-scale=1.0, user-scalable=0");
        console.log(docWidth, docHeight, scale);
    */

    return { docWidth, docHeight };
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// checks if an array contains a particularly value
function Contains(a, obj) {
    if (IsDefined(a)) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] === obj) {
                return true;
            }
        }
    }
    return false;
}


//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 0 = dont do a Information Not Saved Warning, 1 = do this on unload
// has to be referenced here rather than in the DataManipulation library as it is also called from CalendarControl and the SessionExpiryWarning here in Site.js
var DoUnloadCheck = 0;

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Go to the default page on session expiry ...
function DoAJAXSessionExpired() {
    this.location = "Default.aspx";
}


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
/**
* Adapted from easyModal.js v1.1.0 - A minimal jQuery modal that works with your CSS - Author: Flavius Matis
    Note that the default z-index for this overlay is 2000, so anything else must be more than this to be on top and visible - e.g. the Tooltips ...
    Jan 2020 - converted to use D3 as the base rather than JQuery
*/
function EasyModal(options) {

    this.top = IsDefined(options.top) ? options.top : 'auto';
    this.overlayOpacity = IsDefined(options.overlayOpacity) ? options.overlayOpacity : 0.5;

    this.overlayColor = IsDefined(options.overlayColor) ? options.overlayColor : '#000';
    this.overlayClose = IsDefined(options.overlayClose) ? options.overlayClose : true;
    this.overlayParent = IsDefined(options.overlayParent) ? options.overlayParent : 'body';
    this.closeOnEscape = IsDefined(options.closeOnEscape) ? options.closeOnEscape : true;
    this.closeButtonClass = IsDefined(options.closeButtonClass) ? options.closeButtonClass : '.close';
    this.transitionDuration = IsDefined(options.transitionDuration) ? options.transitionDuration : 750; // Fade in and out speed in ms ...
    this.onOpen = IsDefined(options.onOpen) ? options.onOpen : null; // A specific function call
    this.onClose = IsDefined(options.onClose) ? options.onClose : null; // A specific function call

    // the modal div ID = Has to be Set!!!
    this.modalDivID = options.modalDivID;

    // the overlay - will be created the first time in OpenModal
    this.overlay = null;

    // Store this so we can remove it  - will be created the first time in OpenModal
    this.keyDownFunction = null;
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
EasyModal.prototype.OpenModal = function () {

    // our EasyModal widget
    let em = this;

    if (IsDefined(em.onOpen)) {
        em.onOpen();
    }

//    this.modalDivID = modalDivID;
    let modalDiv = d3.select("#" + this.modalDivID);

    // Create the wrapper
    let overlay = d3.select(this.overlayParent).select(".lean-overlay");
    if (overlay.empty()) {
        overlay = d3.select(this.overlayParent).append("div").attr("class", "lean-overlay");

        // hide on click on the overlay...
        overlay.on("click", function (v) {
            em.CloseModal();
        });

        // hide on click on the modal...
        modalDiv.on("click", function (v) {
            d3.event.preventDefault();
            em.CloseModal();
        });

        // create the on key down function
        this.keyDownFunction = e => {
            if (overlay.IsVisible && e.keyCode === 27) {
                em.CloseModal();
            }
        };
    }

    // hide on escape (wired to the html body)
    if (this.closeOnEscape) {
        document.body.addEventListener("keydown", this.keyDownFunction);
    }

    // Style the overlay appropriately
    overlay
        .style('display', 'none')
        .style('position', 'fixed')
        .style('z-index', 2000)
        .style('top', 0)
        .style('left', 0)
        .style('height', 100 + '%')
        .style('width', 100 + '%')
        .style('background', this.overlayColor)
        .style('opacity', this.overlayOpacity);

    // Calculate the placement of the div to display (left and top)
    let { docWidth, docHeight } = WidthAndHeight();

    let w = +(modalDiv.style("width").replace("px", ""));
    let h = +(modalDiv.style("height").replace("px", ""));

    let l = docWidth / 2 - w / 2;
    let t = docHeight / 2 - h / 2;

//    console.log(l, t, w, h);

    // Style the modal div location
    modalDiv
        .style('display', 'inline')
        .style('opacity', 1)
        .style('position', 'fixed')
        .style('z-index', 2001)
        .style('left', l + 'px')
        .style('top', t + 'px');

    overlay
        .style('display', 'block')
        .style('margin-left', -(modalDiv.attr("width") / 2) + 'px')
        .style('margin-top', (parseInt(overlay.attr("top")) > -1 ? 0 : -(modalDiv.attr("height") / 2)) + 'px');

    // Now fade in the modal Div
    this.overlay = overlay;
    this.overlay.IsVisible = true;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
EasyModal.prototype.CloseModal = function () {
    // our EasyModal widget
    let em = this;

    em.overlay.IsVisible = false;

    // remove the key down event listener
    document.body.removeEventListener("keydown", em.keyDownFunction);

    // Fade out the modal div and the overlay...
    d3.select("#" + em.modalDivID)
        .transition().duration(em.transitionDuration)
        .style("opacity", 0);

    em.overlay.transition().duration(em.transitionDuration)
        .style("opacity", 0);

    // And then hide them and reset the opacity
    window.setTimeout(function () {
        em.overlay.style('display', 'none').style("opacity", em.overlayOpacity);
        d3.select("#" + em.modalDivID).style('display', 'none').style("opacity", 1);

    }, em.transitionDuration);

    if (IsDefined(em.onClose)) {
        em.onClose();
    }


};




//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
var emLockScreen = null;
/*
    Lock screen used to stop people double clicking when lengthier processes have been requested!
    520 bytes that will now not be loaded in each and every page!
    18-Apr-2016 - added the ability to dynamically set the background color as there are now some cases where we dont want a background colour
    e.g. when pages changing quickly as it looks too jumpy!
    Normally called in document.ready.  Initialises the modal div with the easy modal triggers
*/
function InitialiseLockButtonsModal(customBackgroundCol) {

    let backgroundCol = (IsDefined(customBackgroundCol) || customBackgroundCol === "") ? "#333" : customBackgroundCol;

    // special case if the backgroundCol is "transparent", then we need to set the overlayOpacity to zero too
    let opacity = (backgroundCol.toLowerCase() === "transparent") ? 0.0 : 0.3;

    // If the top is not set, then it will automatically set to the middle of the page, which is what we want ...
    emLockScreen = new EasyModal({
        modalDivID: "LBD",
        autoOpen: false,
        fadeSpeed: 300,
        overlayOpacity: opacity,
        overlayColor: backgroundCol,
        overlayClose: true,
        closeOnEscape: true
    });
}
//--
function ShowLockButtonsModal(customBackgroundCol) {

    InitialiseLockButtonsModal(customBackgroundCol);

    emLockScreen.OpenModal();
}
//--
function HideLockButtonsModal() {
    emLockScren.CloseModal();
}



//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
/*
    Session expiry window - when the user reaches a predefined time limit on the page (probably the session expiry limit minus the 2 minute countdown period at the end),
    a modal window pops up with the session expiry window, giving the user the option to stay logged in or to log out.
    The modal window helpfully counts down the remaining time before the session is ended.

    This is the javascript to help facilitate the html in the SessionExpiryWarning user control.
    It is included here as then this is 2,584 bytes that will now not be loaded in each and every page!

*/
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// The timeout IDs
var sessTOID1 = "";
var sessTOID2 = "";
// The default document title and its temporary replacement.  These are used to "blink" the title to draw attention that that tab's content is expiring.
var sessDocTitle = document.title;
var sessDocTitleTemp = "Session Expiring";
// The timeout duration (probably the session expiry limit minus the 2 minute countdown period at the end)
var sessTimeoutMS = 0;
// The countdown period
var sessDefaultCountdown = 120;
// The counter used to store the countdown if this expiry warning limit is reached
var sessFinalCountdown = 120;
// The two "outcome" URLs, one to keep the session alive and one to manage the logout
var sessKeepAliveURL = "Default.aspx";
var sessLogoutURL = "";
// The time when the page containing this JS was first loaded.
var sessPageStartMS = 0;
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    This function starts the session timeout check within a page.  Simply sets the current time in the page and calls the next method in the chain
    (ShowSessTimeoutModal)
*/
function StartSessTimeout() {
    sessPageStartMS = (new Date()).getTime();
    sessTOID1 = window.setTimeout("ShowSessTimeoutModal();", sessTimeoutMS);
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Displays the session time out warning and checks whether the session has timed out.  If it has, the user is redirected to the logout page.
    Otherwise the session countdown is initiated.
*/
function ShowSessTimeoutModal() {

    //-----a----- Display the session timeout warning
    emSesh.OpenModal();

    //-----b----- If the session has timed out, then lets logout immediately, otherwise, we start the countdown to the actual session expiry
    if (SessHasTimedOut()) {
        SessLogout();
    } else {
        SessCountdown(false);
    }
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    This function determines if too much time has elapsed and the session has therefore timed out.
    It does this by comparing the server side set session interval with the current time and the time when the page was first loaded.
    Returns true if it has timed out.
*/
function SessHasTimedOut() {
    let nowMS = (new Date()).getTime();
    // Determine whether the current time less the time when the page first loaded is more than the timeout interval (normally 58 mins) plus the session countdown at the end (normally two mins)
    let hasTimedOut = ((nowMS - sessPageStartMS) > (sessTimeoutMS + (sessDefaultCountdown * 1000)));
    //console.log((nowMS - sessPageStartMS) + "    " + sessTimeoutMS + "    " + (sessTimeoutMS + (sessDefaultCountdown * 1000)));

    return hasTimedOut;
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Conducts one iteration of the countdown, by toggling the title of the tab to raise awareness if the user is browsing elsewhere, and also
    updates the session countdown number of seconds in the modal window.
    To finish, the method calls itself to repeat every second.
    doDefault is a boolean that determines which title to show (the warning or the default title)
*/
function SessCountdown(doDefault) {
    //-----a----- reduce the number of seconds by one and logout if we reach zero OR the elapsed time from the page load is too great.
    // The second option could happen if e.g. the user is browsing from a laptop, closed the laptop partway through the warning message and then reopened it
    // some minutes/hours/days later by which time the session has of course expired.
    sessFinalCountdown--;
    if (sessFinalCountdown < 0 || SessHasTimedOut()) {
        SessLogout();
    } else {
        //-----b----- Set the html
        d3.select("#CountDown").html("" + sessFinalCountdown);
        //-----c----- Set the document title
        document.title = (doDefault) ? sessDocTitle : sessDocTitleTemp;
        //-----d----- Call this method again in one seconds time, and reverse the doDefault method
        sessTOID2 = window.setTimeout("SessCountdown(" + !doDefault + ");", 1000);
    }
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Called when the user says "I want to stay in this session", showing they are still actively browsing.
    All it does is close the modal window.  If you look at the OnReady code at the bottom of this library, you will see that closing the modal
    window triggers the SessKeepAlivePoll method automatically, which actually posts to the server to make sure the session is reinvigorated.
*/
function SessKeepAlive() {
    emSesh.CloseModal();
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Does the ajax call to the server to request a page deriving from the MGLBasePage, that keeps the session alive.
*/
function SessKeepAlivePoll() {

//    console.log("SessKeepAlivePoll", sessKeepAliveURL + "?t=" + new Date().getTime());
    // Ensure it is unique...
    d3.text(sessKeepAliveURL + "?t=" + new Date().getTime()).then(function (text) {
        SessKeepAlivePollSuccess();
    }).catch(function (error) {
        // handle error   
    });
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Once the response is recieved from the SessKeepAlivePoll call, this method is triggered.
    All this method does is reset all the window timeout calls if any are still active, reset the document title and the session countdown.
    MOST IMPORTANTLY, this method then calls the first method StartSessTimeout, to reset the page load time so that we have a new "zero"
    time for the session.
*/
function SessKeepAlivePollSuccess() {
    SessKeepAliveFinish();
    sessFinalCountdown = sessDefaultCountdown;
    StartSessTimeout();
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Cleans up the page timeouts and resets the document title.  Called if the user has requested to keep the session alive and onBeforeUnload
    if another page has been requested.
*/
function SessKeepAliveFinish(e) {
    window.clearTimeout(sessTOID1);
    window.clearTimeout(sessTOID2);
    document.title = sessDocTitle;
    return;
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    If the session has expired, this method is called and if the beforeUnload is bound, this is unbound and any constraints on the page
    unloading (e.g. the DoUnloadCheck) are also removed.  The method then redirects the user to the logout page.
*/
function SessLogout() {

    window.removeEventListener("beforeunload", SessKeepAliveFinish);

    if (typeof DoUnloadCheck !== 'undefined') {
        DoUnloadCheck = 0;
    }
    window.location = sessLogoutURL;
}



//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
/*
    InfoSplash javascript to turn on and off the views ... - note that the ID has to be static as it is assumed there is only one on each page...
    469 bytes that will now not be loaded in each and every page!
*/
function ShowInfoSplash(message, displayClass) {

    // Set the content class and message
    d3.select("#InfoSplashContent")
        .attr("class", displayClass)
        .html(message);

    // set the wrapper to be an inline block...
    d3.select("#InfoSplash").style("display", "inline-block").style('opacity', 1);
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function HideInfoSplash(timeMS) {
    if (!IsDefined(timeMS) || timeMS === 0) {
        timeMS = 3000;
    }

    // Slowly hide it
    d3.select("#InfoSplash").transition().duration(timeMS).style("opacity", 0);
    // And then hide them and reset the opacity
    window.setTimeout(function () {
        d3.select("#InfoSplash").style('display', 'none').style("opacity", 1);
    }, timeMS);
}


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Functions that are used in almost all pages follow

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Local storage methods - most are specific to the photo management
    Check for local storage  if (storageAvailable('localStorage')) {
*/
function StorageAvailable(type) {
    try {
        let storage = window[type];
        let x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return false;
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Used in sites like IDPGrievances to ensure that two sibling divs have the same height - e.g. a main page and a sidebar.        
*/
function UpdateDivLengthOnResize() {

    let ele1 = document.getElementById("DefaultTable");
    let elem1Rect = ele1.getBoundingClientRect();
    let ele2 = document.getElementById("PositionFinder");
    let elem2Rect = ele2.getBoundingClientRect();

    // Calculate the offset height as the top of the position finder div - the top of the containing table
    let offset = elem2Rect.bottom - elem1Rect.top;
    let minHeight = 600;
    if (offset < minHeight) { offset = minHeight; }
    d3.select("#MainDiv").style("height", offset);
    d3.select("#SideDiv").style("height", offset);
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Checks if a css class rule has been defined in the current context
    REMEMBER to add the "." or "#" when passing in the classToCheck ....!

    http://stackoverflow.com/questions/983586/how-can-you-determine-if-a-css-class-exists-with-javascript
    document.styleSheets[].rules[].selectorText
    document.styleSheets[].imports[].rules[].selectorText
*/
function CssClassExists(classToCheck) {
    // check that we have some stylesheets to check!
    if (!IsDefined(document.styleSheets)) {
        // This is surely some kind of disaster, but lets return true for now!
        return true;
    } else {

        // loop through the stylesheets, if there are more than one
        for (var i = 0; i < document.styleSheets.length; i++) {
            // loop through the rules in each of these stylesheets
            let rules = document.styleSheets[i].rules || document.styleSheets[i].cssRules;

            if (!IsDefined(rules)) {
                // This is surely some kind of disaster, but lets return true for now!
                return true;
            } else {
                for (var j = 0; j < rules.length; j++) {
                    // compare the selectorText with the text provided into the method ...
                    let tempTxt = rules[j].selectorText;
                    if (tempTxt === classToCheck) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Animates the hover over for the MGLK buttons, the linkObj is a jQuery object and isHover is true for the OnHover, otherwise false
function ResetHoverImage( linkObj, isHover ) {

    //var im = $(this).find('img');
    if (IsDefined(linkObj)) {
        let im = linkObj.find('img');

        if (isHover === true) {
            if (IsDefined(im)) {
                let cSrc = im.attr('src');
                let hSrc = cSrc.replace(".png", "H.png").replace(".jpg", "H.jpg").replace(".gif", "H.gif");
                im.attr('src', hSrc);
            }
        } else {
            if (IsDefined(im)) {
                let hSrc = im.attr('src');
                let cSrc = hSrc.replace("H.png", ".png").replace("H.jpg", ".jpg").replace("H.gif", ".gif");
                im.attr('src', cSrc);
            }
        }
    }
}


//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
    Gets the Year and Month in the form 201909 for September 2019
*/
function YearMonth() {
    let d = new Date();

    let ym = d.getFullYear().toString();
    let m = d.getMonth() + 1;
    if (m < 10) {
        ym = ym + "0";
    }
    ym = ym + m.toString();

    return ym;
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// All the generic JS that should be loaded ONCE the page has loaded ...
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
document.addEventListener("DOMContentLoaded", function (event) {
    
    emSesh = new EasyModal({
        modalDivID: "SessDiv",
        overlayOpacity: 0.3,
        overlayColor: "#333",
        overlayClose: true,
        closeOnEscape: true,
        onClose: SessKeepAlivePoll
    });

    // Bind the Sess finish method to before unload to clean things up
    window.addEventListener("beforeunload", SessKeepAliveFinish);

});


