<template>
    <slot></slot>
</template>


<script>
export default {
    name: "my-tab",
    props: {
        name: {
            type: String,
            default: ""
        },
        title: {
            type: String,
            default: ""
        }
    },
    setup(props,content){
        content.emit("mounted",props.name);
    }
}
</script>


<style lang="scss">
</style>