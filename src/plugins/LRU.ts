/**
 * 请你设计并实现一个满足  LRU (最近最少使用) 缓存 约束的数据结构。
    实现 LRUCache 类：
    LRUCache(int capacity) 以 正整数 作为容量 capacity 初始化 LRU 缓存
    int get(int key) 如果关键字 key 存在于缓存中，则返回关键字的值，否则返回 -1 。
    void put(int key, int value) 如果关键字 key 已经存在，则变更其数据值 value ；如果不存在，则向缓存中插入该组 key-value 。如果插入操作导致关键字数量超过 capacity ，则应该 逐出 最久未使用的关键字。
    函数 get 和 put 必须以 O(1) 的平均时间复杂度运行。
*/

/**
 * eg:LRUCache lRUCache = new LRUCache(2);
    lRUCache.put(1, 1); // 缓存是 {1=1}
    lRUCache.put(2, 2); // 缓存是 {1=1, 2=2}
    lRUCache.get(1);    // 返回 1
    lRUCache.put(3, 3); // 该操作会使得关键字 2 作废，缓存是 {1=1, 3=3}
    lRUCache.get(2);    // 返回 -1 (未找到)
    lRUCache.put(4, 4); // 该操作会使得关键字 1 作废，缓存是 {4=4, 3=3}
    lRUCache.get(1);    // 返回 -1 (未找到)
    lRUCache.get(3);    // 返回 3
    lRUCache.get(4);    // 返回 4
*/

// 节点类
class LinkNode {
    key: any = "";
    value: any = undefined;
    _prev: LinkNode | null = null;
    _next: LinkNode | null = null;
    constructor(key: any, value: any) {
        this.key = key;
        this.value = value;
        this._prev = null;
        this._next = null;
    }
}

// LRU缓存类，双向链表+Map,常用的放在链表最前方，删除的时候删链表尾部数据
class LRUCache {
    head: LinkNode | null = null;  // 表头
    tail: LinkNode | null = null;  // 表尾
    size: number = 0; // 表容量
    map = new Map<string, LinkNode>();

    constructor(size: number) {
        this.head = null;
        this.tail = null;
        this.size = size;
        this.map = new Map();
    }
    moveNodeToFirst(node: LinkNode) {
        let _prev = node._prev;
        let _next = node._next;
        if (_prev) {
            _prev._next = _next;
            if (_next) {
                _next._prev = _prev;
            } else {
                this.tail = _prev;
            }

            // 非头部节需要把节点提到链表头部
            node._next = this.head;
            node._prev = null;
            (this.head as LinkNode)._prev = node;
            this.head = node;
        } else {
            // 已经在链表头部了
        }
    }
    removeLastNode() {
        if (this.map.size > 1) {
            let lastNode = this.tail as LinkNode;
            this.map.delete(lastNode.key);
            this.tail = lastNode._prev as LinkNode;
            this.tail._next = null;

        } else {
            this.tail = null;
            this.head = null;
            this.map = new Map();
        }
    }

    has(key: any) {
        return this.map.has(key)
    }

    get(key: any) {
        if (this.map.has(key)) {
            let node = this.map.get(key) as LinkNode;
            this.moveNodeToFirst(node);
            printLRU(this)
            return node.value
        } else {
            printLRU(this)
            return undefined
        }
    }

    put(key: any, value: any) {
        if (this.map.has(key)) {
            // 修改
            // 链表中已存在，修改已有节点数值，并移动到头部
            let node = this.map.get(key) as LinkNode;
            node.value = value;
            this.moveNodeToFirst(node);

        } else {
            // 新增
            // 链表中不存在，新建节点，并放置到头部
            let node = new LinkNode(key, value);
            this.map.set(key, node); // 记录节点位置
            if (this.head) {
                node._next = this.head;
                this.head._prev = node;
                this.head = node;
            } else {
                this.head = node;
                this.tail = node;
            }

            // 新增后若容量超出则删除链表尾部节点
            if (this.map.size > this.size) {
                this.removeLastNode();
            }
        }
        printLRU(this)
    }
}

function printLRU(lru: LRUCache) {
    let res = [];
    let node = lru.head;
    while (node) {
        // res.push([node.key, node.value]);
        res.push(node);
        node = node._next;
    }
    // console.log(JSON.stringify(res));
    console.log(res);
}

let lRUCache = new LRUCache(2);
lRUCache.put(1, 1); //                                                 缓存是 {1=1}
lRUCache.put(2, 2); //                                                 缓存是 {2=2, 1=1}
console.log("lRUCache.get(1)", lRUCache.get(1));    // 返回 1          缓存是 {1=1, 2=2}
lRUCache.put(3, 3); // 该操作会使得关键字 2 作废，                         缓存是 {3=3, 1=1}
console.log("lRUCache.get(2)", lRUCache.get(2));    // 返回 -1 (未找到) 缓存是 {3=3, 1=1}
lRUCache.put(4, 4); // 该操作会使得关键字 1 作废，                         缓存是 {4=4, 3=3}
console.log("lRUCache.get(1)", lRUCache.get(1));    // 返回 -1 (未找到) 缓存是 {4=4, 3=3}
console.log("lRUCache.get(3)", lRUCache.get(3));    // 返回 3           缓存是 {3=3, 4=4}
console.log("lRUCache.get(4)", lRUCache.get(4));    // 返回 4           缓存是 {4=4, 3=3}

