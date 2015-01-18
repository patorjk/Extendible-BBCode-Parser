# Extendible-BBCode-Parser

This is an extendible BBCode parser for JavaScript. 

Online demo: [patorjk.com/bbcode-previewer](http://patorjk.com/bbcode-previewer/)

## Why I made this

I had looked around a little bit and noticed that the existing JavaScript BBCode parsers 
had at least a few of the following issues:

- They didn't report errors on misaligned tags (e.g., `[b][u]test[/b][/u]`).
- They couldn't handle tags of the same type that were nested within each other (e.g., 
  `[color=red]red[color=blue]blue[/color]red again[/color]`). This happens because their 
  regex will look for the first closing tag it can find.
- They couldn't handle BBCode's list format (e.g., `[list][*]item 1[*]item 2[/list]`).
- They didn't report errors on incorrect parent-child relationships (e.g., 
  `[list][td]item 1?[/td][/list]`).
- They weren't easily extensible.

So I wrote this module in an attempt to solve these issues.

## Usage (Browser)

Including `xbbcode.js` will expose its API through an `XBBCODE` object that you can use to process BBCode into HTML.

    <head>
      <!-- Optional styling for .xbbcode-* classes -->
      <link rel="stylesheet" type="text/css" href="xbbcode.css">
    </head>
    <body>
      <script src="xbbcode.js"></script>
      <script>
        var result = XBBCODE.process({
          text: "[b]Hello world[/b]",
          removeMisalignedTags: false,
          addInLineBreaks: false
        });
        console.error("Errors", result.error);
        console.dir(result.errorQueue);
        console.log(result.html);  //=> <span class="xbbcode-b">Hello world</span>
      </script>
    </body>

## Adding new tags

To add a new tag to your BBCode, add properties to the "tags" object inside of the XBBCODE 
object. 

For example, say you wanted to add a tag called `[googleit]` which would change its 
contents into a link of its google search results. You'd implement that by adding this to 
the tags object:

	"googleit": {
	    openTag: function(params,content) {
	        var website = 'http://www.google.com/#q=' + content;
	        return '<a href="' + website + '">';
	    },
	    closeTag: function(params,content) {
	        return '</a>';
	    }
	}

That will transform this BBCode:

    [googleit]ta-da![/googleit]
    
Into this: 

    <a href="http://www.google.com/#q=ta-da!">ta-da!</a>
    
Refer to xbbcode.js for additional configuration options and other examples.

Hopefully this will be somewhat useful for you. If you have any suggestions or find any 
bugs please let me know.
