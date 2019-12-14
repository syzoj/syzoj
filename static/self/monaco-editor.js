require.config({
  paths: {
    vs: window.pathLib + "monaco-editor/0.18.1/min/vs",
    tokenizer: window.pathSelfLib + 'vendor/tokenizer'
  }
});

window.onEditorLoaded = function (fn) {
  if (window.editorLoaded) {
    fn();
  } else {
    if (!window.editorLoadedHandles) window.editorLoadedHandles = [];
    window.editorLoadedHandles.push(fn);
  }
};

require(['vs/editor/editor.main'], function () {
  require(['tokenizer/monaco-tokenizer',
           'tokenizer/definitions/c_cpp',
           'tokenizer/definitions/csharp',
           'tokenizer/definitions/haskell',
           'tokenizer/definitions/java',
           'tokenizer/definitions/javascript',
           'tokenizer/definitions/pascal',
           'tokenizer/definitions/python',
           'tokenizer/definitions/ruby'],
    function(MonacoAceTokenizer,
             c_cppDefinition,
             CSharpDefinition,
             HaskellDefinition,
             JavaDefinition,
             JavaScriptDefinition,
             PascalDefinition,
             PythonDefinition,
             RubyDefinition) {
      var overrideLangauges = [
        'cpp',
        'c',
        'csharp',
        'haskell',
        'java',
        'javascript',
        'pascal',
        'python',
        'ruby',
        'markdown'
      ];

      monaco.languages.getLanguages().forEach(function (lang) {
        if (overrideLangauges.includes(lang.id)) {
          lang.loader = function () {
            return { then: function () {} };
          };
        }
      });

      var cppAliases = ['c', 'cpp', 'c++', 'cxx', 'cc'];
      for (var i in cppAliases) {
        var alias = cppAliases[i];

        monaco.languages.register({ id: alias });
        MonacoAceTokenizer.registerRulesForLanguage(alias, new c_cppDefinition.default);
        monaco.languages.setLanguageConfiguration(alias, {
          comments: {
            lineComment: '//',
            blockComment: ['/*', '*/'],
          },
          brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
          ],
          autoClosingPairs: [
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '(', close: ')' },
            { open: '\'', close: '\'', notIn: ['string', 'comment'] },
            { open: '"', close: '"', notIn: ['string'] },
          ],
          surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '\'', close: '\'' },
          ],
          folding: {
            markers: {
              start: new RegExp("^\\s*#pragma\\s+region\\b"),
              end: new RegExp("^\\s*#pragma\\s+endregion\\b")
            }
          }
        });
      }

      var csharpAliases = ['csharp', 'cs', 'c#'];
      for (var i in csharpAliases) {
        var alias = csharpAliases[i];

        monaco.languages.register({ id: alias });
        MonacoAceTokenizer.registerRulesForLanguage(alias, new CSharpDefinition.default);
        monaco.languages.setLanguageConfiguration(alias, {
          wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\#\$\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
          comments: {
              lineComment: '//',
              blockComment: ['/*', '*/'],
          },
          brackets: [
              ['{', '}'],
              ['[', ']'],
              ['(', ')'],
          ],
          autoClosingPairs: [
              { open: '{', close: '}' },
              { open: '[', close: ']' },
              { open: '(', close: ')' },
              { open: '\'', close: '\'', notIn: ['string', 'comment'] },
              { open: '"', close: '"', notIn: ['string', 'comment'] },
          ],
          surroundingPairs: [
              { open: '{', close: '}' },
              { open: '[', close: ']' },
              { open: '(', close: ')' },
              { open: '<', close: '>' },
              { open: '\'', close: '\'' },
              { open: '"', close: '"' },
          ],
          folding: {
              markers: {
                  start: new RegExp("^\\s*#region\\b"),
                  end: new RegExp("^\\s*#endregion\\b")
              }
          }
        });
      }

      monaco.languages.register({ id: 'haskell' });
      MonacoAceTokenizer.registerRulesForLanguage('haskell', new HaskellDefinition.default);
      monaco.languages.setLanguageConfiguration('haskell', {
        comments: {
            lineComment: '--',
            blockComment: ['{-', '-}']
        },
        brackets: [
           ['{', '}'],
           ['[', ']'],
           ['(', ')']
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '\'', close: '\'', notIn: ['string'] },
            { open: '`', close: '`', notIn: ['string', 'comment'] }
        ],
        surroundingPairs: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
            ['\'', '\''],
            ['"', '"'],
            ['`', '`']
        ],
        indentationRules: {
            decreaseIndentPattern: new RegExp("[\\]})][ \\t]*$/m"),
            increaseIndentPattern: new RegExp("((\\b(if\\b.*|then|else|do|of|let|in|where))|=|->|>>=|>=>|=<<|(^(data)( |\t)+(\\w|')+( |\\t)*))( |\\t)*$/")
        }
      });

      monaco.languages.register({ id: 'java' });
      MonacoAceTokenizer.registerRulesForLanguage('java', new JavaDefinition.default);
      monaco.languages.setLanguageConfiguration('java', {
        // the default separators except `@$`
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
        comments: {
            lineComment: '//',
            blockComment: ['/*', '*/'],
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '\'', close: '\'' },
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '\'', close: '\'' },
            { open: '<', close: '>' },
        ],
        folding: {
            markers: {
                start: new RegExp("^\\s*//\\s*(?:(?:#?region\\b)|(?:<editor-fold\\b))"),
                end: new RegExp("^\\s*//\\s*(?:(?:#?endregion\\b)|(?:</editor-fold>))")
            }
        }
      });

      var javascriptAliases = ['javascript', 'js'];
      for (var i in javascriptAliases) {
        var alias = javascriptAliases[i];
        monaco.languages.register({ id: alias });
        MonacoAceTokenizer.registerRulesForLanguage(alias, new JavaScriptDefinition.default);
        monaco.languages.setLanguageConfiguration(alias, {
          wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
          comments: {
              lineComment: '//',
              blockComment: ['/*', '*/']
          },
          brackets: [
              ['{', '}'],
              ['[', ']'],
              ['(', ')']
          ],
          onEnterRules: [
              {
                  // e.g. /** | */
                  beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                  afterText: /^\s*\*\/$/,
                  action: { indentAction: monaco.languages.IndentAction.IndentOutdent, appendText: ' * ' }
              },
              {
                  // e.g. /** ...|
                  beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                  action: { indentAction: monaco.languages.IndentAction.None, appendText: ' * ' }
              },
              {
                  // e.g.  * ...|
                  beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
                  action: { indentAction: monaco.languages.IndentAction.None, appendText: '* ' }
              },
              {
                  // e.g.  */|
                  beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
                  action: { indentAction: monaco.languages.IndentAction.None, removeText: 1 }
              }
          ],
          autoClosingPairs: [
              { open: '{', close: '}' },
              { open: '[', close: ']' },
              { open: '(', close: ')' },
              { open: '"', close: '"', notIn: ['string'] },
              { open: '\'', close: '\'', notIn: ['string', 'comment'] },
              { open: '`', close: '`', notIn: ['string', 'comment'] },
              { open: "/**", close: " */", notIn: ["string"] }
          ],
          folding: {
              markers: {
                  start: new RegExp("^\\s*//\\s*#?region\\b"),
                  end: new RegExp("^\\s*//\\s*#?endregion\\b")
              }
          }
        });
      }

      var pascalAliases = ['pascal', 'pas'];
      for (var i in pascalAliases) {
        var alias = pascalAliases[i];

        monaco.languages.register({ id: alias });
        MonacoAceTokenizer.registerRulesForLanguage(alias, new PascalDefinition.default);
        monaco.languages.setLanguageConfiguration(alias, {
          // the default separators except `@$`
          wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
          comments: {
            lineComment: '//',
            blockComment: ['{', '}'],
          },
          brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
            ['<', '>'],
          ],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '<', close: '>' },
            { open: '\'', close: '\'' },
          ],
          surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '<', close: '>' },
            { open: '\'', close: '\'' },
          ],
          folding: {
            markers: {
              start: new RegExp("^\\s*\\{\\$REGION(\\s\\'.*\\')?\\}"),
              end: new RegExp("^\\s*\\{\\$ENDREGION\\}")
            }
          }
        });
      }

      var pythonAliases = ['python', 'python2', 'python3', 'py', 'py2', 'py3'];
      for (var i in pythonAliases) {
        var alias = pythonAliases[i];

        monaco.languages.register({ id: alias });
        MonacoAceTokenizer.registerRulesForLanguage(alias, new PythonDefinition.default);
        monaco.languages.setLanguageConfiguration(alias, {
          comments: {
              lineComment: '#',
              blockComment: ['\'\'\'', '\'\'\''],
          },
          brackets: [
              ['{', '}'],
              ['[', ']'],
              ['(', ')']
          ],
          autoClosingPairs: [
              { open: '{', close: '}' },
              { open: '[', close: ']' },
              { open: '(', close: ')' },
              { open: '"', close: '"', notIn: ['string'] },
              { open: '\'', close: '\'', notIn: ['string', 'comment'] },
          ],
          surroundingPairs: [
              { open: '{', close: '}' },
              { open: '[', close: ']' },
              { open: '(', close: ')' },
              { open: '"', close: '"' },
              { open: '\'', close: '\'' },
          ],
          onEnterRules: [
              {
                  beforeText: new RegExp("^\\s*(?:def|class|for|if|elif|else|while|try|with|finally|except|async).*?:\\s*$"),
                  action: { indentAction: monaco.languages.IndentAction.Indent }
              }
          ],
          folding: {
              offSide: true,
              markers: {
                  start: new RegExp("^\\s*#region\\b"),
                  end: new RegExp("^\\s*#endregion\\b")
              }
          }
        });
      }

      monaco.languages.register({ id: 'ruby' });
      MonacoAceTokenizer.registerRulesForLanguage('ruby', new RubyDefinition.default);
      monaco.languages.setLanguageConfiguration('ruby', {
        comments: {
            lineComment: '#',
            blockComment: ['=begin', '=end'],
        },
        brackets: [
            ['(', ')'],
            ['{', '}'],
            ['[', ']']
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '\'', close: '\'' },
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '\'', close: '\'' },
        ],
        indentationRules: {
            increaseIndentPattern: new RegExp('^\\s*((begin|class|(private|protected)\\s+def|def|else|elsif|ensure|for|if|module|rescue|unless|until|when|while|case)|([^#]*\\sdo\\b)|([^#]*=\\s*(case|if|unless)))\\b([^#\\{;]|("|\'|\/).*\\4)*(#.*)?$'),
            decreaseIndentPattern: new RegExp('^\\s*([}\\]]([,)]?\\s*(#|$)|\\.[a-zA-Z_]\\w*\\b)|(end|rescue|ensure|else|elsif|when)\\b)'),
        }
      });

      var markdownAliases = ['markdown', 'md'];
      for (var i in markdownAliases) {
        var alias = markdownAliases[i];

        monaco.languages.register({ id: alias });
        monaco.languages.setLanguageConfiguration(alias, {
          comments: {
            blockComment: ['<!--', '-->',]
          },
          brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
          ],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '<', close: '>', notIn: ['string'] }
          ],
          surroundingPairs: [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '`', close: '`' },
          ],
          folding: {
            markers: {
              start: new RegExp("^\\s*<!--\\s*#?region\\b.*-->"),
              end: new RegExp("^\\s*<!--\\s*#?endregion\\b.*-->")
            }
          }
        });
        monaco.languages.setMonarchTokensProvider(alias, {
          defaultToken: '',
          tokenPostfix: '.md',

          // escape codes
          control: /[\\`*_\[\]{}()#+\-\.!\$]/,
          noncontrol: /[^\\`*_\[\]{}()#+\-\.!\$]/,
          escapes: /\\(?:@control)/,

          // escape codes for javascript/CSS strings
          jsescapes: /\\(?:[btnfr\\"']|[0-7][0-7]?|[0-3][0-7]{2})/,

          // non matched elements
          empty: [
            'area', 'base', 'basefont', 'br', 'col', 'frame',
            'hr', 'img', 'input', 'isindex', 'link', 'meta', 'param'
          ],

          tokenizer: {
            root: [

              // headers (with #)
              [/^(\s{0,3})(#+)((?:[^\\#]|@escapes)+)((?:#+)?)/, ['white', 'keyword', 'keyword', 'keyword']],

              // headers (with =)
              [/^\s*(=+|\-+)\s*$/, 'keyword'],

              // headers (with ***)
              [/^\s*((\*[ ]?)+)\s*$/, 'meta.separator'],

              // quote
              [/^\s*>+/, 'comment'],

              // list (starting with * or number)
              [/^\s*([\*\-+:]|\d+\.)\s/, 'keyword'],

              // code block (4 spaces indent)
              [/^(\t|[ ]{4})[^ ].*$/, 'string'],

              // code block (3 tilde)
              [/^\s*~~~\s*((?:\w|[\/\-#])+)?\s*$/, { token: 'string', next: '@codeblock' }],

              // display math
              [/\$\$/, { token: 'string', next: '@displaymath' }],

              // github style code blocks (with backticks and language)
              [/^\s*```\s*((?:\w|[\/\-#\+])+)\s*$/, { token: 'string', next: '@codeblockgh', nextEmbedded: '$1' }],

              // github style code blocks (with backticks but no language)
              [/^\s*```\s*$/, { token: 'string', next: '@codeblock' }],

              // markup within lines
              { include: '@linecontent' },
            ],

            displaymath: [
              [/\\\$/, 'variable.source'],
              [/\$\$/, { token: 'string', next: '@pop' }],
              [/./, 'variable.source']
            ],

            codeblock: [
              [/^\s*~~~\s*$/, { token: 'string', next: '@pop' }],
              [/^\s*```\s*$/, { token: 'string', next: '@pop' }],
              [/.*$/, 'variable.source'],
            ],

            // github style code blocks
            codeblockgh: [
              [/```\s*$/, { token: 'variable.source', next: '@pop', nextEmbedded: '@pop' }],
              [/[^`]+/, 'variable.source'],
            ],

            linecontent: [

              // inline math
              [/\$/, { token: 'string', next: '@inlinemath' }],

              // escapes
              [/&\w+;/, 'string.escape'],
              [/@escapes/, 'escape'],

              // various markup
              [/\b__([^\\_]|@escapes|_(?!_))+__\b/, 'strong'],
              [/\*\*([^\\*]|@escapes|\*(?!\*))+\*\*/, 'strong'],
              [/\b_[^_]+_\b/, 'emphasis'],
              [/\*([^\\*]|@escapes)+\*/, 'emphasis'],
              [/`([^\\`]|@escapes)+`/, 'variable'],

              // links
              [/\{+[^}]+\}+/, 'string.target'],
              [/(!?\[)((?:[^\]\\]|@escapes)*)(\]\([^\)]+\))/, ['string.link', '', 'string.link']],
              [/(!?\[)((?:[^\]\\]|@escapes)*)(\])/, 'string.link'],

              // or html
              { include: 'html' },
            ],

            inlinemath: [
              [/\\\$/, 'variable.source'],
              [/\$/, { token: 'string', next: '@pop' }],
              [/./, 'variable.source']
            ],

            // Note: it is tempting to rather switch to the real HTML mode instead of building our own here
            // but currently there is a limitation in Monarch that prevents us from doing it: The opening
            // '<' would start the HTML mode, however there is no way to jump 1 character back to let the
            // HTML mode also tokenize the opening angle bracket. Thus, even though we could jump to HTML,
            // we cannot correctly tokenize it in that mode yet.
            html: [
              // html tags
              [/<(\w+)\/>/, 'tag'],
              [/<(\w+)/, {
                cases: {
                  '@empty': { token: 'tag', next: '@tag.$1' },
                  '@default': { token: 'tag', next: '@tag.$1' }
                }
              }],
              [/<\/(\w+)\s*>/, { token: 'tag' }],

              [/<!--/, 'comment', '@comment']
            ],

            comment: [
              [/[^<\-]+/, 'comment.content'],
              [/-->/, 'comment', '@pop'],
              [/<!--/, 'comment.content.invalid'],
              [/[<\-]/, 'comment.content']
            ],

            // Almost full HTML tag matching, complete with embedded scripts & styles
            tag: [
              [/[ \t\r\n]+/, 'white'],
              [/(type)(\s*=\s*)(")([^"]+)(")/, ['attribute.name.html', 'delimiter.html', 'string.html',
                { token: 'string.html', switchTo: '@tag.$S2.$4' },
                'string.html']],
              [/(type)(\s*=\s*)(')([^']+)(')/, ['attribute.name.html', 'delimiter.html', 'string.html',
                { token: 'string.html', switchTo: '@tag.$S2.$4' },
                'string.html']],
              [/(\w+)(\s*=\s*)("[^"]*"|'[^']*')/, ['attribute.name.html', 'delimiter.html', 'string.html']],
              [/\w+/, 'attribute.name.html'],
              [/\/>/, 'tag', '@pop'],
              [/>/, {
                cases: {
                  '$S2==style': { token: 'tag', switchTo: 'embeddedStyle', nextEmbedded: 'text/css' },
                  '$S2==script': {
                    cases: {
                      '$S3': { token: 'tag', switchTo: 'embeddedScript', nextEmbedded: '$S3' },
                      '@default': { token: 'tag', switchTo: 'embeddedScript', nextEmbedded: 'text/javascript' }
                    }
                  },
                  '@default': { token: 'tag', next: '@pop' }
                }
              }],
            ],

            embeddedStyle: [
              [/[^<]+/, ''],
              [/<\/style\s*>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
              [/</, '']
            ],

            embeddedScript: [
              [/[^<]+/, ''],
              [/<\/script\s*>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
              [/</, '']
            ],
          }
        });
      }

      function autoLayout(editor) {
        window.addEventListener('resize', function () {
          editor.layout();
        });
      }

      $.getScript(window.pathSelfLib + "monaco-editor-tomorrow.js", function () {
        window.createCodeEditor = function (editorElement, langauge, content) {
          editorElement.innerHTML = '';
          var editor = monaco.editor.create(editorElement, {
            value: content,
            language: langauge,
            multicursorModifier: 'ctrlCmd',
            cursorWidth: 1,
            theme: 'tomorrow',
            lineHeight: 22,
            fontSize: 14,
            fontFamily: "'Fira Mono', 'Bitstream Vera Sans Mono', 'Menlo', 'Consolas', 'Lucida Console', 'Source Han Sans SC', 'Noto Sans CJK SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft Yahei', monospace",
            lineNumbersMinChars: 4,
            glyphMargin: false,
            renderFinalNewline: true,
            scrollbar: {
              useShadows: false,
              verticalScrollbarSize: 0,
              vertical: 'hidden'
            },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            contextmenu: false
          });

          autoLayout(editor);
          return editor;
        };

        window.createMarkdownEditor = function (wrapperElement, content, input) {
          wrapperElement.innerHTML = '';
          var editorElement = document.createElement('div');
          editorElement.classList.add('editor-wrapped');
          wrapperElement.appendChild(editorElement);
          var editor = monaco.editor.create(editorElement, {
            value: content,
            language: 'markdown',
            multicursorModifier: 'ctrlCmd',
            cursorWidth: 1,
            theme: 'tomorrow',
            fontSize: 14,
            fontFamily: "'Fira Mono', 'Source Han Sans SC', 'Noto Sans CJK SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft Yahei', monospace",
            lineNumbersMinChars: 4,
            glyphMargin: false,
            lineNumbers: false,
            folding: false,
            minimap: {
              enabled: false
            },
            hover: {
              enabled: false
            },
            wordWrap: "on",
            renderIndentGuides: false,
            renderFinalNewline: false,
            wordBasedSuggestions: false,
            renderLineHighlight: false,
            occurrencesHighlight: false,
            scrollbar: {
              useShadows: false,
              vertical: 'auto',
              verticalScrollbarSize: 10
            },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            contextmenu: false
          });

          input.form.addEventListener('submit', function () {
            input.value = editor.getValue();
          });

          autoLayout(editor);

          return editor;
        };

        window.editorLoaded = true;
        for (var i in window.editorLoadedHandles) {
          window.editorLoadedHandles[i]();
        }
      });
    }
  );
});
