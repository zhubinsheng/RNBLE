import React, { Component } from 'react'
import {
    Animated,
    View,
    TextInput,
    Image,
    TouchableOpacity,
    StyleSheet,
    Text,
    Button,
    ImageBackground,
    Modal,
    FlatList,
    Platform,
    ScrollView,
    TouchableHighlight} from 'react-native';

export default class UISelectModal extends Component{
    constructor(props){
        super(props);
        this.state={
            searchData:null,
            show:false,
            fadeAnim: new Animated.Value(100),
            checkedState:{}, //记录选项选中状态
            data:this.props.data || [],
        }
    }
    componentDidMount(){
        this.initDefaultChecked(this.props.defaultChecked);
    }
    /**初始化默认选中 */
    isInitDefaultChecked=false;
    initDefaultChecked=(defaultChecked,target=0)=>{
        if(this.isInitDefaultChecked){
            return false;
        }

        let type = typeof(defaultChecked);
        if(type === "string" || type === "number"){
            this.setCheckedState(defaultChecked,true);
        }else if(defaultChecked instanceof Array){
            for(let i=0;i<defaultChecked.length;i++){
                let qwe = defaultChecked[i];
                if(!this.initDefaultChecked(qwe,1))return;
            }
        }else if(defaultChecked instanceof Object)
        {
            let data = this.state.data || this.props.data;
            if(!(data && data.length)){
                return false;
            }
            let {id,index} = defaultChecked;
            if(id != undefined){
                this.setCheckedState(id,true);
            }else if(index != undefined && typeof(index) === "number"){
                let ds = data[index];
                if(ds==undefined)return false;
                let iId = this.getItemID(ds);
                this.setCheckedState(iId,true);
            }
        }
        if(target==0){
            this.isInitDefaultChecked = true;
            this.updateCheckedState();
        }
        return true;
    }
    //常用样式
    static style={
        /**默认 */
        default:{
            backgroundColor:"white",
            borderColor:"#f7f7f7",
            borderWidth:1,
        },
        /**圆角 */
        borderRadius:{
            borderColor:"#979797",
            borderWidth:1,
            borderRadius:40,
        },
        /**底部线条 */
        bottomLine:{
            borderBottomColor:"#eeeeee",
            borderBottomWidth:1,
        }
    }

    static defaultProps = {
        dataKey:{id:"id",display:"display"},
        mult:false,
        search:false,
        title:"请选择",
        activeColor:'black',
        rootStyle:{},
        style:UISelectModal.style.bottomLine
    }

    //更改状态相关方法
    getCheckedStateConfig=()=>{
        return this.state.checkedState;
    }
    setCheckedState=(key,state)=>{
        let c = this.getCheckedStateConfig();
        c[key] = state;
    }
    getCheckedState=(key=null)=>{
        let c = this.getCheckedStateConfig();
        if(key){
            return !!c[key];
        }
        let actives = [];
        for(let key in c){
            let ac = !!c[key];
            if(ac)actives.push(key);
        }
        return actives;
    }
    clearAllCheckedState=()=>{
        this.state.checkedState = {};
    }
    switchCheckedState=(key)=>{
        let old = this.getCheckedState(key);
        let active = !old;
        this.setCheckedState(key,active);
        return active;
    }
    updateCheckedState=()=>{
        this.setState({checkedState:this.getCheckedStateConfig()});
    }
    getActiveItem=()=>{
        let cs = this.getCheckedState();
        let ds = this.state.data;
        let activeItems = [];

        for(let i=0;i<cs.length;i++){
            let activeID = cs[i];
            let activeIndex = ds.findIndex((item)=>this.getItemID(item) == activeID);
            if(activeIndex<=-1)continue;
            let activeItem = ds[activeIndex];
            activeItems.push(activeItem);
        }
        return activeItems;
    }
    getItemID=(item)=>{
        const key = this.props.dataKey||{};
        return item[key["id"]];
    }
    getItemDiaplay=(item)=>{
        const key = this.props.dataKey||{};
        return item[key["display"]];
    }

    getValue(){
        let activeItem = this.getActiveItem();
        let mult = this.props.mult;
        if(!mult){
            return activeItem[0];
        }
        return activeItem;
    }

    componentWillReceiveProps(nextProps){
        let nextData = nextProps.data;
        this.setState(({data})=>{
            return {data:nextData};
        },()=>{
            this.initDefaultChecked(nextProps.defaultChecked);
        });
    }
    switch=(state = null)=>{
        let isShow = !this.state.show;
        this.setState({show:isShow,searchData:null},()=>{
            this.state.fadeAnim.setValue(0);
            this.animated = Animated.spring(
                this.state.fadeAnim,
                {
                    toValue:100,
                    duration:300,
                }
            ).start();
        })
    }
    componentWillUnmount(){
        if(this.state.show){
            this.setState({show:false});
        }
    }

    getTitleDisplay(){

        let activeItems = this.getActiveItem();
        let names = activeItems.map((item)=>this.getItemDiaplay(item));
        return names.length>0?
            <Text numberOfLines={1} ellipsizeMode="tail" style={{color:"#1f1f1f"}}>
                {names.join("，")}
            </Text>:
            <Text numberOfLines={1} ellipsizeMode="tail" style={{color:'#717171'}}>
                {this.props.title}
            </Text>

    }
    search(e) {
        if(!e){
            this.setState({searchData:null});
            return;
        };
        let list = this.state.data;
        const key = this.props.dataKey||{};
        let newList = list.filter((item)=>{
            return this.getItemDiaplay(item).indexOf(e)>-1;
        });
        this.setState({searchData:newList});
    }

