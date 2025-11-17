// Strict parser using only string/array operations (no regex)

function collapseWhitespace(s) {
  if (s == null) return '';
  let out = '';
  let lastWasSpace = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      if (!lastWasSpace) {
        out += ' ';
        lastWasSpace = true;
      }
    } else {
      out += ch;
      lastWasSpace = false;
    }
  }
  return out.trim();
}

function splitTokens(s) {
  const compact = collapseWhitespace(s);
  if (compact === '') return [];
  return compact.split(' ');
}

function parseInstruction(instruction) {
  const tokens = splitTokens(instruction);
  if (tokens.length === 0) return { unparseable: true };

  const first = tokens[0].toUpperCase();
  if (first !== 'DEBIT' && first !== 'CREDIT') return { unparseable: true };

  if (first === 'DEBIT') {
    // Expected pattern tokens positions (strict ordering)
    if (tokens.length < 11) return { unparseable: false, type: 'DEBIT', error: 'SY01' };

    const amount = tokens[1];
    const currency = tokens[2] ? tokens[2].toUpperCase() : null;
    if (!tokens[3] || tokens[3].toUpperCase() !== 'FROM') return { unparseable: false, type: 'DEBIT', error: 'SY02' };
    if (!tokens[4] || tokens[4].toUpperCase() !== 'ACCOUNT') return { unparseable: false, type: 'DEBIT', error: 'SY02' };
    const debitAccountId = tokens[5] || null;
    if (!tokens[6] || tokens[6].toUpperCase() !== 'FOR') return { unparseable: false, type: 'DEBIT', error: 'SY02' };
    if (!tokens[7] || tokens[7].toUpperCase() !== 'CREDIT') return { unparseable: false, type: 'DEBIT', error: 'SY02' };
    if (!tokens[8] || tokens[8].toUpperCase() !== 'TO') return { unparseable: false, type: 'DEBIT', error: 'SY02' };
    if (!tokens[9] || tokens[9].toUpperCase() !== 'ACCOUNT') return { unparseable: false, type: 'DEBIT', error: 'SY02' };
    const creditAccountId = tokens[10] || null;

    let onDate = null;
    if (tokens.length > 11 && tokens[11].toUpperCase() === 'ON') onDate = tokens[12] || null;

    return {
      unparseable: false,
      type: 'DEBIT',
      amount,
      currency,
      debitAccountId,
      creditAccountId,
      onDate
    };
  }

  if (first === 'CREDIT') {
    if (tokens.length < 11) return { unparseable: false, type: 'CREDIT', error: 'SY01' };

    const amount = tokens[1];
    const currency = tokens[2] ? tokens[2].toUpperCase() : null;
    if (!tokens[3] || tokens[3].toUpperCase() !== 'TO') return { unparseable: false, type: 'CREDIT', error: 'SY02' };
    if (!tokens[4] || tokens[4].toUpperCase() !== 'ACCOUNT') return { unparseable: false, type: 'CREDIT', error: 'SY02' };
    const creditAccountId = tokens[5] || null;
    if (!tokens[6] || tokens[6].toUpperCase() !== 'FOR') return { unparseable: false, type: 'CREDIT', error: 'SY02' };
    if (!tokens[7] || tokens[7].toUpperCase() !== 'DEBIT') return { unparseable: false, type: 'CREDIT', error: 'SY02' };
    if (!tokens[8] || tokens[8].toUpperCase() !== 'FROM') return { unparseable: false, type: 'CREDIT', error: 'SY02' };
    if (!tokens[9] || tokens[9].toUpperCase() !== 'ACCOUNT') return { unparseable: false, type: 'CREDIT', error: 'SY02' };
    const debitAccountId = tokens[10] || null;

    let onDate = null;
    if (tokens.length > 11 && tokens[11].toUpperCase() === 'ON') onDate = tokens[12] || null;

    return {
      unparseable: false,
      type: 'CREDIT',
      amount,
      currency,
      debitAccountId,
      creditAccountId,
      onDate
    };
  }

  return { unparseable: true };
}

module.exports = parseInstruction;
