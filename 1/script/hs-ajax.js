/* Prototypes to make cross browser DOM functionality simpler */

if (typeof XMLDocument !== "undefined" && XMLDocument != null) {
  // select the first node that matches the XPath expression
  // xPath: the XPath expression to use
  XMLDocument.prototype.selectSingleNode = function(xPath) {
    var doc = this;
    if (doc.nodeType != 9)
      doc = doc.ownerDocument;
    if (doc.nsResolver == null) doc.nsResolver = function(prefix) { return(null); };
    var node = doc.evaluate(xPath, this, doc.nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null);
    if (node != null) node = node.singleNodeValue;
    return(node);
  }; // selectSingleNode

  Node.prototype.__defineGetter__("text", function () {
    return(this.textContent);
  }); // text
}

if(typeof HTMLElement!="undefined" && !HTMLElement.prototype.insertAdjacentElement){
    HTMLElement.prototype.insertAdjacentElement = function(where,parsedNode)
    {
        switch (where){
        case 'beforeBegin':
            this.parentNode.insertBefore(parsedNode,this)
            break;
        case 'afterBegin':
            this.insertBefore(parsedNode,this.firstChild);
            break;
        case 'beforeEnd':
            this.appendChild(parsedNode);
            break;
        case 'afterEnd':
            if (this.nextSibling) this.parentNode.insertBefore(parsedNode,this.nextSibling);
            else this.parentNode.appendChild(parsedNode);
            break;
        }
    }

    HTMLElement.prototype.insertAdjacentHTML = function(where,htmlStr)
    {
        var r = this.ownerDocument.createRange();
        r.setStartBefore(this);
        var parsedHTML = r.createContextualFragment(htmlStr);
        this.insertAdjacentElement(where,parsedHTML)
    }


    HTMLElement.prototype.insertAdjacentText = function(where,txtStr)
    {
        var parsedText = document.createTextNode(txtStr)
        this.insertAdjacentElement(where,parsedText)
    }
}

/* End cross browser DOM Prototypes */

/* Hashtable implementation */

function HsFeedListHashTable()
{
   this.data = new Object();
   this.keys = new Array();
} // end constructor


function HsFeedListHashTable_getKey(raw)
{
   // avoids conflict with actual attributes
   return '__'+ raw +'__';
}

function HsFeedListHashTable_get(nam)
{
   var key = this.getKey(nam);
   // retreive value if key exists, otherwise null
   var val = (this.data[key]) ? this.data[key] : null;
   return val;
}

function HsFeedListHashTable_put(nam, val)
{
   // Check that name isn't missing
   if (!nam) return false;
   
   var key = this.getKey(nam);
   
   // Add if doesn't already exist
   var exists = true;
   if (!this.data[key])
   {
      exists = false;
      this.keys[this.keys.length] = key;
   }
   
   // return old value if set, otherwise null
   var oldval = exists ? this.data[key] : null;
   
   this.data[key] = val;
    
   return oldval;
}


function HsFeedListHashTable_keys()
{
   // return a copy of the array so that it isn't
   // accidentally modified by the caller
   return keys.slice(0);
}

function HsFeedListHashTable_containsKey(nam)
{
   // Return true if key found
   return (this.get(nam) != null);
}

HsFeedListHashTable.prototype.getKey = HsFeedListHashTable_getKey;
HsFeedListHashTable.prototype.get = HsFeedListHashTable_get;
HsFeedListHashTable.prototype.put = HsFeedListHashTable_put;
HsFeedListHashTable.prototype.keys = HsFeedListHashTable_keys;
HsFeedListHashTable.prototype.containsKey = HsFeedListHashTable_containsKey;

/* End Hashtable implementation */


var HTTP_STATUS_OK = 200;
var READYSTATE_COMPLETED = 4;
var NODE_TYPE_ELEMENT = 1;

