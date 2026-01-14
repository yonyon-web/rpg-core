/**
 * Simple TypeScript/JavaScript syntax highlighter
 * Adds syntax highlighting to code blocks without external dependencies
 */
(function() {
    'use strict';
    
    function highlightTypeScript(code) {
        // List of TypeScript/JavaScript keywords
        const keywordList = ['import', 'export', 'from', 'const', 'let', 'var', 'function', 'class', 'interface', 'type', 'extends', 'implements', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'throw', 'try', 'catch', 'finally', 'new', 'this', 'super', 'async', 'await', 'yield', 'typeof', 'instanceof', 'void', 'null', 'undefined', 'true', 'false', 'enum', 'namespace', 'module', 'declare', 'public', 'private', 'protected', 'static', 'readonly', 'get', 'set', 'as', 'is', 'in', 'of', 'any', 'never', 'unknown', 'string', 'number', 'boolean', 'object', 'symbol'];
        
        // Keywords
        const keywords = new RegExp('\\b(' + keywordList.join('|') + ')\\b', 'g');
        
        // Strings
        const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
        
        // Comments
        const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
        
        // Numbers
        const numbers = /\b(\d+\.?\d*)\b/g;
        
        // Functions (excluding keywords) - use negative lookahead to exclude keywords
        const keywordPattern = keywordList.join('|');
        const functions = new RegExp('\\b(?!' + keywordPattern + '\\b)([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*(?=\\()', 'g');
        
        // Types (capitalized words, but exclude built-in type keywords)
        const types = /\b(?!String\b|Number\b|Boolean\b|Object\b|Symbol\b|Array\b)([A-Z][a-zA-Z0-9_$]*)\b/g;
        
        // Temporarily replace strings and comments to avoid conflicts
        const placeholders = [];
        let placeholderIndex = 0;
        
        code = code.replace(comments, (match) => {
            const placeholder = `___COMMENT_${placeholderIndex}___`;
            placeholders.push({ placeholder, value: `<span class="hljs-comment">${escapeHtml(match)}</span>` });
            placeholderIndex++;
            return placeholder;
        });
        
        code = code.replace(strings, (match) => {
            const placeholder = `___STRING_${placeholderIndex}___`;
            placeholders.push({ placeholder, value: `<span class="hljs-string">${escapeHtml(match)}</span>` });
            placeholderIndex++;
            return placeholder;
        });
        
        // Escape HTML
        code = escapeHtml(code);
        
        // Apply syntax highlighting in order: keywords first, then others
        code = code.replace(keywords, '<span class="hljs-keyword">$1</span>');
        code = code.replace(numbers, '<span class="hljs-number">$1</span>');
        code = code.replace(functions, '<span class="hljs-function">$1</span>');
        code = code.replace(types, '<span class="hljs-type">$1</span>');
        
        // Restore placeholders
        placeholders.forEach(({ placeholder, value }) => {
            code = code.replace(placeholder, value);
        });
        
        return code;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Initialize highlighting on page load
    function init() {
        document.querySelectorAll('pre code').forEach((block) => {
            const originalCode = block.textContent;
            const highlightedCode = highlightTypeScript(originalCode);
            block.innerHTML = highlightedCode;
            block.classList.add('hljs');
        });
    }
    
    // Export for use
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
