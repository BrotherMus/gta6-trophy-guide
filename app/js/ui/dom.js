// Tiny element builder shared by every view, so views read as markup instead of DOM plumbing.

/**
 * Create an element. props: className, text, attrs {name: value}, on {event: handler}, dataset, and any DOM property.
 * Children may be nodes, strings, numbers, arrays, or null/false (skipped).
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'attrs') for (const [name, attr] of Object.entries(value)) node.setAttribute(name, attr);
    else if (key === 'on') for (const [event, handler] of Object.entries(value)) node.addEventListener(event, handler);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else node[key] = value;
  }
  appendChildren(node, children);
  return node;
}

export function appendChildren(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : String(child));
  }
  return node;
}

export function replaceContent(node, ...children) {
  node.replaceChildren();
  return appendChildren(node, children);
}
