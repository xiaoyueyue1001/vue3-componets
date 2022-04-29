type WatchMapItem = {
    resolve: Function,
    reject: Function,
}
type WatchListMap = {
    [cacheId: string]: WatchMapItem[]
}

class Watcher {
    watchMap: WatchListMap = {};

    add({ cacheId, resolve, reject }: { cacheId: string, resolve: Function, reject: Function }) {
        // 发布订阅 第一次请求结果返回之前，后续的同cacheId请求加入等待队列
        if (this.watchMap[cacheId]) {
            this.watchMap[cacheId].push({ resolve, reject })
        } else {
            this.watchMap[cacheId] = [{ resolve, reject }]
        }
    }
    success({ cacheId, res }: { cacheId: string, res: any }) {
        // 请求成功，执行等待队列的resolve，并清空队列
        if (this.watchMap[cacheId] && this.watchMap[cacheId].length > 0) {
            this.watchMap[cacheId].forEach(item => {
                item.resolve(res)
            })
            delete this.watchMap[cacheId]
        }
    }
    fail({ cacheId, err }: { cacheId: string, err: any }) {
        // 请求失败，执行等待队列的reject，并清空队列
        if (this.watchMap[cacheId] && this.watchMap[cacheId].length > 0) {
            this.watchMap[cacheId].forEach(item => {
                item.reject(err)
            })
            delete this.watchMap[cacheId]
        }
    }
}


enum Status {
    Waitting,
    Success,
    Faile
}
type CacheItemIdType = string
type CacheItemType = {
    status: Status,
    res: any,
    err: any,
}
class CacheSpace {
    name: String = ""; // 缓存空间名称（id）
    // 缓存空间，每一个接口都会使用一个缓存空间，name则为空间id，每一个接口只在自己所属的缓存空间查询缓存。
    cacheMap = new Map<CacheItemIdType, CacheItemType>(); // 存储缓存映射，cacheId=>result (入参=>出参)，适用于纯函数，或者实时性要求不高的接口。
    watcher = new Watcher(); // 订阅者，同一cacheId多次同时并发时，只会实际请求第一次，剩余的加入监听队列，等待结果。
    constructor(name: string) {
        this.name = name;
    }
}

/**
 * maxSize:最大缓存容量
 * map:缓存映射
 * 当新进缓存超过最大容量时，会删除最久不常使用的缓存 item 数据
 */
export class LRUCache<CacheType> {
    maxSize: number = 3;
    map = new Map<string, CacheType>();
    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    get(key: string) {
        let val = this.map.get(key)
        if (!val) {
            return null
        } else {
            this.map.delete(key)
            this.map.set(key, val)
            return val
        }
    }
    set(key: string, value: any) {
        if (this.map.has(key)) {
            this.map.delete(key)
        }
        this.map.set(key, value)
        if (this.map.size > this.maxSize) {
            let keys = this.map.keys()
            let oldKey = keys.next().value
            this.map.delete(oldKey)
        }
    };
}

let cacheSpaceMap: LRUCache<CacheSpace> = new LRUCache(100); // 全局缓存空间列表，每一个元素就是一个CacheSpace，可根据实际使用情况，将cacheSpaceList放在不同的地方，比如localStorage做永存储。


/**
 * promiseCreateFn : promise生成函数，之所以不使用promise是因为，promise一旦创建则无法停止，所以这里使用promiseCreateFn，可以通过缓存来决定是否执行promiseCreateFn，还是从缓存获取result
 * options配置项：{
 *  isFromCache:是否从缓存取值，默认true
 *  params:promiseCreateFn的入参，一般是接口调用的函数，决定cacheId
 *  cacheId:本次缓存记录的id（非CacheSpace的缓存空间id，而是缓存空间里某一条缓存记录的id），默认为JSON.stringify(params),实际意义则为以接口入参为cacheId，
 *  cacheSpaceId：缓存空间id，决定从cacheSpaceList里的哪一个CacheSpace去获取缓存
 *  函数注释中的step，为并发同cacheId请求的情况
 * }
 */
