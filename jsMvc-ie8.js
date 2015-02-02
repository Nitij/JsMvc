; (function (w, d, undefined)
{    
    var _viewElement = null, //element that will be used to render the view    
        _defaultRoute = null;

    var jsMvc = function () {
        //mapping object for the routes
        this._routeMap = {};
    }

    //If Object.keys is not supported natively then use this function
    // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
    if (!Object.keys) {
        Object.keys = (function () {
            'use strict';
            var hasOwnProperty = Object.prototype.hasOwnProperty,
                hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
                dontEnums = [
                  'toString',
                  'toLocaleString',
                  'valueOf',
                  'hasOwnProperty',
                  'isPrototypeOf',
                  'propertyIsEnumerable',
                  'constructor'
                ],
                dontEnumsLength = dontEnums.length;

            return function (obj) {
                if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                    throw new TypeError('Object.keys called on non-object');
                }

                var result = [], prop, i;

                for (prop in obj) {
                    if (hasOwnProperty.call(obj, prop)) {
                        result.push(prop);
                    }
                }

                if (hasDontEnumBug) {
                    for (i = 0; i < dontEnumsLength; i++) {
                        if (hasOwnProperty.call(obj, dontEnums[i])) {
                            result.push(dontEnums[i]);
                        }
                    }
                }
                return result;
            };
        }());
    }

    jsMvc.prototype.AddRoute = function (controller, route, template) {
        this._routeMap[route] = new routeObj(controller, route, template);
    }
    //Initialize the Mvc manager object to start functioning
    jsMvc.prototype.Initialize = function () {
        var that = this;
        var startMvcDelegate = getStartMvcDelegate.call(this);

        _viewElement = d.querySelector('[view]'); //get the html element that will be used to render the view        
        if (!_viewElement) return; //do nothing if view element is not found       

        //Set the default route
        _defaultRoute = this._routeMap[Object.keys(this._routeMap)[0]];

        //start the Mvc manager
        w.onhashchange = startMvcDelegate;
        startMvcDelegate();
        //this.Start();
    }

    //Get the Mvc delegate
    function getStartMvcDelegate() {
        var that = this;
        return function () {
            startMvc.call(that);
        }
    }

    //Start the Mvc manager object to start functioning
    jsMvc.prototype.Start = function () {
        var startMvcDelegate = startMvc.bind(this);
        startMvcDelegate();
        w.onhashchange = startMvcDelegate;
    }

    //Function to load external html data
    function loadTemplate(routeObject, view) {
        var xmlhttp;
        if (window.XMLHttpRequest)
        {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        }
        else
        {// code for IE6, IE5
            xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
        }
        xmlhttp.onreadystatechange = function ()
        {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
            {
                loadView(routeObject, view, xmlhttp.responseText);
            }
        }
        xmlhttp.open('GET', routeObject.template, true);
        xmlhttp.send();
    }

    //Function to load the view with the template
    function loadView(routeObject, viewElement, viewHtml) {
        var model = {};        
        routeObject.controller(model); //get the resultant model from the controller of the current route
        
        viewHtml = replaceToken(viewHtml, model); //bind the model with the view
        
        viewElement.innerHTML = viewHtml; //load the view into the view element
    }

    function replaceToken(viewHtml, model) {
        var modelProps = Object.keys(model),
            element = null;
        
        for (var i = 0; i < modelProps.length; i++) {
            element = modelProps[i];
            viewHtml = viewHtml.replace('{{' + element + '}}', model[element]);
        }        
        return viewHtml;
    }

    var routeObj = function (c, r, t) {
        this.controller = c;
        this.route = r;
        this.template = t;
    }

    //attach the mvc object to the window
    w['jsMvc'] = new jsMvc();

    //function to start the mvc support
    function startMvc()
    {
        var pageHash = w.location.hash.replace('#', ''),
            routeName = null,
            routeObj = null;                
        
        routeName = pageHash.replace('/', ''); //get the name of the route from the hash        
        routeObj = this._routeMap[routeName]; //get the route object        

        //Set to default route object if no route found
        if (!routeObj)
            routeObj = _defaultRoute;
        loadTemplate(routeObj, _viewElement, pageHash); //fetch and set the view of the route
    }
    
})(window, document);