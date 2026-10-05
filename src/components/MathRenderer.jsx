import React, { useMemo } from 'react';
import katex from 'katex';

/**
 * Safely renders LaTeX strings embedded in text with KaTeX
 * Supports:
 *  - Inline math: $...$
 *  - Display block math: $$...$$
 *  - Pure math strings
 *  - Standalone BlockMath and InlineMath components
 */

export function BlockMath({ math = '', className = '' }) {
  const html = useMemo(() => {
    try {
      const clean = String(math || '')
        .replace(/^\$\$/g, '')
        .replace(/\$\$$/g, '')
        .replace(/^\$/g, '')
        .replace(/\$$/g, '');
      return katex.renderToString(clean, {
        displayMode: true,
        throwOnError: false,
        output: 'htmlAndMathml'
      });
    } catch (err) {
      return `<pre class="katex-fallback">${math}</pre>`;
    }
  }, [math]);

  return (
    <div 
      className={`katex-block-elem overflow-x-auto ${className}`} 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

export function InlineMath({ math = '', className = '' }) {
  const html = useMemo(() => {
    try {
      const clean = String(math || '')
        .replace(/^\$\$/g, '')
        .replace(/\$\$$/g, '')
        .replace(/^\$/g, '')
        .replace(/\$$/g, '');
      return katex.renderToString(clean, {
        displayMode: false,
        throwOnError: false,
        output: 'htmlAndMathml'
      });
    } catch (err) {
      return `<code class="katex-raw-code">${math}</code>`;
    }
  }, [math]);

  return (
    <span 
      className={`katex-inline-elem ${className}`} 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

export default function MathRenderer({ text = '', className = '', block = false }) {
  const renderedContent = useMemo(() => {
    if (!text && text !== 0) return null;
    const str = String(text);

    // If pure block requested or starts/ends with $$
    if (block) {
      try {
        const clean = str.replace(/^\$\$/g, '').replace(/\$\$$/g, '');
        const html = katex.renderToString(clean, {
          displayMode: true,
          throwOnError: false,
          output: 'htmlAndMathml'
        });
        return <div className={`katex-block-wrapper ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch (err) {
        return <pre className="katex-fallback">{str}</pre>;
      }
    }

    // Split text by $$...$$ (display) and $...$ (inline)
    // Regex matches $$...$$ or $...$
    const tokens = [];
    let lastIndex = 0;
    const regex = /\$\$([\s\S]+?)\$\$|\$([^\$]+?)\$/g;
    let match;

    while ((match = regex.exec(str)) !== null) {
      // Plain text before match
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          value: str.slice(lastIndex, match.index)
        });
      }

      if (match[1] !== undefined) {
        // Block math $$...$$
        tokens.push({
          type: 'block-math',
          value: match[1]
        });
      } else if (match[2] !== undefined) {
        // Inline math $...$
        tokens.push({
          type: 'inline-math',
          value: match[2]
        });
      }

      lastIndex = regex.lastIndex;
    }

    // Remaining text
    if (lastIndex < str.length) {
      tokens.push({
        type: 'text',
        value: str.slice(lastIndex)
      });
    }

    if (tokens.length === 0) {
      return <span>{str}</span>;
    }

    return (
      <span className={`math-content ${className}`}>
        {tokens.map((token, i) => {
          if (token.type === 'text') {
            // Support newline breaks in text
            const lines = token.value.split('\n');
            return (
              <React.Fragment key={i}>
                {lines.map((line, lineIdx) => (
                  <React.Fragment key={lineIdx}>
                    {line}
                    {lineIdx < lines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </React.Fragment>
            );
          }

          const isBlock = token.type === 'block-math';
          try {
            const html = katex.renderToString(token.value, {
              displayMode: isBlock,
              throwOnError: false,
              output: 'htmlAndMathml'
            });
            return (
              <span
                key={i}
                className={isBlock ? 'katex-block-elem' : 'katex-inline-elem'}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (err) {
            return (
              <code key={i} className="katex-raw-code">
                ${token.value}$
              </code>
            );
          }
        })}
      </span>
    );
  }, [text, className, block]);

  return renderedContent;
}