type cahcePromiseOptionsType = {
    isFromCache?:boolean,
    params?:any,
    cacheId?:string,
    cacheSpaceId?:string,
    isCacheFail?:boolean
}
 function cahcePromise(promiseCreateFn: (param: any) => Promise<any>, options:cahcePromiseOptionsType ={}) {
    let isFromCache = options.isFromCache || true;
    let params = options.params || {};
    let cacheId = options.cacheId || "";
    let cacheSpaceId = options.cacheSpaceId || "";
    let isCacheFail = options.isCacheFail || false;

    let cacheSpace: CacheSpace
    let tempCache = cacheSpaceMap.get(cacheSpaceId)
    if (tempCache) {
        cacheSpace = tempCache
    } else {
        cacheSpace = new CacheSpace(cacheSpaceId); // 初始化缓存空间
        cacheSpaceMap.set(cacheSpaceId, cacheSpace); // 将空缓存空间加入cacheSpaceList队列
    }

    // 获取cacheId，无数据则使用params的字符串化。（promiseCreateFn函数入参）
    cacheId = cacheId || JSON.stringify(params);

    // 返回Promise对象
    return new Promise<any>((resolve, reject) => {
        // （step 2）从缓存中获取（cacheId存在于CacheSpace，并且配置型isFromCache为true）
        let cache = cacheSpace.cacheMap.get(cacheId);
        if (cache && isFromCache) {
            // 根绝缓存的状态，执行不同的操作
            switch (cache.status) {
                case Status.Success:
                    resolve(cache.res)
                    break;
                case Status.Waitting:
                    // 并发请求时，后续请求，不调用promiseCreateFn，而是等待前次的结果
                    cacheSpace.watcher.add({ cacheId, resolve, reject })
                    break;
                case Status.Faile:
                    reject(cache.err)
                    break;
                default:
                    break;
            }
            return
        }

        // （step 1）无缓存数据时，记录当次的记录（默认为waitting状态），并执行promiseCreateFn，等待promise的结果再标记状态为success/fail
        cacheSpace.cacheMap.set(cacheId, { status: Status.Waitting, res: null, err: null });
        promiseCreateFn(params).then(res => {
            // （step 3）promise成功，记录进缓存并事件派发
            cacheSpace.cacheMap.set(cacheId, { status: Status.Success, res, err: null });
            // 事件派发
            cacheSpace.watcher.success({ cacheId, res });
            resolve(res)
        }).catch(err => {
            // （step 3）promise失败，记录进缓存（也可以删除缓存，这样fail则不会记录，下次会继续请求数据，记录/删除视业务情况而定），并事件派发
            if (isCacheFail) {
                cacheSpace.cacheMap.set(cacheId, { status: Status.Faile, res: null, err });  // 记录fail缓存（下次请求，不发送实际请求，直接返回fail）
            } else {
                cacheSpace.cacheMap.delete(cacheId); // 不记录fail缓存（下次请求会重新调用请求）
            }
            // 事件派发
            cacheSpace.watcher.fail({ cacheId, err });
            reject(err)
        })
    })
}

function promiseFn1(params: any) {
    return new Promise<any>((resolve, reject) => {
        setTimeout(()=>{
            console.log("真正执行接口1")
            resolve(params)
        },200)
    })
}
function promiseFn2(params: any) {
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            console.log("真正执行接口2")
            resolve(params)
        },200)
    })
}
function promiseFn3(params: any) {
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            console.log("真正执行接口3")
            resolve(params)
        },200)
    })
}

let cacheP1 = (params?:any) => cahcePromise(promiseFn1, {params, cacheSpaceId: "p1" }).then(res => {
    console.log("res p1:", res)
})
let cacheP2 = (params?:any) => cahcePromise(promiseFn2, {params, cacheSpaceId: "p2" }).then(res => {
    console.log("res p2:", res)
})
let cacheP3 = (params?:any) => cahcePromise(promiseFn3, {params, cacheSpaceId: "p3" }).then(res => {
    console.log("res p3:", res)
})

cacheP1("a");
cacheP1("a");
cacheP2("b");
cacheP2("bb");
cacheP3("c");
cacheP3("c");
cacheP1("a");