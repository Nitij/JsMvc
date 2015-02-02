; (function (w, d, undefined)
{    
    var _viewElement = null, //element that will be used to render the view    
        _defaultRoute = null;

    var jsMvc = function () {
        //mapping object for the routes
        this._routeMap = {};
    }

    jsMvc.prototype.AddRoute = function (controller, route, template) {
        this._routeMap[route] = new routeObj(controller, route, template);
    }
    //Initialize the Mvc manager object to start functioning
    jsMvc.prototype.Initialize = function () {
        var startMvcDelegate = startMvc.bind(this);

        _viewElement = d.querySelector('[view]'); //get the html element that will be used to render the view        
        if (!_viewElement) return; //do nothing if view element is not found       

        //Set the default route
        _defaultRoute = this._routeMap[Object.getOwnPropertyNames(this._routeMap)[0]];

        //start the Mvc manager
        w.onhashchange = startMvcDelegate;
        startMvcDelegate();
        //this.Start();
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
        var modelProps = Object.getOwnPropertyNames(model);
            
        modelProps.forEach(function (element, index, array)
        {
            viewHtml = viewHtml.replace('{{' + element + '}}', model[element]);
        });
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