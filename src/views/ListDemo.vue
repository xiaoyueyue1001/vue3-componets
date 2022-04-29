<template>
    <slist :finished="finished" @onload="onload" @refresh="refresh">
        <div class="list-wrap">
            <div class="list-item-wrap" v-for="item in list" :key="item.id">{{ item.label }}</div>
        </div>
    </slist>
</template>

<script>
function getList({ pageNumber, pageSize }) {
    let total = 20;
    let start = (pageNumber - 1) * pageSize + 1;
    let end = pageNumber * pageSize;

    let list = [];
    while (start <= end) {
        list.push({ id: start, label: start });
        start++
    }
    return {
        total,
        list
    }
}
import { reactive, toRefs, onMounted } from "vue"
import slist from "@/components/List.vue"
export default {
    components: { slist },
    setup() {
        let pageSize = 1;
        let pageNumber = 1;
        let listId = 0;
        const data = reactive({
            list: [],
            finished: false,
        });
        const methods = {
            onload(done) {
                console.log("onload");
                let currentListId = listId;
                let res = getList({ pageSize, pageNumber });
                setTimeout(() => {
                    if(currentListId !== listId){
                        return false
                    }
                    data.list.push(...res.list)
                    if (res.total <= pageNumber * pageSize) {
                        data.finished = true;
                    }
                    pageNumber++;
                    done();
                }, 300)
            },
            refresh(done) {
                console.log("refresh");
                data.finished = false;
                pageSize = 1;
                pageNumber = 1;
                let res = getList({ pageSize, pageNumber });
                setTimeout(() => {
                    listId = Math.random();
                    data.list = res.list
                    if (res.total <= pageNumber * pageSize) {
                        data.finished = true;
                    }
                    pageNumber++;
                    done();
                }, 300)
            }
        };
        return {
            ...toRefs(data),
            ...methods,
        };
    },
};
</script>

<style lang="scss" scoped>
.list-wrap {
    >.list-item-wrap {
        height: 1rem;
        line-height: 1rem;
        border-bottom: 1px solid #ccc;
    }
}
</style>
