"use strict";
var LinkNode = (function () {
    function LinkNode(key, value) {
        this.key = "";
        this.value = undefined;
        this._prev = null;
        this._next = null;
        this.key = key;
        this.value = value;
        this._prev = null;
        this._next = null;
    }
    return LinkNode;
}());
var LRUCache = (function () {
    function LRUCache(size) {
        this.head = null;
        this.tail = null;
        this.size = 0;
        this.map = new Map();
        this.head = null;
        this.tail = null;
        this.size = size;
        this.map = new Map();
    }
    LRUCache.prototype.moveNodeToFirst = function (node) {
        var _prev = node._prev;
        var _next = node._next;
        if (_prev) {
            _prev._next = _next;
            if (_next) {
                _next._prev = _prev;
            }
            else {
                this.tail = _prev;
            }
            node._next = this.head;
            node._prev = null;
            this.head._prev = node;
            this.head = node;
        }
        else {
        }
    };
    LRUCache.prototype.removeLastNode = function () {
        if (this.map.size > 1) {
            var lastNode = this.tail;
            this.map.delete(lastNode.key);
            this.tail = lastNode._prev;
            this.tail._next = null;
        }
        else {
            this.tail = null;
            this.head = null;
            this.map = new Map();
        }
    };
    LRUCache.prototype.has = function (key) {
        return this.map.has(key);
    };
    LRUCache.prototype.get = function (key) {
        if (this.map.has(key)) {
            var node = this.map.get(key);
            this.moveNodeToFirst(node);
            return node.value;
        }
        else {
            return undefined;
        }
    };
    LRUCache.prototype.put = function (key, value) {
        if (this.map.has(key)) {
            var node = this.map.get(key);
            node.value = value;
            this.moveNodeToFirst(node);
        }
        else {
            var node = new LinkNode(key, value);
            this.map.set(key, node);
            if (this.head) {
                node._next = this.head;
                this.head._prev = node;
                this.head = node;
            }
            else {
                this.head = node;
                this.tail = node;
            }
            if (this.map.size > this.size) {
                this.removeLastNode();
            }
        }
    };
    return LRUCache;
}());

export default LRUCache
