/* @ds-bundle: {"format":4,"namespace":"Across","components":[{"name":"Button"},{"name":"Cell"},{"name":"Grid"},{"name":"ClueBar"},{"name":"ClueList"}]} */
(function () {
  var R = window.React;
  var h = R.createElement;
  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }
  function omit(obj, keys) {
    var o = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) o[k] = obj[k];
    return o;
  }

  /* ---------- Button ---------- */
  function Button(props) {
    var variant = props.variant || 'secondary';
    var rest = omit(props, ['variant', 'className', 'children']);
    rest.type = rest.type || 'button';
    rest.className = cx('ac-btn', 'ac-btn--' + variant, props.className);
    return h('button', rest, props.children);
  }

  /* ---------- Cell ---------- */
  function Cell(props) {
    var state = props.state || 'empty';
    var size = props.size || 'md';
    var letter = props.letter || '';
    var block = state === 'block';
    var cls = cx(
      'ac-cell',
      'ac-cell--' + size,
      'ac-cell--' + state,
      props.inGrid && 'ac-cell--in-grid',
      props.pencil && 'ac-cell--pencil',
      props.mark && 'ac-cell--' + props.mark,
      props.circled && 'ac-cell--circled',
      props.className
    );
    var label = block
      ? 'Black square'
      : (props.number ? props.number + ', ' : '') + (letter ? letter : 'empty') +
        (props.pencil ? ', pencil' : '') + (props.mark === 'wrong' ? ', incorrect' : '') +
        (props.mark === 'revealed' ? ', revealed' : '');
    return h(
      'div',
      { className: cls, role: 'gridcell', 'aria-label': label, 'aria-selected': state === 'active' ? true : undefined, onClick: props.onClick },
      block ? null : [
        props.number ? h('span', { key: 'n', className: 'ac-cell__num', 'aria-hidden': true }, props.number) : null,
        h('span', { key: 'l', className: 'ac-cell__letter', 'aria-hidden': true }, letter),
        props.mark === 'wrong' ? h('span', { key: 'm', className: 'ac-cell__slash', 'aria-hidden': true }) : null,
        props.mark === 'revealed' ? h('span', { key: 'm', className: 'ac-cell__flag', 'aria-hidden': true }) : null
      ]
    );
  }

  /* ---------- numbering ---------- */
  function numberGrid(solution) {
    var H = solution.length, W = solution[0].length;
    var isBlock = function (r, c) { return r < 0 || c < 0 || r >= H || c >= W || solution[r][c] === '#'; };
    var numbers = [], across = [], down = [], n = 0;
    for (var r = 0; r < H; r++) {
      numbers.push([]);
      for (var c = 0; c < W; c++) {
        var num = 0;
        if (!isBlock(r, c)) {
          var a = isBlock(r, c - 1) && !isBlock(r, c + 1);
          var d = isBlock(r - 1, c) && !isBlock(r + 1, c);
          if (a || d) {
            num = ++n;
            if (a) { var la = 0; while (!isBlock(r, c + la)) la++; across.push({ number: num, row: r, col: c, length: la, answer: solution[r].substr(c, la) }); }
            if (d) { var ld = 0, ans = ''; while (!isBlock(r + ld, c)) { ans += solution[r + ld][c]; ld++; } down.push({ number: num, row: r, col: c, length: ld, answer: ans }); }
          }
        }
        numbers[r].push(num);
      }
    }
    return { numbers: numbers, across: across, down: down, rows: H, cols: W };
  }

  function wordAt(info, r, c, dir) {
    var list = dir === 'across' ? info.across : info.down;
    for (var i = 0; i < list.length; i++) {
      var w = list[i];
      if (dir === 'across' && w.row === r && c >= w.col && c < w.col + w.length) return w;
      if (dir === 'down' && w.col === c && r >= w.row && r < w.row + w.length) return w;
    }
    return null;
  }

  /* ---------- Grid ---------- */
  function Grid(props) {
    var solution = props.solution;
    var info = R.useMemo(function () { return numberGrid(solution); }, [solution.join('|')]);
    var init = (props.entries || solution.map(function (row) { return row.replace(/[^#]/g, '.'); }));
    var st = R.useState(function () { return init.map(function (row) { return row.split(''); }); });
    var grid = st[0], setGrid = st[1];
    var first = props.active || (function () {
      for (var r = 0; r < info.rows; r++) for (var c = 0; c < info.cols; c++) if (solution[r][c] !== '#') return { row: r, col: c, direction: 'across' };
    })();
    var ss = R.useState({ r: first.row, c: first.col, dir: first.direction || 'across' });
    var sel = ss[0], setSel = ss[1];
    var marks = props.marks || {};
    var readOnly = !!props.readOnly;

    var dir = sel.dir;
    var w = wordAt(info, sel.r, sel.c, dir);
    if (!w) { dir = dir === 'across' ? 'down' : 'across'; w = wordAt(info, sel.r, sel.c, dir); }

    R.useEffect(function () {
      if (props.onSelect && w) props.onSelect({ number: w.number, direction: dir, row: w.row, col: w.col, length: w.length });
    }, [w && w.number, dir]);

    function isBlock(r, c) { return r < 0 || c < 0 || r >= info.rows || c >= info.cols || solution[r][c] === '#'; }
    function inWord(r, c) {
      if (!w) return false;
      return dir === 'across' ? (r === w.row && c >= w.col && c < w.col + w.length) : (c === w.col && r >= w.row && r < w.row + w.length);
    }
    function step(r, c, d, k) {
      var dr = d === 'down' ? k : 0, dc = d === 'across' ? k : 0;
      var nr = r + dr, nc = c + dc;
      var inside = function () { return nr >= 0 && nc >= 0 && nr < info.rows && nc < info.cols; };
      while (inside() && isBlock(nr, nc)) { nr += dr; nc += dc; } /* hop over black squares */
      if (isBlock(nr, nc)) return null;
      return { r: nr, c: nc };
    }
    function setLetter(r, c, ch) {
      setGrid(function (g) {
        var copy = g.map(function (row) { return row.slice(); });
        copy[r][c] = ch;
        if (props.onChange) props.onChange(copy.map(function (row) { return row.join(''); }));
        return copy;
      });
    }
    function onKeyDown(e) {
      var k = e.key;
      var arrows = { ArrowLeft: ['across', -1], ArrowRight: ['across', 1], ArrowUp: ['down', -1], ArrowDown: ['down', 1] };
      if (arrows[k]) {
        e.preventDefault();
        var a = arrows[k];
        if (a[0] !== dir) { setSel({ r: sel.r, c: sel.c, dir: a[0] }); return; }
        var n = step(sel.r, sel.c, a[0], a[1]);
        if (n) setSel({ r: n.r, c: n.c, dir: dir });
        return;
      }
      if (k === ' ') { e.preventDefault(); setSel({ r: sel.r, c: sel.c, dir: dir === 'across' ? 'down' : 'across' }); return; }
      if (readOnly) return;
      if (/^[a-zA-Z]$/.test(k) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setLetter(sel.r, sel.c, props.pencilMode ? k.toLowerCase() : k.toUpperCase());
        var nx = w && inWord(sel.r + (dir === 'down' ? 1 : 0), sel.c + (dir === 'across' ? 1 : 0));
        if (nx) setSel({ r: sel.r + (dir === 'down' ? 1 : 0), c: sel.c + (dir === 'across' ? 1 : 0), dir: dir });
        return;
      }
      if (k === 'Backspace') {
        e.preventDefault();
        if (grid[sel.r][sel.c] !== '.') { setLetter(sel.r, sel.c, '.'); return; }
        var pr = sel.r - (dir === 'down' ? 1 : 0), pc = sel.c - (dir === 'across' ? 1 : 0);
        if (inWord(pr, pc)) { setLetter(pr, pc, '.'); setSel({ r: pr, c: pc, dir: dir }); }
      }
    }

    var size = props.size || 'md';
    var cells = [];
    for (var r = 0; r < info.rows; r++) {
      for (var c = 0; c < info.cols; c++) {
        (function (r, c) {
          var key = r + ',' + c;
          if (isBlock(r, c)) { cells.push(h(Cell, { key: key, state: 'block', size: size, inGrid: true })); return; }
          var raw = grid[r][c];
          var letter = raw === '.' ? '' : raw.toUpperCase();
          var pencil = raw !== '.' && raw !== raw.toUpperCase();
          var state = r === sel.r && c === sel.c ? 'active' : (inWord(r, c) ? 'word' : 'empty');
          cells.push(h(Cell, {
            key: key, size: size, inGrid: true, state: state, letter: letter, pencil: pencil,
            number: info.numbers[r][c] || undefined, mark: marks[key],
            circled: (props.circles || []).indexOf(key) >= 0,
            onClick: function () {
              if (r === sel.r && c === sel.c) setSel({ r: r, c: c, dir: dir === 'across' ? 'down' : 'across' });
              else setSel({ r: r, c: c, dir: dir });
            }
          }));
        })(r, c);
      }
    }
    return h('div', {
      className: cx('ac-grid', 'ac-grid--' + size, props.className),
      role: 'grid',
      'aria-label': props.label || 'Crossword grid',
      tabIndex: 0,
      onKeyDown: onKeyDown,
      style: { gridTemplateColumns: 'repeat(' + info.cols + ', var(--ac-cell))' }
    }, cells);
  }

  /* ---------- ClueBar ---------- */
  function ClueBar(props) {
    var d = props.direction === 'down' ? 'D' : 'A';
    return h('div', { className: cx('ac-cluebar', props.className), 'aria-live': 'polite' },
      props.onPrev ? h('button', { type: 'button', className: 'ac-cluebar__nav', onClick: props.onPrev, 'aria-label': 'Previous clue' }, '‹') : null,
      h('span', { className: 'ac-cluebar__chip', 'aria-label': props.number + ' ' + (props.direction || 'across') }, props.number + d),
      h('span', { className: 'ac-cluebar__text' }, props.children),
      props.onNext ? h('button', { type: 'button', className: 'ac-cluebar__nav', onClick: props.onNext, 'aria-label': 'Next clue' }, '›') : null
    );
  }

  /* ---------- ClueList ---------- */
  function ClueList(props) {
    var title = props.title || (props.direction === 'down' ? 'Down' : 'Across');
    return h('section', { className: cx('ac-cluelist', props.className), 'aria-label': title + ' clues' },
      h('h3', { className: 'ac-cluelist__title' }, title),
      h('ol', { className: 'ac-cluelist__items' },
        (props.clues || []).map(function (cl) {
          var active = cl.number === props.activeNumber;
          var cross = cl.number === props.crossingNumber;
          return h('li', { key: cl.number },
            h('button', {
              type: 'button',
              className: cx('ac-clue', active && 'ac-clue--active', cross && 'ac-clue--crossing', cl.done && 'ac-clue--done'),
              'aria-current': active ? 'true' : undefined,
              onClick: props.onSelect ? function () { props.onSelect(cl.number); } : undefined
            },
              h('span', { className: 'ac-clue__num' }, cl.number),
              h('span', { className: 'ac-clue__text' }, cl.text)
            )
          );
        })
      )
    );
  }

  var api = { Button: Button, Cell: Cell, Grid: Grid, ClueBar: ClueBar, ClueList: ClueList, numberGrid: numberGrid };
  window.Across = window.Across || {};
  for (var k in api) window.Across[k] = api[k];
})();
