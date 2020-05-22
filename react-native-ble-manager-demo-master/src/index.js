import React, { Component } from 'react'
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList,
    Button,
    Platform,
    TextInput,
    Alert,
    SafeAreaView,
    Modal,
    StatusBar,
} from 'react-native'
import BleModule from './BleModule';
import treaty from'./utils/treaty.js';
import codec from './utils/codec.js'
import bleParams from './utils/bleParams.js'
import BleManager from "react-native-ble-manager";


//确保全局只有一个BleManager实例，BleModule类保存着蓝牙的连接信息
global.BluetoothManager = new BleModule();

export default class App extends Component {

    // onPressButton() {
    //     Alert.alert('You tapped the button!');
    //     this.getVersion();
    // }
    //     // 返回事件
    onPressButton = () => {
        console.log("3");
        this.getVersion();
    }


    arrayBufferToBase64( buffer ) {
        let binary = '';
        let bytes = new Uint8Array( buffer );
        let len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
        }
        return window.btoa( binary );
    }

    //字符串转bytes
    stringToUtf8ByteArray(str){
        var out = [], p =0;
        for (var i =0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            if (c <128) {
                out[p++] = c;
            }else if (c <2048) {
                out[p++] = (c >>6) |192;
                out[p++] = (c &63) |128;
            }else if (((c &0xFC00) ==0xD800) && (i +1) < str.length &&
                ((str.charCodeAt(i +1) &0xFC00) ==0xDC00)) {
                c =0x10000 + ((c &0x03FF) <<10) + (str.charCodeAt(++i) &0x03FF);
                out[p++] = (c >>18) |240;
                out[p++] = ((c >>12) &63) |128;
                out[p++] = ((c >>6) &63) |128;
                out[p++] = (c &63) |128;
            }else {
                out[p++] = (c >>12) |224;
                out[p++] = ((c >>6) &63) |128;
                out[p++] = (c &63) |128;
            }
        }
        return out;
    }

    //bytes转换成字符串
    utf8ByteArrayToString(bytes) {
        var out = [], pos =0, c =0;
        while (pos < bytes.length) {
            var c1 = bytes[pos++];
            if (c1 <128) {
                out[c++] = String.fromCharCode(c1);
            }else if (c1 >191 && c1 <224) {
                var c2 = bytes[pos++];
                out[c++] = String.fromCharCode((c1 &31) <<6 | c2 &63);
            }else if (c1 >239 && c1 <365) {
                var c2 = bytes[pos++];
                var c3 = bytes[pos++];
                var c4 = bytes[pos++];
                var u = ((c1 &7) <<18 | (c2 &63) <<12 | (c3 &63) <<6 | c4 &63) -0x10000;
                out[c++] = String.fromCharCode(0xD800 + (u >>10));
                out[c++] = String.fromCharCode(0xDC00 + (u &1023));
            }else {
                var c2 = bytes[pos++];
                var c3 = bytes[pos++];
                out[c++] =String.fromCharCode((c1 &15) <<12 | (c2 &63) <<6 | c3 &63);
            }
        }
        return out.join('');
    }
    Bytes2Str(arr) {
        let str = "";
        for(let i=0; i<arr.length; i++)
        {
            let tmp = arr[i].toString(16);
            if(tmp.length === 1)
            {
                tmp = "0" + tmp;
            }
            str += tmp;
        }
        return str;
    }

    getVersion(){
        //console.log("1");
        let type = bleParams.SUBTYPE_GET_VERSION;
        let data = [];
        data = codec.utf8.encode("1234");
        //console.log("2");
        let buffer =  treaty.pottingData(type,1,data,data.length,false,false,true,0,true);
        //console.log("4");
        let array = new Uint8Array(buffer);
        // for(let i = 0; i < array.length; ++i){
        //     console.log(array[i])
        // }
        //console.log(buffer.toString());
        //console.log("5");
        let str = this.utf8ByteArrayToString(array);//转换字符串
        console.log(this.Bytes2Str(array));
        //const base64Str = buffer.toString('base64');
        BluetoothManager.write(this.Bytes2Str(array),0)
            .then(()=>{
                //console.log("6");
                this.bluetoothReceiveData = [];
                this.setState({
                    writeData:buffer.buffer,
                    text:'',
                })
            })
            .catch(err=>{
                this.alert('发送失败');
            })
    };

    constructor(props) {
        super(props);
        this.state={
            data: [],
            scaning:false,
            isConnected:false,
            text:'',
            writeData:'',
            receiveData:'',
            readData:'',
            isMonitoring:false
        }
        this.bluetoothReceiveData = [];  //蓝牙接收的数据缓存
        this.deviceMap = new Map();

    }

    componentDidMount(){
        BluetoothManager.start();  //蓝牙初始化
        this.updateStateListener = BluetoothManager.addListener('BleManagerDidUpdateState',this.handleUpdateState);
        this.stopScanListener = BluetoothManager.addListener('BleManagerStopScan',this.handleStopScan);
        this.discoverPeripheralListener = BluetoothManager.addListener('BleManagerDiscoverPeripheral',this.handleDiscoverPeripheral);
	    this.connectPeripheralListener = BluetoothManager.addListener('BleManagerConnectPeripheral',this.handleConnectPeripheral);
        this.disconnectPeripheralListener = BluetoothManager.addListener('BleManagerDisconnectPeripheral',this.handleDisconnectPeripheral);
        this.updateValueListener = BluetoothManager.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValue);
    }

    componentWillUnmount(){
        this.updateStateListener.remove();
        this.stopScanListener.remove();
        this.discoverPeripheralListener.remove();
        this.connectPeripheralListener.remove();
        this.disconnectPeripheralListener.remove();
        this.updateValueListener.remove();
        if(this.state.isConnected){
            BluetoothManager.disconnect();  //退出时断开蓝牙连接
        }
    }

    //蓝牙状态改变
    handleUpdateState=(args)=>{
        console.log('BleManagerDidUpdateStatea:', args);
        BluetoothManager.bluetoothState = args.state;
        if(args.state == 'on'){  //蓝牙打开时自动搜索
            this.scan();
        }
    }

     //扫描结束监听
    handleStopScan=()=>{
        console.log('BleManagerStopScan:','Scanning is stopped');
        this.setState({scaning:false});
    }

     //搜索到一个新设备监听
    handleDiscoverPeripheral=(data)=>{
        // console.log('BleManagerDiscoverPeripheral:', data);
        console.log(data.id,data.name);
        if (data.name==null){
            return
        }
        let id;  //蓝牙连接id
        let macAddress;  //蓝牙Mac地址
        if(Platform.OS == 'android'){
            macAddress = data.id;
            id = macAddress;
        }else{
            //ios连接时不需要用到Mac地址，但跨平台识别同一设备时需要Mac地址
            //如果广播携带有Mac地址，ios可通过广播0x18获取蓝牙Mac地址，
            macAddress = BluetoothManager.getMacAddressFromIOS(data);
            id = data.id;
        }
        this.deviceMap.set(data.id,data);  //使用Map类型保存搜索到的蓝牙设备，确保列表不显示重复的设备
        this.setState({data:[...this.deviceMap.values()]});
    }

    //蓝牙设备已连接
    handleConnectPeripheral=(args)=>{
        console.log('BleManagerConnectPeripheral:', args);
    }

    //蓝牙设备已断开连接
    handleDisconnectPeripheral=(args)=>{
        console.log('BleManagerDisconnectPeripheral:', args);
        let newData = [...this.deviceMap.values()]
        BluetoothManager.initUUID();  //断开连接后清空UUID
        this.setState({
            data:newData,
            isConnected:false,
            writeData:'',
            readData:'',
            receiveData:'',
            text:'',
        });
    }

     //接收到新数据
    handleUpdateValue=(data)=>{
        //ios接收到的是小写的16进制，android接收的是大写的16进制，统一转化为大写16进制
        let value = data.value.toUpperCase();
        this.bluetoothReceiveData.push(value);
        console.log('BluetoothUpdateValue', value);
        this.setState({receiveData:this.bluetoothReceiveData.join('')})
    }

    connect(item){
        //当前蓝牙正在连接时不能打开另一个连接进程
        if(BluetoothManager.isConnecting){
            console.log('当前蓝牙正在连接时不能打开另一个连接进程');
            return;
        }
        if(this.state.scaning){  //当前正在扫描中，连接时关闭扫描
            BluetoothManager.stopScan();
            this.setState({scaning:false});
        }
        let newData = [...this.deviceMap.values()]
        newData[item.index].isConnecting = true;
        this.setState({data:newData});

        BluetoothManager.connect(item.item.id)
            .then(peripheralInfo=>{
                let newData = [...this.state.data];
                newData[item.index].isConnecting = false;
                //连接成功，列表只显示已连接的设备
                this.setState({
                    data:[item.item],
                    isConnected:true
                });
                BleManager.requestMTU(item.item.id, 100)
                    .then((mtu) => {
                        // Success code
                        console.log('MTU size changed to ' + mtu + ' bytes');
                    })
                    .catch((error) => {
                        // Failure code
                        console.log('MTU size changed eorror:'+error);
                    });

            })
            .catch(err=>{
                let newData = [...this.state.data];
                newData[item.index].isConnecting = false;
                this.setState({data:newData});
                this.alert('连接失败');
            })
    }

    disconnect(){
        this.setState({
            data:[...this.deviceMap.values()],
            isConnected:false
        });
        BluetoothManager.disconnect();
    }

    scan(){
        if(this.state.scaning){  //当前正在扫描中
            BluetoothManager.stopScan();
            this.setState({scaning:false});
        }
        if(BluetoothManager.bluetoothState == 'on'){
            BluetoothManager.scan()
                .then(()=>{
                    this.setState({ scaning:true });
                }).catch(err=>{

                })
        }else{
            BluetoothManager.checkState();
            if(Platform.OS == 'ios'){
                this.alert('请开启手机蓝牙');
            }else{
                Alert.alert('提示','请开启手机蓝牙',[
                    {
                        text:'取消',
                        onPress:()=>{ }
                    },
                    {
                        text:'打开',
                        onPress:()=>{ BluetoothManager.enableBluetooth() }
                    }
                ]);
            }

        }
    }


    alert(text){
        Alert.alert('提示',text,[{ text:'确定',onPress:()=>{ } }]);
    }

    write=(index)=>{
        if(this.state.text.length == 0){
            this.alert('请输入消息');
            return;
        }
        console.log(index)
        BluetoothManager.write(this.state.text,index)
            .then(()=>{
                this.bluetoothReceiveData = [];
                this.setState({
                    writeData:this.state.text,
                    text:'',
                })
            })
            .catch(err=>{
                this.alert('发送失败');
            })
    }

    writeWithoutResponse=(index)=>{
        if(this.state.text.length == 0){
            this.alert('请输入消息');
            return;
        }
        console.log(index)

        BluetoothManager.writeWithoutResponse(this.state.text,index)
            .then(()=>{
                this.bluetoothReceiveData = [];
                this.setState({
                    writeData:this.state.text,
                    text:'',
                })
            })
            .catch(err=>{
                this.alert('发送失败');
            })
    }

    read=(index)=>{
        BluetoothManager.read(index)
            .then(data=>{
                this.setState({readData:data});
            })
            .catch(err=>{
                this.alert('读取失败');
            })
    }

    notify=(index)=>{
        BluetoothManager.startNotification(index)
            .then(()=>{
                this.setState({isMonitoring:true});
                this.alert('开启成功');
            })
            .catch(err=>{
                this.setState({isMonitoring:false});
                this.alert('开启失败');
            })
    }

    renderItem=(item)=>{
        let data = item.item;
        return(
            <TouchableOpacity
                activeOpacity={0.7}
                disabled={this.state.isConnected?true:false}
                onPress={()=>{this.connect(item)}}
                style={styles.item}>

                <View style={{flexDirection:'row',}}>
                    <Text style={{color:'black'}}>{data.name?data.name:''}</Text>
                    <Text style={{marginLeft:50,color:"red"}}>{data.isConnecting?'连接中...':''}</Text>
                </View>
                <Text>{data.id}</Text>

            </TouchableOpacity>
        );
    }

    renderHeader=()=>{
        return(
            <View style={{marginTop:20}}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.buttonView,{marginHorizontal:10,height:40,alignItems:'center'}]}
                    onPress={this.state.isConnected?this.disconnect.bind(this):this.scan.bind(this)}>
                    <Text style={styles.buttonText}>{this.state.scaning?'正在搜索中':this.state.isConnected?'断开蓝牙':'搜索蓝牙'}</Text>
                </TouchableOpacity>

                <Text style={{marginLeft:10,marginTop:10}}>
                    {this.state.isConnected?'当前连接的设备':'可用设备'}
                </Text>
            </View>
        )
    }

    renderFooter=()=>{
        return(
            <View style={{marginBottom:30}}>
                {this.state.isConnected?
                    <View>
                    {this.renderWriteView('写数据(write)：','发送',BluetoothManager.writeWithResponseCharacteristicUUID,this.write,this.state.writeData)}
                    {this.renderWriteView('写数据(writeWithoutResponse)：','发送',BluetoothManager.writeWithoutResponseCharacteristicUUID,this.writeWithoutResponse,this.state.writeData)}
                    {this.renderReceiveView('读取的数据：','读取',BluetoothManager.readCharacteristicUUID,this.read,this.state.readData)}
                    {this.renderReceiveView('通知监听接收的数据：'+`${this.state.isMonitoring?'监听已开启':'监听未开启'}`,'开启通知',BluetoothManager.nofityCharacteristicUUID,this.notify,this.state.receiveData)}

                    </View>
                    : <View></View>
                }
            </View>
        )
    }

    renderReceiveView=(label,buttonText,characteristics,onPress,state)=>{
        if(characteristics.length == 0){
            return;
        }
        return(
            <View style={{marginHorizontal:10,marginTop:30}}>
                <Text style={{color:'black',marginTop:5}}>{label}</Text>
                <Text style={styles.content}>
                    {state}
                </Text>
                {characteristics.map((item,index)=>{
                    return(
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.buttonView}
                            onPress={()=>{onPress(index)}}
                            key={index}>
                            <Text style={styles.buttonText}>{buttonText} ({item})</Text>
                        </TouchableOpacity>
                    )
                })}
            </View>
        )
    }

    renderWriteView=(label,buttonText,characteristics,onPress,state)=>{
        if(characteristics.length == 0){
            return;
        }
        return(
            <View style={{marginHorizontal:10,marginTop:30}} behavior='padding'>
                <Text style={{color:'black'}}>{label}</Text>
                    <Text style={styles.content}>
                        {this.state.writeData}
                    </Text>
                    {characteristics.map((item,index)=>{
                        return(
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                style={styles.buttonView}
                                onPress={()=>{onPress(index)}}>
                                <Text style={styles.buttonText}>{buttonText} ({item})</Text>
                            </TouchableOpacity>
                        )
                    })}
                    <TextInput
                        style={[styles.textInput]}
                        value={this.state.text}
                        placeholder='请输入消息'
                        onChangeText={(text)=>{
                            this.setState({text:text});
                        }}
                    />
            </View>
        )
    }

    render () {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#15127e" />
                <View style={styles.container}>
                    <View style={styles.buttonContainer}>
                        <Button
                            onPress={this.onPressButton}
                            title="点我联网"
                            color="#841584"
                        />
                        <Button
                            onPress={this.onPressButton}
                            title="查看状态"

                        />
                        <Button
                            onPress={this.onPressButton}
                            title="断开wifi"
                            color="#841584"
                        />
                    </View>
                    {/*<View style={styles.buttonContainer}>*/}

                    {/*</View>*/}



                    <FlatList
                        renderItem={this.renderItem}
                        ListHeaderComponent={this.renderHeader}
                        ListFooterComponent={this.renderFooter}
                        keyExtractor={item=>item.id}
                        data={this.state.data}
                        extraData={[this.state.isConnected,this.state.text,this.state.receiveData,this.state.readData,this.state.writeData,this.state.isMonitoring,this.state.scaning]}
                        keyboardShouldPersistTaps='handled'
                    />
                </View>
            </SafeAreaView>

        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:'white',
        marginTop:Platform.OS === 'ios'?20:0,
    },
    item:{
        flexDirection:'column',
        borderColor:'rgb(235,235,235)',
        borderStyle:'solid',
        borderBottomWidth:StyleSheet.hairlineWidth,
        paddingLeft:10,
        paddingVertical:8,
    },
    buttonView:{
        height:30,
        backgroundColor:'rgb(33, 150, 243)',
        paddingHorizontal:10,
        borderRadius:5,
        justifyContent:"center",
        alignItems:'center',
        alignItems:'flex-start',
        marginTop:10
    },
    buttonText:{
        color:"white",
        fontSize:12,
    },
    content:{
        marginTop:5,
        marginBottom:15,
    },
    textInput:{
		paddingLeft:5,
		paddingRight:5,
		backgroundColor:'white',
		height:50,
        fontSize:16,
        flex:1,
	},
    buttonContainer: {
        margin: 20
    },
})


