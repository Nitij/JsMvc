
;
(function ( w, d, undefined ) {

    //Flag to indicate if the Mvc manager object can start functioning or not
    var _start = false;
    
    //location object
    var _loc = w.location;
    
    //gets the origin of the current url
    var _origin = _loc.origin;

    //Failsafe for stupid internet explorer
    if ( !_origin ) {
        _origin = _loc.protocol
            + "//" + _loc.hostname
            + ( _loc.port ? ':' + _loc.port : '' );
    }
    
    //gets the pathname of the current url
    var _pathName = _loc.pathname;

    //get the hash of the current url
    var _hash = _loc.hash;

    //Object to store the default route
    var _defaultRoute = null;

    //element that will be used to render the view
    var _viewElement = null;

    //Flag to determine if the view has been rendered from the controller or not.
    var _rendered = false;

    //Main Mvc manager object
    /** @constructor */
    var jsMvc = function () {
        //mapping object for the routes
        this._routeMap = {};
    }

    jsMvc.prototype.AddRoute = function ( controller, route, template ) {
        var routeName = getRouteName( route );
        this._routeMap[getRouteName( route )] = new routeObj( controller, route, template );
    }

    jsMvc.prototype.AddDefault = function ( controller, route, template ) {
        _defaultRoute = new routeObj( controller, route, template );
    }

    //Initialize the Mvc manager object to start functioning
    jsMvc.prototype.Initialize = function () {
        _start = true;
        
        //if we have only one route then make it the default one
        var allRoutes = Object.getOwnPropertyNames( this._routeMap );
        if ( allRoutes.length >= 1 && _defaultRoute === null )
            _defaultRoute = this._routeMap[allRoutes[0]];

        //start the Mvc manager
        this.Start();
    }

    //Start the Mvc manager object to start functioning
    jsMvc.prototype.Start = function () {
        var startMvcDelegate = startMvc.bind( this );
        startMvcDelegate();
        w.onhashchange = startMvcDelegate;
    }

    //Returns the name of the route from the route hash.
    function getRouteNameFromHash( routeHash ) {
        var routeParts = getHashArray( routeHash );
        if ( routeParts.length >= 2 )
            return routeParts[1]
        else
            throw 'Route name cannot be retrieved, hash path is empty';
    }

    //Returns the name of the route from the route path.
    function getRouteName( route ) {
        var routeParts = getHashArray( route );
        if ( routeParts.length >= 1 )
            return routeParts[0]
        else
            throw 'Route name cannot be retrieved, route path is empty';
    }

    //return the hash of a route based on the route name
    function getRouteHash( routeName ) {
        var hash = [];
        var hashParts = null;
        var routeObj = null;
        
        if ( !routeName ) {
            //if no routename is there then use the default route
            routeObj = _defaultRoute;
            hashParts = getHashArray(routeObj.route);
            
            //start constructing the hash 
            hash.push( '#' );
            for ( var i = 0; i < hashParts.length; i++ ) {
                hash.push( '/' )
                hash.push( hashParts[i] );
            }

            //return the final constructed hash
            return hash.join( '' );
        }
        else {
            //else fetch the route object based on its name
            routeObj = this._routeMap[routeName];
            if (isNullOrUndefined(routeObj))
                return;
        }
    }

    //Funcion that returns array by splitting hash parts
    function getHashArray( hash ) {
        return hash.split( '/' );
    }

    //Determines if a value is null or undefined
    function isNullOrUndefined( value ) {
        return ( value === null || value === undefined );
    }

    //Ajax function to load external html data
    function loadTemplate( routeObject, view, pageHash ) {
        var xmlhttp;
        if ( window.XMLHttpRequest ) {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        }
        else {// code for IE6, IE5
            xmlhttp = new ActiveXObject( 'Microsoft.XMLHTTP' );
        }
        xmlhttp.onreadystatechange = function () {
            if ( xmlhttp.readyState == 4 && xmlhttp.status == 200 ) {                
                loadView( routeObject, pageHash, view, xmlhttp.responseText );
                console.log( 'Loaded' );
            }
        }
        xmlhttp.open( 'GET', routeObject.template, true );
        xmlhttp.send();
    }

    //Function to load the view with the template
    function loadView( routeObject, pageHash, viewElement, viewHtml ) {
        var model = {},
            params = {},
            sourceParmas = routeObject.params,
            modelBindings = [],
            renderViewDelegate = renderView.bind(renderView, viewElement, viewHtml, model),
            view = new viewContainer(renderViewDelegate);            

        //reset the flag
        _rendered = false;

        //get the hash array so as to get the different pats 
        var hashArray = getHashArray( pageHash );

        //if first element is empty string then remove it
        if ( hashArray.length > 0 && hashArray[0] === '' ) {
            hashArray.splice( 0, 1 );
        }
        
        //if we have any parameters in the source route path then construct
        //a params object and pass it on to the controller
        if ( sourceParmas.length > 0 ) {
            
            //add the route parameters to the params object as properties
            for (var i = 0; i < sourceParmas.length; i++ ) {
                params[sourceParmas[i]] = hashArray[i + 1];
            }

            //pass on the model as well as params object to be used by the controller function
            //Set the view container as the controller function's scope 
            //so that the controller can render the when view when it wants it to.
            routeObject.controller(view, model, params);
        }
        else {
            //get the resultant model from the controller of the current route
            routeObject.controller(view, model);
        }

        //If the view is not in async mode and is not rendered from the controller function then render it from here
        if (!view.isAsync && !_rendered)
            renderView(viewElement, viewHtml, model)
    }

    function renderView(viewElement, viewHtml, model) {
        //bind the model with the view
        viewHtml = replaceToken(viewHtml, model);

        //load the view into the view element
        viewElement.innerHTML = viewHtml;

        //Set the _rendered flag to true indicating that the view has been rendered
        _rendered = true;
    }

    //View Container Object
    /** @constructor */
    var viewContainer = function (renderDelegate) {
        this.render = renderDelegate;
        this.isAsync = false;
    }

    //Route Object
    /** @constructor */
    var routeObj = function ( c, r, t ) {
        var routeParams = [];

        this.controller = c;
        this.route = r;
        this.template = t;
       
        //get the parameters
        this.params = [];
        routeParams = getHashArray( r );

        for ( var i = 0; i < routeParams.length; i++ ) {
            if ( routeParams[i].indexOf( '{{' ) > -1
                && routeParams[i].indexOf( '}}' ) > -1 ) {
                this.params.push( routeParams[i].replace( '{{', '' ).replace( '}}', '' ) );
            }
        }
    }

    //attach the mvc object to the window
    w['jsMvc'] = new jsMvc();

    //function to start the mvc support
    function startMvc() {
        var pageHash = w.location.hash.replace( '#', '' ),
            hashParts = null,
            routeName = null,
            routeObj = null;

        //get the html element that will be used to render the view
        _viewElement = d.querySelector( '[view]' )
        //do nothing if view element is not found
        if ( !_viewElement ) return;

        if ( pageHash === '' ) {
            //if there is no hash then redirect to the location with the hash of the default route
            SetDefaultRoute();
        }
        else {
            //get the name of the route from the hash
            routeName = getRouteNameFromHash( pageHash );

            //get the route object
            routeObj = this._routeMap[routeName];
            //if not found then do nothing
            if ( !routeObj ) {
                SetDefaultRoute();
                return;
            }

            //fetch and set the view of the route
            loadTemplate( routeObj, _viewElement, pageHash );
        }
    }

    //Function to redirect to the default route
    function SetDefaultRoute() {
        w.location.replace( _origin + _pathName + getRouteHash() );
    }

    //replaces token of the format {{value}} from the provided html string
    //with its appropriate value from the data source
    function replaceToken( str, data ) {
        var i = 0,
            length = str.length,
            ptr = "",
            pStart = 0, pEnd = 0, tokenStart = 0, tokenEnd = 0,
            token = "", tokenName = "",
            output = str,
            evaluatedToken = null;

        for ( ; i < length; i++ ) {
            if ( i < length ) {
                ptr = str.substr( i, 2 );

                if ( ptr === '{{' ) {
                    pStart = i;
                    tokenStart = i + 2;
                }
                else if ( ptr === '}}' ) {
                    pEnd = i + 1;
                    tokenEnd = i - 1;
                    token = str.substr( pStart, pEnd - pStart + 1 );
                    tokenName = str.substr( tokenStart, tokenEnd - tokenStart + 1 );
                    evaluatedToken = evalToken( data, tokenName );
                    output = output.replace( token, ( isNullOrUndefined( evaluatedToken ) ? '' : evaluatedToken ) );
                }
            }
        }

        return output;
    }

    //Function to evaluate token
    function evalToken( data, str ) {
        var i = 0,
            length = str.length,
            ptr = "",
            pStart = 0, pEnd = 0,
            token = "",
            resetPointer = false;
        for ( ; i < length; i++ ) {
            if ( i < length ) {
                ptr = str.substr( i, 1 );
                if ( resetPointer ) {
                    pStart = i;
                    resetPointer = false;
                }
                if ( ( ptr === "[" || ptr === "." || ptr === "]" )
                    && ( i < ( length - 1 ) ) ) {
                    //set pointer end
                    pEnd = i;
                    //get the current data
                    data = getTokenData( str, data, pStart, pEnd );
                    resetPointer = true;
                }
                if ( i === ( length - 1 ) ) {
                    //set pointer end
                    if ( ptr === "]" ) {
                        pEnd = i;
                    }
                    else {
                        pEnd = i + 1;
                    }
                    //get the current data
                    data = getTokenData( str, data, pStart, pEnd );
                    resetPointer = true;
                }
            }
        }
        return data;
    }

    //Returns the token data from the string and data passed
    function getTokenData( str, data, pStart, pEnd ) {
        var token = str.substr( pStart, pEnd - pStart );
        if ( token.length > 0 ) {
            data = data[token];
        }
        return data;
    }

})( window, document );
