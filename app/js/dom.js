// Tiny DOM helpers: build elements declaratively without a framework.

/** Create an element: h('a', { class: 'x', href, onClick }, child, 'text', [more]) */
export function h(tag, props, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') element.className = value;
    else if (key === 'dataset') Object.assign(element.dataset, value);
    else if (key === 'style') element.setAttribute('style', value);
    else if (key.startsWith('on') && typeof value === 'function') element.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'checked' || key === 'value' || key === 'disabled') element[key] = value;
    else element.setAttribute(key, value === true ? '' : String(value));
  }
  appendChildren(element, children);
  return element;
}

/** Append strings, nodes and nested arrays, skipping empty values. */
export function appendChildren(element, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
}

/** A labelled horizontal meter: filled share of done/total. */
export function meter(done, total, className = '') {
  const percent = total ? Math.round((done / total) * 100) : 0;
  return h('span', { class: `meter ${className}`, role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': done },
    h('span', { class: 'meter-fill', style: `width:${percent}%` }));
}

/** An external source link: opens only when the reader follows it. */
export function externalLink(url, text, className = '') {
  return h('a', { class: className, href: url, target: '_blank', rel: 'noopener noreferrer' }, text);
}

/** Hostname for display next to a link, without the www. prefix. */
export function shortHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
