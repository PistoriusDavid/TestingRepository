function hsPopulateFeedList(url,elementId)
{
    // Create the ajax handler and hook up the handler
    hsAjaxInstance = new HsAjax();
    // Send the request
    hsAjaxInstance.sendRequest(url,"GET",null,hsFeedListResponseHandler,elementId)
}

function hsFeedListResponseHandler(root,parameter)
{
    // Returned Xml is an rss feed
    var div = document.getElementById(parameter);
    var newContent = '';
    if (div) {
        var channel = root.documentElement.childNodes[0];
        var feedItems = channel.getElementsByTagName('item');
        for (var x=0;x<feedItems.length;x++)
        {
            var feedItem = feedItems[x];
            var link = '';
            var title = '';
            var description = '';
            for (var c=0;c<feedItem.childNodes.length;c++)
            {
                var childNode = feedItem.childNodes[c];
                if (childNode.nodeName == "link") {
                    link = encodeURI(childNode.text);
                }
                else if (childNode.nodeName == "title") {
                    title = childNode.text;
                }
                else if (childNode.nodeName == "description") {
                    description = childNode.text;
                }
            }
            newContent = newContent + "<div class='movielinkcontainer'><a target='_blank' href='" + link + "'>" + title + "</a>" + description + "</div>";
        }
        div.innerHTML = newContent;
    }
}