<script>
import {h} from "vue";
export default {
    name: "vNode-loader",
    props: {
        vNode: {
            type: Object,
            default() {
                return {}
            }
        }
    },
    setup(props){
        return ()=> h(props.vNode);
    }
}
</script>


<style lang="scss">
</style>