function HsAjax(recurseOnChildren)
{
    // request objects
    this.aRequests = new Array();
    this.aRequests[0] = null;
    this.aResponseHandlers = new Array();
    // maps handlers to element names
    this.hRespHandlers = new HsFeedListHashTable();
    // records if a wildcard handler has been set
    this.isWildcardSet = false;
    // whether or not to recurse on children of a 
    // matched element that has already been passed
    // to an appropriate handler function.
    this.recurseOnChildren = 
      recurseOnChildren ? true : false;
    
    this.sendRequest = function(url, method, requestxml, responseHandler, responseHandlerParameter)
    {
        // set defaults for omitted optional arguments
        if (!method) method = "GET";
        if (!requestxml) requestxml = null;

        // request object
        var req = null;

        // look for an empty spot in requests 
        // array due to a deleted request. 

        // default spot is at end
        var openIndex = this.aRequests.length;
        // look for closer spot
        for (var i=0; i<this.aRequests.length; i++)
        {
            if (this.aRequests[i] == null)
            {
                openIndex = i;
                break;
            }
        }

    // now make the request, if possible
        if (window.ActiveXObject)
        {
            try {req = window.external.GetXMLHTTP();} catch (ex) { }
            if (!req)
                req = new ActiveXObject("Microsoft.XMLHTTP");
            if (req)
            {
                // this might look odd, but it is
                // necessary because ‘this’ in event 
                // handlers refers to the owner of the 
                // fired event. See: 
                // www.quirksmode.org/js/this.html
                var self = this;
                req.onreadystatechange = 
                  function() {self.handle()};
                // add the element to the array before 
                // doing anything that will fire 
                // readyStateChange event. If we didn’t
                // do this now, we could be getting event 
                // firings from request objects that we 
                // can’t find in our requsts array, when
                // we go to handle the readyStateChange.
                this.aRequests[openIndex] = req;
                this.aResponseHandlers[openIndex] = function(responseXml) { responseHandler(responseXml, responseHandlerParameter) };
                req.open(method, url, true);
                req.send(requestxml);
            }
            else
            {
                return false;
            }
        }
        else if (window.XMLHttpRequest)
        {
            // this might look odd, but it is
            // necessary because ‘this’ in event 
            // handlers refers to the owner of the 
            // fired event. See: 
            // www.quirksmode.org/js/this.html
            var self = this;
            req = new XMLHttpRequest();
            req.onreadystatechange = 
               function() {self.handle()};
            // add the element to the array before 
            // doing anything that will fire 
            // readyStateChange event. If we didn’t
            // do this now, we could be getting event 
            // firings from request objects that we 
            // can’t find in our requsts array, when we 
            // go to handle the readyStateChange.
            this.aRequests[openIndex] = req;
            this.aResponseHandlers[openIndex] = function(responseXml) { responseHandler(responseXml, responseHandlerParameter) };
            req.open(method, url, true);
            req.setRequestHeader("Content-Type", "text/xml");
            req.send(requestxml);
        }
        else
        {
            // no support
            return false; 
        } 

        return true; // indicate no errors
    }; 

    this.handle = function()
    {
        // cycle through request objects to see 
        // if any are ready with a response.
        for (var i=0; i<this.aRequests.length; i++)
        {
            // if state is "complete"
            if (this.aRequests[i] != null && this.aRequests[i].readyState == 4)
            {
               if (this.aRequests[i].status == 0 || this.aRequests[i].status == HTTP_STATUS_OK)
               {
                  // Call back the response handler
                  if (this.aResponseHandlers[i]) {
                      this.aResponseHandlers[i](this.aRequests[i].responseXML);
                  }
                  // pass this off to the xml parser
                  this.parseResponse(this.aRequests[i].responseXML);                  
                  this.aRequests[i] = null;
               }
            }
        }
    };
    
    this.setNodeHandler = function(sElementName, funcHandler)
    {
        // flip flag if wildcard
        if (sElementName == '*')
            this.isWildcardSet = true;

        // add the element handler to the hashtable
        return this.hRespHandlers.put(sElementName, funcHandler);
    };
    
    
    this.parseResponse = function(oNode)
    {
        if (!oNode) return;
        
        // base case (oNode is a leaf element)
        if (!oNode.hasChildNodes()) return;

        // otherwise recurse through children
        var children = oNode.childNodes;

        for (var i=0; i<children.length; i++)
        {
            // only act on elements
            if (children[i].nodeType == NODE_TYPE_ELEMENT)
            {
                // check for specific handler
                var elementName = children[i].nodeName;
                if (this.hRespHandlers.containsKey(elementName))
                {
                    // get the handler
                    var funcHandler = this.hRespHandlers.get(elementName);
                    // fire the handler
                    funcHandler(children[i]);
                           
                    // recurse if necessary
                    if (this.recurseOnChildren) 
                        this.parseResponse(children[i]);
                }
                else if (this.isWildcardSet)
                {
                    // retreive the handler
                    var funcHandler = this.hRespHandlers.get('*');
                    // fire the handler
                    funcHandler(children[i]);

                    // recurse if necessary
                    if (this.recurseOnChildren) 
                        this.parseResponse(children[i]);
                }
                else
                {
                    // no match on this tree, search children
                    this.parseResponse(children[i]);
                }
            }
        }
    };

}