/**************\
 *                                                                ____   _____
 * DlHighlight -- a JavaScript-based syntax highlighting engine.  \  /_  /   /
 *                                                                 \  / /   /
 *        Author: Mihai Bazon, http://mihai.bazon.net/blog          \/ /_  /
 *     Copyright: (c) Dynarch.com 2007.  All rights reserved.        \  / /
 *                http://www.dynarch.com/                              / /
 *                                                                     \/
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
\******************************************************************************/

(function(){

	var outblock_stuff = {
		"." : "css-class",
		"#" : "css-id",
		":" : "css-pseudo-class"
	};

	var T = {

		AT_RULE : {
			regexp	: /^@([a-z0-9_-]+)/gi,
			before	: "@",
			content	: 1,
			style	: "keyword css-at-rule"
		},

		COMMENT_CPP : function(txt) {
			if (txt.charAt(0) == "/" && txt.charAt(1) == "/") {
				var nl = txt.indexOf("\n");
				if (nl == -1)
					nl = txt.length;								
				var c = this.lang.onComment.call(this, this._he(txt.substring(2, nl)));
				
				// when "//" has ")" and ";" don't be c style			
				var d = c.indexOf(";"), e = c.indexOf(")");
				if (d == -1 || e == -1) {
					return {
						content	: { escaped: c },
						style	: "comment comment-line",
						type	: "comment",
						index	: nl,
						before	: "//"
					};
				}				
			}						
		},
		
		OUTBLOCK_STUFF : function(txt) {
			if (!this.cssBlock) {	
				// for id and clss
				var m = /^([.#:])([a-z0-9_-]+)/i.exec(txt);
				if (m) return {
					before  : m[1],
					content : m[2],
					index   : m[0].length,
					style   : outblock_stuff[m[1]]
				};
				
				// for element
				var m = /^([a-z0-9]+)(\s*)/i.exec(txt);
				//console.log(m);
				if (m) return {
					content : m[1],
					index   : m[0].length,
					style   : 'css-element'
				};
				
				// for ","
				if (txt.charAt(0) == ",") return {
					content	: ",",
					index	: 1,
					style	: "css-comma"
				};
			}
		},

		INBLOCK_STUFF : function(txt) {
			if (this.cssBlock) {
				// declaration
				var m = /^([a-z0-9_-]+)(\s*:)/i.exec(txt);
				if (m) return {
					content	: m[1],
					after   : m[2],
					style   : "css-keyword",
					index   : m[0].length
				};			
				
				// color
				m = /^#(([a-f0-9][a-f0-9][a-f0-9]){1,2})/i.exec(txt);
				if (m) return {
					content : m[1],
					before  : "#",
					style   : "css-color-spec",
					index   : m[0].length
				};

				// length
				m = /^(-?[0-9]?\.?[0-9]+)(px|pt|em|ex|%|\b)/i.exec(txt);
				if (m) return {
					content : m[1],
					after   : m[2],
					style   : "css-length",
					index   : m[0].length
				};
				
				// word
				var n = /^([a-z0-9_-]+)(\s*\b)/i.exec(txt);
				if (n) return {
					content : n[1],
					style   : "css-attribute",
					index   : n[0].lenght
				};
				
				// ","
				var d = /^(\,)/i.exec(txt);
				if (d) return {
					content : d[0],
					style   : "css-length",
					index   : d[0].length
				}
				
				// the end 
				m = /^\;/i.exec(txt);
				if (m) return {
					content : m[0],
					style   : "css-end",
					index   : m[0].length
				};
			}
		},
		
		URL: function(txt) {
		
			// "url"
			var u = /^url/i.exec(txt);
			if (u) return {
				content : u[0],
				style   : "css-url",
				index   : u[0].length
			};
			
			// "../" "./" "."
			if(this.cssBrack) {
				var t = /^([\.\.]|[\.\.\/]|[\.\/]|[\.]+)(\s*)/i.exec(txt);
				if (t) return {
					content : t[0],
					style   : "css-url",
					index   : t[0].length
				};
			}
		},


		BEGIN_BRACK : function(txt) {
			if (/^\(/.test(txt)) {
				this.cssBrack++;
				return {
					content : "(",
					style   : "css-brack-open",
					index   : 1
				};
			}
		},
		
		END_BRACK : function(txt) {
			if (/^\)/.test(txt)) {
				this.cssBrack--;
				return {
					content : ")",
					style   : "css-brack-close",
					index   : 1
				};
			}
		},
		
		BEGIN_BLOCK : function(txt) {
			if (/^\{/.test(txt)) {
				this.cssBlock++;
				return {
					content	: "{",
					style	: "paren css-block-open",
					index   : 1
				};
			}
		},

		END_BLOCK : function(txt) {
			if (/^\}/.test(txt)) {
				this.cssBlock--;
				return {
					content	: "}",
					style	: "paren css-block-close",
					index   : 1
				};
			}
		},

		PAREN : DlHighlight.BASE.PAREN

	};

	var H = DlHighlight;
	var lang = H.registerLang(
		"css", [ H.BASE.COMMENT_C, 
			 H.BASE.STRING,
			 T.COMMENT_CPP,
			 T.AT_RULE,
			 T.OUTBLOCK_STUFF,
			 T.INBLOCK_STUFF,
			 T.URL,
			 T.BEGIN_BLOCK,
			 T.END_BLOCK,
			 T.BEGIN_BRACK,
			 T.END_BRACK
		       ]);

	lang.start = function() {
		this.cssBlock = 0;
		this.cssBrack = 0;
	};

})();