    checkItem=(item)=>{
        let mult = this.props.mult;

        let id = this.getItemID(item);
        let active = this.getCheckedState(id);
        let nextActive = !active;

        if(nextActive){
            let checkedStates =  this.getCheckedState();
            if(checkedStates && checkedStates.length){
                if(typeof mult === "number"){
                    if(checkedStates.length>=mult){
                        return alert("最多选择"+mult+"项");
                    }
                }else if(!mult){
                    this.clearAllCheckedState();
                }
            }
        }

        this.setCheckedState(id,nextActive);
        this.updateCheckedState();


        let onChange = this.props.onChange;
        if(typeof(onChange) === "function"){
            onChange(item,this.getActiveItem());
        }

        //不是多选选择完马上关闭
        if(!mult)this.switch();
    }
    render() {
        const spinOpacity = this.state.fadeAnim.interpolate({
            inputRange: [0, 100],
            outputRange: [0,1]
        });
        const spinRotate = this.state.fadeAnim.interpolate({
            inputRange: [0, 100],
            outputRange: this.state.show?["0deg","180deg"]:['180deg', '0deg']
        });
        const spinTop = this.state.fadeAnim.interpolate({
            inputRange: [0, 100],
            outputRange:[140,0]
        });
        const key = this.props.dataKey||{};
        let dataList = this.state.searchData || this.state.data || [];
        let isSearch = this.props.search;
        let RenderItem = this.props.RenderItem;

        let activeColor = this.props.activeColor;
        return (
            <View ref={"root"} style={{flex:1,...this.props.rootStyle}}>
                <TouchableOpacity onPress={this.switch} style={{
                    height:40,
                    flex:1,
                    justifyContent:"center",
                    alignItems:"center",
                    flexDirection:"row",
                    paddingLeft:10,
                    paddingRight:10,
                    ...this.props.style
                }}>
                    <View style={{flex:1,justifyContent:"center"}}>
                        { this.getTitleDisplay()}
                    </View>
                    <Animated.View
                        style={{
                            width: 30,
                            height: 30,
                            alignItems:"center",
                            justifyContent:"center",
                            transform: [{rotate: spinRotate}]
                        }}
                    >
                        <Image src={require('./image/bottom.png')} width={16} />
                    </Animated.View>
                </TouchableOpacity>

                {
                    (this.state.show) &&
                    <Modal animationType={"fade"} onRequestClose={this.switch} transparent={true}>
                        <TouchableHighlight style={{
                            width:"100%",
                            height:"100%",
                            backgroundColor:"rgba(0,0,0,0.1)",
                            alignItems: 'center',
                            justifyContent:"center"
                        }} underlayColor={"rgba(0,0,0,0.2)"} onPress={this.switch}>

                            <Animated.View style={{
                                opacity:spinOpacity,
                                maxWidth:500,
                                width:"85%",
                                minWidth:100,
                                minHeight:"30%",
                                zIndex:50000,
                                backgroundColor:"rgba(255,255,255,0.94)",
                                borderRadius:6,
                                overflow:"hidden",
                                padding:15,
                                marginTop: spinTop,
                                // alignItems: 'center',
                            }}>
                                <Text numberOfLines={1} style={{color:"#333333",fontSize:18,width:"100%",textAlign:"center"}}>
                                    {this.props.title}
                                </Text>

                                {
                                    dataList.length<=0?
                                        <Text style={{textAlign: 'center',margin:5}}>
                                            {(this.state.searchData && this.state.searchData.length<1)?"没有搜索到数据":"暂无数据"}
                                        </Text>:
                                        <ScrollView style={{
                                            maxHeight:(MH/1.8),
                                            margin:5,
                                        }}>

                                            <View style={{
                                                flexDirection:"row",
                                                flexWrap:"wrap",
                                                width:"100%",
                                                alignItems: 'center',
                                                justifyContent:"center"
                                            }}>
                                                {
                                                    dataList.map((item,index)=>{
                                                        let id = this.getItemID(item);
                                                        let display = this.getItemDiaplay(item);
                                                        let active = this.getCheckedState(id);
                                                        return(
                                                            typeof(RenderItem) === "function"?
                                                                <TouchableOpacity key={id+index} onPress={()=>this.checkItem(item)}>
                                                                    {
                                                                        RenderItem(item,active)
                                                                    }
                                                                </TouchableOpacity>
                                                                :
                                                                <TouchableOpacity key={id+index} style={{width:"100%"}} onPress={()=>this.checkItem(item)}>
                                                                    <View style={{
                                                                        alignItems:"center",
                                                                        flexDirection:"row",
                                                                        width:"100%",
                                                                        height:40,
                                                                    }}>
                                                                        <View style={{width:15,height:15,marginRight:5,borderRadius:15,backgroundColor:active?activeColor:"#e0e0e0"}}>
                                                                        </View>
                                                                        {
                                                                            <Text style={{color:active?activeColor:"#404141",fontSize: 16,}}>
                                                                                {display}
                                                                            </Text>
                                                                        }
                                                                    </View>
                                                                </TouchableOpacity>
                                                        );
                                                    })
                                                }
                                            </View>

                                        </ScrollView>
                                }

                                {
                                    (dataList.length>5 && isSearch) &&
                                    <View style={{width:"100%"}}>
                                        <TextInput multiline={false}
                                                   underlineColorAndroid="transparent"
                                                   style={{width:"100%",textAlign: 'center', padding: 0, fontSize: 10, color: '#999999',height:30,backgroundColor:"#efefef"}}
                                                   placeholder={"搜索"}
                                                   onChangeText={(e) =>this.search(e)}
                                        />
                                    </View>
                                }
                            </Animated.View>



                        </TouchableHighlight>


                    </Modal>
                }
            </View>
        )
    }
}
