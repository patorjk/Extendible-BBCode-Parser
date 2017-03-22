/*
Copyright (C) 2011 Patrick Gillespie, http://patorjk.com/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
    Extendible BBCode Parser v1.0.0
    By Patrick Gillespie (patorjk@gmail.com)
    Website: http://patorjk.com/

    This module allows you to parse BBCode and to extend to the mark-up language
    to add in your own tags.
*/

var XBBCODE = (function() {
    "use strict";

    function Parser() {
        this._tags = {};
        this._tagList = [];
        this._tagsNoParseList = [];
        this._bbRegExp = null;
        this._pbbRegExp = null;
        this._pbbRegExp2 = null;
        this.openTags = null;
        this.closeTags = null;
    }

    // -----------------------------------------------------------------------------
    // Set up private variables
    // -----------------------------------------------------------------------------

    var urlPattern = /^(?:https?|file|c):(?:\/{1,3}|\\{1})[-a-zA-Z0-9:;,@#%&()~_?\+=\/\\\.]*$/,
        colorNamePattern = /^(?:aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)$/,
        colorCodePattern = /^#?[a-fA-F0-9]{6}$/,
        emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/,
        fontFacePattern = /^([a-z][a-z0-9_]+|"[a-z][a-z0-9_\s]+")$/i;

    /* -----------------------------------------------------------------------------
     * tags
     * This object contains a list of tags that your code will be able to understand.
     * Each tag object has the following properties:
     *
     *   openTag - A function that takes in the tag's parameters (if any) and its
     *             contents, and returns what its HTML open tag should be.
     *             Example: [color=red]test[/color] would take in "=red" as a
     *             parameter input, and "test" as a content input.
     *             It should be noted that any BBCode inside of "content" will have
     *             been processed by the time it enter the openTag function.
     *
     *   closeTag - A function that takes in the tag's parameters (if any) and its
     *              contents, and returns what its HTML close tag should be.
     *
     *   displayContent - Defaults to true. If false, the content for the tag will
     *                    not be displayed. This is useful for tags like IMG where
     *                    its contents are actually a parameter input.
     *
     *   restrictChildrenTo - A list of BBCode tags which are allowed to be nested
     *                        within this BBCode tag. If this property is omitted,
     *                        any BBCode tag may be nested within the tag.
     *
     *   restrictParentsTo - A list of BBCode tags which are allowed to be parents of
     *                       this BBCode tag. If this property is omitted, any BBCode
     *                       tag may be a parent of the tag.
     *
     *   noParse - true or false. If true, none of the content WITHIN this tag will be
     *             parsed by the XBBCode parser.
     *
     *
     *
     * LIMITIONS on adding NEW TAGS:
     *  - Tag names should be alphanumeric (including underscores) and all tags should have an opening tag
     *    and a closing tag.
     *    The [*] tag is an exception because it was already a standard
     *    bbcode tag. Technecially tags don't *have* to be alphanumeric, but since
     *    regular expressions are used to parse the text, if you use a non-alphanumeric
     *    tag names, just make sure the tag name gets escaped properly (if needed).
     * --------------------------------------------------------------------------- */

    var defaultTags = {
        "b": {
            openTag: function(params,content) {
                return '<span class="xbbcode-b">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },
        /*
            This tag does nothing and is here mostly to be used as a classification for
            the bbcode input when evaluating parent-child tag relationships
        */
        "bbcode": {
            openTag: function(params,content) {
                return '';
            },
            closeTag: function(params,content) {
                return '';
            }
        },
        "center": {
            openTag: function(params,content) {
                return '<span class="xbbcode-center">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },

        "code": {
            openTag: function(params,content) {
                return '<span class="xbbcode-code">';
            },
            closeTag: function(params,content) {
                return '</span>';
            },
            noParse: true
        },
        "color": {
            openTag: function(params,content) {
                params = params || '';

                var colorCode = (params.substr(1)).toLowerCase() || "black";
                colorNamePattern.lastIndex = 0;
                colorCodePattern.lastIndex = 0;
                if ( !colorNamePattern.test( colorCode ) ) {
                    if ( !colorCodePattern.test( colorCode ) ) {
                        colorCode = "black";
                    } else {
                        if (colorCode.substr(0,1) !== "#") {
                            colorCode = "#" + colorCode;
                        }
                    }
                }

                return '<span style="color:' + colorCode + '">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },
        "email": {
            openTag: function(params,content) {

                var myEmail;

                if (!params) {
                    myEmail = content.replace(/<.*?>/g,"");
                } else {
                    myEmail = params.substr(1);
                }

                emailPattern.lastIndex = 0;
                if ( !emailPattern.test( myEmail ) ) {
                    return '<a>';
                }

                return '<a href="mailto:' + myEmail + '">';
            },
            closeTag: function(params,content) {
                return '</a>';
            }
        },
        "face": {
            openTag: function(params,content) {
                params = params || '';

                var faceCode = params.substr(1) || "inherit";
                fontFacePattern.lastIndex = 0;
                if ( !fontFacePattern.test( faceCode ) ) {
                        faceCode = "inherit";
                }
                return '<span style="font-family:' + faceCode + '">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },


        "font": {
            openTag: function(params,content) {
                params = params || '';

                var faceCode = params.substr(1) || "inherit";
                fontFacePattern.lastIndex = 0;
                if ( !fontFacePattern.test( faceCode ) ) {
                        faceCode = "inherit";
                }
                return '<span style="font-family:' + faceCode + '">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },

        "i": {
            openTag: function(params,content) {
                return '<span class="xbbcode-i">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },
        "img": {
            openTag: function(params,content) {

                var myUrl = content;

                urlPattern.lastIndex = 0;
                if ( !urlPattern.test( myUrl ) ) {
                    myUrl = "";
                }

                return '<img src="' + myUrl + '" />';
            },
            closeTag: function(params,content) {
                return '';
            },
            displayContent: false
        },
        "justify": {
            openTag: function(params,content) {
                return '<span class="xbbcode-justify">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },
        "large": {
            openTag: function(params,content) {
                params = params || '';

                var colorCode = params.substr(1) || "inherit";
                colorNamePattern.lastIndex = 0;
                colorCodePattern.lastIndex = 0;
                if ( !colorNamePattern.test( colorCode ) ) {
                    if ( !colorCodePattern.test( colorCode ) ) {
                        colorCode = "inherit";
                    } else {
                        if (colorCode.substr(0,1) !== "#") {
                            colorCode = "#" + colorCode;
                        }
                    }
                }


                return '<span class="xbbcode-size-36" style="color:' + colorCode + '">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },
        "left": {
            openTag: function(params,content) {
                return '<span class="xbbcode-left">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },
        "li": {
            openTag: function(params,content) {
                return "<li>";
            },
            closeTag: function(params,content) {
                return "</li>";
            },
            restrictParentsTo: ["list","ul","ol"]
        },
        "list": {
            openTag: function(params,content) {
                return '<ul>';
            },
            closeTag: function(params,content) {
                return '</ul>';
            },
            restrictChildrenTo: ["*", "li"]
        },
        "noparse": {
            openTag: function(params,content) {
                return '';
            },
            closeTag: function(params,content) {
                return '';
            },
            noParse: true
        },
        "ol": {
            openTag: function(params,content) {
                return '<ol>';
            },
            closeTag: function(params,content) {
                return '</ol>';
            },
            restrictChildrenTo: ["*", "li"]
        },
        "php": {
            openTag: function(params,content) {
                return '<span class="xbbcode-code">';
            },
            closeTag: function(params,content) {
                return '</span>';
            },
            noParse: true
        },
        "quote": {
            openTag: function(params,content) {
                return '<blockquote class="xbbcode-blockquote">';
            },
            closeTag: function(params,content) {
                return '</blockquote>';
            }
        },
        "right": {
            openTag: function(params,content) {
                return '<span class="xbbcode-right">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },
        "s": {
            openTag: function(params,content) {
                return '<span class="xbbcode-s">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },
        "size": {
            openTag: function(params,content) {
                params = params || '';

                var mySize = parseInt(params.substr(1),10) || 0;
                if (mySize < 4 || mySize > 40) {
                    mySize = 14;
                }

                return '<span class="xbbcode-size-' + mySize + '">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },
        "small": {
            openTag: function(params,content) {
                params = params || '';

                var colorCode = params.substr(1) || "inherit";
                colorNamePattern.lastIndex = 0;
                colorCodePattern.lastIndex = 0;
                if ( !colorNamePattern.test( colorCode ) ) {
                    if ( !colorCodePattern.test( colorCode ) ) {
                        colorCode = "inherit";
                    } else {
                        if (colorCode.substr(0,1) !== "#") {
                            colorCode = "#" + colorCode;
                        }
                    }
                }

                return '<span class="xbbcode-size-10" style="color:' + colorCode + '">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },

        "sub": {
            openTag: function(params,content) {
                return '<sub>';
            },
            closeTag: function(params,content) {
                return '</sub>';
            }
        },
        "sup": {
            openTag: function(params,content) {
                return '<sup>';
            },
            closeTag: function(params,content) {
                return '</sup>';
            }
        },

        "table": {
            openTag: function(params,content) {
                return '<table class="xbbcode-table">';
            },
            closeTag: function(params,content) {
                return '</table>';
            },
            restrictChildrenTo: ["tbody","thead", "tfoot", "tr"]
        },
        "tbody": {
            openTag: function(params,content) {
                return '<tbody>';
            },
            closeTag: function(params,content) {
                return '</tbody>';
            },
            restrictChildrenTo: ["tr"],
            restrictParentsTo: ["table"]
        },
        "tfoot": {
            openTag: function(params,content) {
                return '<tfoot>';
            },
            closeTag: function(params,content) {
                return '</tfoot>';
            },
            restrictChildrenTo: ["tr"],
            restrictParentsTo: ["table"]
        },
        "thead": {
            openTag: function(params,content) {
                return '<thead class="xbbcode-thead">';
            },
            closeTag: function(params,content) {
                return '</thead>';
            },
            restrictChildrenTo: ["tr"],
            restrictParentsTo: ["table"]
        },
        "td": {
            openTag: function(params,content) {
                return '<td class="xbbcode-td">';
            },
            closeTag: function(params,content) {
                return '</td>';
            },
            restrictParentsTo: ["tr"]
        },
        "th": {
            openTag: function(params,content) {
                return '<th class="xbbcode-th">';
            },
            closeTag: function(params,content) {
                return '</th>';
            },
            restrictParentsTo: ["tr"]
        },
        "tr": {
            openTag: function(params,content) {
                return '<tr class="xbbcode-tr">';
            },
            closeTag: function(params,content) {
                return '</tr>';
            },
            restrictChildrenTo: ["td","th"],
            restrictParentsTo: ["table","tbody","tfoot","thead"]
        },
        "u": {
            openTag: function(params,content) {
                return '<span class="xbbcode-u">';
            },
            closeTag: function(params,content) {
                return '</span>';
            }
        },
        "ul": {
            openTag: function(params,content) {
                return '<ul>';
            },
            closeTag: function(params,content) {
                return '</ul>';
            },
            restrictChildrenTo: ["*", "li"]
        },
        "url": {
            openTag: function(params,content) {

                var myUrl;

                if (!params) {
                    myUrl = content.replace(/<.*?>/g,"");
                } else {
                    myUrl = params.substr(1);
                }

                urlPattern.lastIndex = 0;
                if ( !urlPattern.test( myUrl ) ) {
                    myUrl = "#";
                }

                return '<a href="' + myUrl + '">';
            },
            closeTag: function(params,content) {
                return '</a>';
            }
        },
        /*
            The [*] tag is special since the user does not define a closing [/*] tag when writing their bbcode.
            Instead this module parses the code and adds the closing [/*] tag in for them. None of the tags you
            add will act like this and this tag is an exception to the others.
        */
        "*": {
            openTag: function(params,content) {
                return "<li>";
            },
            closeTag: function(params,content) {
                return "</li>";
            },
            restrictParentsTo: ["list","ul","ol"]
        }
    };

    // create tag list and lookup fields
    Parser.prototype._initTags = function() {
        var self = this;
        this._tagList = [];
        var tags = this._tags;
        var prop,
            ii,
            len;
        for (prop in tags) {
            if (tags.hasOwnProperty(prop)) {
                if (prop === "*") {
                    this._tagList.push("\\" + prop);
                } else {
                    this._tagList.push(prop);
                    if ( tags[prop].noParse ) {
                        this._tagsNoParseList.push(prop);
                    }
                }

                tags[prop].validChildLookup = {};
                tags[prop].validParentLookup = {};
                tags[prop].restrictParentsTo = tags[prop].restrictParentsTo || [];
                tags[prop].restrictChildrenTo = tags[prop].restrictChildrenTo || [];

                len = tags[prop].restrictChildrenTo.length;
                for (ii = 0; ii < len; ii++) {
                    tags[prop].validChildLookup[ tags[prop].restrictChildrenTo[ii] ] = true;
                }
                len = tags[prop].restrictParentsTo.length;
                for (ii = 0; ii < len; ii++) {
                    tags[prop].validParentLookup[ tags[prop].restrictParentsTo[ii] ] = true;
                }
            }
        }

        this._bbRegExp = new RegExp("<bbcl=([0-9]+) (" + this._tagList.join("|") + ")([ =][^>]*?)?>((?:.|[\\r\\n])*?)<bbcl=\\1 /\\2>", "gi");
        this._pbbRegExp = new RegExp("\\[(" + this._tagList.join("|") + ")([ =][^\\]]*?)?\\]([^\\[]*?)\\[/\\1\\]", "gi");
        this._pbbRegExp2 = new RegExp("\\[(" + this._tagsNoParseList.join("|") + ")([ =][^\\]]*?)?\\]([\\s\\S]*?)\\[/\\1\\]", "gi");

        // create the regex for escaping ['s that aren't apart of tags
        (function() {
            var closeTagList = [];
            for (var ii = 0; ii < self._tagList.length; ii++) {
                if ( self._tagList[ii] !== "\\*" ) { // the * tag doesn't have an offical closing tag
                    closeTagList.push ( "/" + self._tagList[ii] );
                }
            }

            self.openTags = new RegExp("(\\[)((?:" + self._tagList.join("|") + ")(?:[ =][^\\]]*?)?)(\\])", "gi");
            self.closeTags = new RegExp("(\\[)(" + closeTagList.join("|") + ")(\\])", "gi");
        })();

    };

    // -----------------------------------------------------------------------------
    // private functions
    // -----------------------------------------------------------------------------

    Parser.prototype._checkParentChildRestrictions = function(parentTag, bbcode, bbcodeLevel, tagName,
                                                              tagParams, tagContents, errQueue) {
        var self = this;
        errQueue = errQueue || [];
        bbcodeLevel++;

        // get a list of all of the child tags to this tag
        var reTagNames = new RegExp("(<bbcl=" + bbcodeLevel + " )(" + this._tagList.join("|") + ")([ =>])","gi"),
            reTagNamesParts = new RegExp("(<bbcl=" + bbcodeLevel + " )(" + this._tagList.join("|") + ")([ =>])","i"),
            matchingTags = tagContents.match(reTagNames) || [],
            cInfo,
            errStr,
            ii,
            childTag,
            pInfo = this._tags[parentTag] || {};

        reTagNames.lastIndex = 0;

        if (!matchingTags) {
            tagContents = "";
        }

        for (ii = 0; ii < matchingTags.length; ii++) {
            reTagNamesParts.lastIndex = 0;
            childTag = (matchingTags[ii].match(reTagNamesParts))[2].toLowerCase();

            if ( pInfo && pInfo.restrictChildrenTo && pInfo.restrictChildrenTo.length > 0 ) {
                if ( !pInfo.validChildLookup[childTag] ) {
                    errStr = "The tag \"" + childTag + "\" is not allowed as a child of the tag \"" + parentTag + "\".";
                    errQueue.push(errStr);
                }
            }
            cInfo = this._tags[childTag] || {};
            if ( cInfo.restrictParentsTo.length > 0 ) {
                if ( !cInfo.validParentLookup[parentTag] ) {
                    errStr = "The tag \"" + parentTag + "\" is not allowed as a parent of the tag \"" + childTag + "\".";
                    errQueue.push(errStr);
                }
            }

        }

        tagContents = tagContents.replace(this._bbRegExp, function(matchStr, bbcodeLevel, tagName, tagParams, tagContents ) {
            errQueue = self._checkParentChildRestrictions(tagName.toLowerCase(), matchStr, bbcodeLevel, tagName, tagParams, tagContents, errQueue);
            return matchStr;
        });
        return errQueue;
    };

    /*
        This function updates or adds a piece of metadata to each tag called "bbcl" which
        indicates how deeply nested a particular tag was in the bbcode. This property is removed
        from the HTML code tags at the end of the processing.
    */
    function updateTagDepths(tagContents) {
        tagContents = tagContents.replace(/\<([^\>][^\>]*?)\>/gi, function(matchStr, subMatchStr) {
            var bbCodeLevel = subMatchStr.match(/^bbcl=([0-9]+) /);
            if (bbCodeLevel === null) {
                return "<bbcl=0 " + subMatchStr + ">";
            } else {
                return "<" + subMatchStr.replace(/^(bbcl=)([0-9]+)/, function(matchStr, m1, m2) {
                    return m1 + (parseInt(m2, 10) + 1);
                }) + ">";
            }
        });
        return tagContents;
    }

    /*
        This function removes the metadata added by the updateTagDepths function
    */
    function unprocess(tagContent) {
        return tagContent.replace(/<bbcl=[0-9]+ \/\*>/gi,"").replace(/<bbcl=[0-9]+ /gi,"&#91;").replace(/>/gi,"&#93;");
    }

    Parser.prototype._parse = function(config) {
        var self = this;
        var output = config.text;

        var replaceFunct = function(matchStr, bbcodeLevel, tagName, tagParams, tagContents) {
            tagName = tagName.toLowerCase();

            var processedContent = self._tags[tagName].noParse ? unprocess(tagContents) :
                    tagContents.replace(self._bbRegExp, replaceFunct),
                openTag = self._tags[tagName].openTag(tagParams,processedContent),
                closeTag = self._tags[tagName].closeTag(tagParams,processedContent);

            if (self._tags[tagName].displayContent === false) {
                processedContent = "";
            }

            return openTag + processedContent + closeTag;
        };

        output = output.replace(this._bbRegExp, replaceFunct);
        return output;
    };

    /*
        The star tag [*] is special in that it does not use a closing tag. Since this parser requires that tags to have a closing
        tag, we must pre-process the input and add in closing tags [/*] for the star tag.
        We have a little levaridge in that we know the text we're processing wont contain the <> characters (they have been
        changed into their HTML entity form to prevent XSS and code injection), so we can use those characters as markers to
        help us define boundaries and figure out where to place the [/*] tags.
    */
    function fixStarTag(text) {
        text = text.replace(/\[(?!\*[ =\]]|list([ =][^\]]*)?\]|\/list[\]])/ig, "<");
        text = text.replace(/\[(?=list([ =][^\]]*)?\]|\/list[\]])/ig, ">");

        while (text !== (text = text.replace(/>list([ =][^\]]*)?\]([^>]*?)(>\/list])/gi, function(matchStr,contents,endTag) {

            var innerListTxt = matchStr;
            while (innerListTxt !== (innerListTxt = innerListTxt.replace(/\[\*\]([^\[]*?)(\[\*\]|>\/list])/i, function(matchStr,contents,endTag) {
                if (endTag.toLowerCase() === ">/list]") {
                    endTag = "</*]</list]";
                } else {
                    endTag = "</*][*]";
                }
                return "<*]" + contents + endTag;
            })));

            innerListTxt = innerListTxt.replace(/>/g, "<");
            return innerListTxt;
        })));

        // add ['s for our tags back in
        text = text.replace(/</g, "[");
        return text;
    }

    Parser.prototype._addBbcodeLevels = function(text) {
        while ( text !== (text = text.replace(this._pbbRegExp, function(matchStr, tagName, tagParams, tagContents) {
            matchStr = matchStr.replace(/\[/g, "<");
            matchStr = matchStr.replace(/\]/g, ">");
            return updateTagDepths(matchStr);
        })) );
        return text;
    };

    // -----------------------------------------------------------------------------
    // public functions
    // -----------------------------------------------------------------------------

    // API, Expose all available tags
    Parser.prototype.tags = function() {
        return this._tags;
    };

    // API
    Parser.prototype.addTags = function(newtags) {
        var tag;
        for (tag in newtags) {
            this._tags[tag] = newtags[tag];
        }
        this._initTags();
    };

    Parser.prototype.addDefaultTags = function() {
        this.addTags(defaultTags);
    };

    Parser.prototype.process = function(config) {
        if (!this._bbRegExp && !this._pbbRegExp && !this._pbbRegExp2) {
            throw new Error('No tags. Add tags before the process method with addDefaultTags or addTags');
        }
        var ret = {html: "", error: false},
            errQueue = [];

        config.text = config.text.replace(/</g, "&lt;"); // escape HTML tag brackets
        config.text = config.text.replace(/>/g, "&gt;"); // escape HTML tag brackets

        config.text = config.text.replace(this.openTags, function(matchStr, openB, contents, closeB) {
            return "<" + contents + ">";
        });
        config.text = config.text.replace(this.closeTags, function(matchStr, openB, contents, closeB) {
            return "<" + contents + ">";
        });

        config.text = config.text.replace(/\[/g, "&#91;"); // escape ['s that aren't apart of tags
        config.text = config.text.replace(/\]/g, "&#93;"); // escape ['s that aren't apart of tags
        config.text = config.text.replace(/</g, "["); // escape ['s that aren't apart of tags
        config.text = config.text.replace(/>/g, "]"); // escape ['s that aren't apart of tags

        // process tags that don't have their content parsed
        while ( config.text !== (config.text = config.text.replace(this._pbbRegExp2, function(matchStr, tagName, tagParams, tagContents) {
            tagContents = tagContents.replace(/\[/g, "&#91;");
            tagContents = tagContents.replace(/\]/g, "&#93;");
            tagParams = tagParams || "";
            tagContents = tagContents || "";
            return "[" + tagName + tagParams + "]" + tagContents + "[/" + tagName + "]";
        })) );

        config.text = fixStarTag(config.text); // add in closing tags for the [*] tag
        config.text = this._addBbcodeLevels(config.text); // add in level metadata

        errQueue = this._checkParentChildRestrictions("bbcode", config.text, -1, "", "", config.text);

        ret.html = this._parse(config);

        if ( ret.html.indexOf("[") !== -1 || ret.html.indexOf("]") !== -1) {
            errQueue.push("Some tags appear to be misaligned.");
        }

        if (config.removeMisalignedTags) {
            ret.html = ret.html.replace(/\[.*?\]/g,"");
        }
        if (config.addInLineBreaks) {
            ret.html = '<div style="white-space:pre-wrap;">' + ret.html + '</div>';
        }

		if (!config.escapeHtml) {
			ret.html = ret.html.replace("&#91;", "["); // put ['s back in
        	ret.html = ret.html.replace("&#93;", "]"); // put ['s back in
		}

        ret.error = errQueue.length !== 0;
        ret.errorQueue = errQueue;

        return ret;
    };

    var parser = {};
    parser = new Parser();
    parser.Parser = Parser;

    return parser;
})();

// for node
if (typeof module !== "undefined") {
    module.exports = XBBCODE;
}
