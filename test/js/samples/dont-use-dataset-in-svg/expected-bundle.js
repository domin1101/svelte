function noop() {}

function assign(tar, src) {
	for (var k in src) tar[k] = src[k];
	return tar;
}

function _differsImmutable(a, b) {
	return a != a ? b == b : a !== b;
}

function callAll(fns) {
	while (fns && fns.length) fns.shift()();
}

function appendNode(node, target) {
	target.appendChild(node);
}

function insertNode(node, target, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

function createSvgElement(name) {
	return document.createElementNS('http://www.w3.org/2000/svg', name);
}

function setAttribute(node, attribute, value) {
	node.setAttribute(attribute, value);
}

function blankObject() {
	return Object.create(null);
}

class Base {
	constructor() {
		this._handlers = blankObject();
	}

	fire(eventName, data) {
		const handlers = eventName in this._handlers && this._handlers[eventName].slice();
		if (!handlers) return;

		for (let i = 0; i < handlers.length; i += 1) {
			const handler = handlers[i];

			if (!handler.__calling) {
				handler.__calling = true;
				handler.call(this, data);
				handler.__calling = false;
			}
		}
	}

	get() {
		return this._state;
	}

	on(eventName, handler) {
		const handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
		handlers.push(handler);

		return {
			cancel: function() {
				const index = handlers.indexOf(handler);
				if (~index) handlers.splice(index, 1);
			}
		};
	}

	_differs(a, b) {
		return _differsImmutable(a, b) || ((a && typeof a === 'object') || typeof a === 'function');
	}
}

class Component extends Base {
	constructor(options) {
		super();
		this._init(options);
	}

	destroy(detach) {
		this.destroy = noop;
		this.fire('destroy');
		this.set = this.get = noop;

		if (detach !== false) this._fragment.u();
		this._fragment.d();
		this._fragment = this._state = null;
	}

	set(newState) {
		this._set(assign({}, newState));
		if (this.root._lock) return;
		this.root._lock = true;
		callAll(this.root._beforecreate);
		callAll(this.root._oncreate);
		callAll(this.root._aftercreate);
		this.root._lock = false;
	}

	_init(options) {
		this._bind = options._bind;
		this._slotted = options.slots || {};

		this.options = options;
		this.root = options.root || this;
		this.store = this.root.store || options.store;

		if (!options.root) {
			this._oncreate = [];
			this._beforecreate = [];
			this._aftercreate = [];
		}

		this.refs = {};
		this.slots = {};
	}

	_set(newState) {
		const previous = this._state;
		const changed = {};
		let dirty = false;

		for (var key in newState) {
			if (this._differs(newState[key], previous[key])) changed[key] = dirty = 1;
		}

		if (!dirty) return;

		this._state = assign(assign({}, previous), newState);
		this._recompute(changed, this._state);
		if (this._bind) this._bind(changed, this._state);

		if (this._fragment) {
			this.fire("state", { changed, current: this._state, previous });
			this._fragment.p(changed, this._state);
			this.fire("update", { changed, current: this._state, previous });
		}
	}

	_mount(target, anchor) {
		this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
	}

	_recompute() {}

	_unmount() {
		if (this._fragment) this._fragment.u();
	}
}

/* generated by Svelte vX.Y.Z */

function create_main_fragment(component, state) {
	var svg, g, g_1;

	return {
		c: function create() {
			svg = createSvgElement("svg");
			g = createSvgElement("g");
			g_1 = createSvgElement("g");
			this.h();
		},

		h: function hydrate() {
			setAttribute(g, "data-foo", "bar");
			setAttribute(g_1, "data-foo", state.bar);
		},

		m: function mount(target, anchor) {
			insertNode(svg, target, anchor);
			appendNode(g, svg);
			appendNode(g_1, svg);
		},

		p: function update(changed, state) {
			if (changed.bar) {
				setAttribute(g_1, "data-foo", state.bar);
			}
		},

		u: function unmount() {
			detachNode(svg);
		},

		d: noop
	};
}

class SvelteComponent extends Component {
	constructor(options) {
		super(options);
		this._state = assign({}, options.data);

		this._fragment = create_main_fragment(this, this._state);

		if (options.target) {
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}
	}
}

export default SvelteComponent;
