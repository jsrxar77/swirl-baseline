/**
 * Strudel Upstream Baseline: Mini-Notation Parser and AST Generator
 * Deterministic tokenizer and recursive descent parser for TidalCycles / Strudel mini-notation.
 */

function tokenize(input) {
  const tokens = [];
  let i = 0;
  const str = input.trim();

  while (i < str.length) {
    const char = str[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (char === '[' || char === ']' || char === ',' || char === '*' || char === '/') {
      tokens.push({ type: 'PUNCT', value: char });
      i++;
      continue;
    }

    if (/[a-zA-Z0-9_~#]/.test(char)) {
      let word = '';
      while (i < str.length && /[a-zA-Z0-9_~#.]/.test(str[i])) {
        word += str[i];
        i++;
      }
      tokens.push({ type: 'ATOM', value: word });
      continue;
    }

    i++;
  }

  return tokens;
}

function parse(input) {
  const tokens = tokenize(input);
  let pos = 0;

  function parseSequence(stopToken = null) {
    const children = [];

    while (pos < tokens.length) {
      const token = tokens[pos];

      if (stopToken && token.value === stopToken) {
        pos++;
        break;
      }

      if (token.value === '[') {
        pos++;
        const subSeq = parseSequence(']');
        children.push({
          type: 'Subdivision',
          children: subSeq
        });
        continue;
      }

      if (token.type === 'ATOM') {
        let atomNode = {
          type: 'Atom',
          value: token.value
        };
        pos++;

        // Handle multiplier * or division /
        if (pos < tokens.length && (tokens[pos].value === '*' || tokens[pos].value === '/')) {
          const op = tokens[pos].value;
          pos++;
          if (pos < tokens.length && tokens[pos].type === 'ATOM') {
            const factor = parseFloat(tokens[pos].value) || 1;
            pos++;
            atomNode = {
              type: 'ModifiedAtom',
              operator: op,
              factor: factor,
              child: atomNode
            };
          }
        }

        children.push(atomNode);
        continue;
      }

      pos++;
    }

    return children;
  }

  const rootChildren = parseSequence();
  return {
    type: 'Sequence',
    raw: input,
    children: rootChildren
  };
}

module.exports = {
  tokenize,
  parse
};
