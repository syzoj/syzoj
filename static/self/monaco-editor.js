require.config({
  paths: {
    vs: window.pathLib + "monaco-editor/0.16.2/min/vs",
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
      monaco.languages.register({ id: 'ace_c_cpp' });
      MonacoAceTokenizer.registerRulesForLanguage('ace_c_cpp', new c_cppDefinition.default);
      monaco.languages.setLanguageConfiguration('ace_c_cpp', {
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

      monaco.languages.register({ id: 'ace_csharp' });
      MonacoAceTokenizer.registerRulesForLanguage('ace_csharp', new CSharpDefinition.default);
      monaco.languages.setLanguageConfiguration('ace_csharp', {
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
      
      monaco.languages.register({ id: 'ace_haskell' });
      MonacoAceTokenizer.registerRulesForLanguage('ace_haskell', new HaskellDefinition.default);
      monaco.languages.setLanguageConfiguration('ace_haskell', {
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

      monaco.languages.register({ id: 'ace_java' });
      MonacoAceTokenizer.registerRulesForLanguage('ace_java', new JavaDefinition.default);
      monaco.languages.setLanguageConfiguration('ace_java', {
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
      
      monaco.languages.register({ id: 'ace_javascript' });
      MonacoAceTokenizer.registerRulesForLanguage('ace_javascript', new JavaScriptDefinition.default);
      monaco.languages.setLanguageConfiguration('ace_javascript', {
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

      monaco.languages.register({ id: 'ace_pascal' });
      MonacoAceTokenizer.registerRulesForLanguage('ace_pascal', new PascalDefinition.default);
      monaco.languages.setLanguageConfiguration('ace_pascal', {
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

      monaco.languages.register({ id: 'ace_python' });
      MonacoAceTokenizer.registerRulesForLanguage('ace_python', new PythonDefinition.default);
      monaco.languages.setLanguageConfiguration('ace_python', {
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

      monaco.languages.register({ id: 'ace_ruby' });
      MonacoAceTokenizer.registerRulesForLanguage('ace_ruby', new RubyDefinition.default);
      monaco.languages.setLanguageConfiguration('ace_ruby', {
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


      $.getScript(window.pathSelfLib + "monaco-editor-tomorrow.js", function () {
        window.createEditor = function (editorElement, langauge, content) {
          return monaco.editor.create(editorElement, {
            value: content,
            language: langauge,
            multicursorModifier: 'ctrlCmd',
            cursorWidth: 1,
            theme: 'tomorrow',
            lineHeight: 22,
            fontSize: 14,
            fontFamily: "'Fira Mono', 'Bitstream Vera Sans Mono', 'Menlo', 'Consolas', 'Lucida Console', monospace",
            lineNumbersMinChars: 4,
            glyphMargin: false
          });
        };

        window.editorLoaded = true;
        for (var i in window.editorLoadedHandles) {
          window.editorLoadedHandles[i]();
        }
      });
    }
  );
});
