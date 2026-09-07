/**
 * Strudel Upstream Baseline: Transpiler
 * Transpiles live code expressions into structured pattern evaluation graphs.
 */

const miniNotation = require('./mini-notation');

function transpile(expression) {
  if (typeof expression !== 'string') {
    throw new Error('Expression must be a string');
  }

  const trimmed = expression.trim();
  // Extract primary operator: s("..."), sound("..."), note("...")
  const opMatch = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(\s*(['"`])(.*?)\2\s*\)/);

  if (opMatch) {
    const operator = opMatch[1];
    const patternStr = opMatch[3];
    const ast = miniNotation.parse(patternStr);

    return {
      type: 'PatternGraph',
      operator: operator,
      pattern: patternStr,
      ast: ast,
      modifiers: []
    };
  }

  // Fallback direct mini-notation string
  return {
    type: 'PatternGraph',
    operator: 's',
    pattern: trimmed,
    ast: miniNotation.parse(trimmed),
    modifiers: []
  };
}

module.exports = {
  transpile
};
