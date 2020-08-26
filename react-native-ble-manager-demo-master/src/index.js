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
    SectionList, 
    ToastAndroid,
    ActivityIndicator,
    DeviceEventEmitter
} from 'react-native'
import BleModule from './BleModule';
import treaty from'./utils/treaty.js';
import codec from './utils/codec.js'
import bleParams from './utils/bleParams.js'
import BleManager from "react-native-ble-manager";
import UISelectModal from './selectView'
import Selectmore from './componentModal/selectMore'
import {checkPermission, permission, requestMultiplePermission} from "./utils/permissionUtil";
import { RRCLoading } from 'react-native-overlayer';

// import PopupDialog, { SlideAnimation } from 'react-native-popup-dialog';
//确保全局只有一个BleManager实例，BleModule类保存着蓝牙的连接信息
global.BluetoothManager = new BleModule();
//
// const slideAnimation = new SlideAnimation({
//     slideFrom: 'bottom',
// });

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state={
            stmp: 1,
            getDating:false,
            seq: 0,
            password:null,
            data: [],
            scaning:false,
            isConnected:false,
            text:'',
            writeData:'',
            receiveData:'',
            readData:'',
            isMonitoring:false,
            animating: false,
            displayShuoming:false,
        }
        this.bluetoothReceiveData = [];  //蓝牙接收的数据缓存
        this.deviceMap = new Map();

    }
    componentWillMount() {
        console.log('componentWillMount');
        //监听消息和Android端保持一致
        this.subscription = DeviceEventEmitter.addListener('Android2RN',this.handleMessage);
    }
    componentWillUnmount() {
        this.subscription.remove()
    }
    handleMessage(message){
        console.log(message);
    }
    //断开wifi
    disconnectSta = () => {
        let that = this;
        let type = bleParams.SUBTYPE_DISCONNECT_WIFI;
        let data = codec.utf8.encode("1234");
        let buffer =  treaty.pottingData(type,1,data,data.length,false,false,true,0,true);
        let array = new Uint8Array(buffer);
        // let str = this.utf8ByteArrayToString(array);//转换字符串
        BluetoothManager.write(this.Bytes2Str(array),0)
            .then(()=>{
                this.bluetoothReceiveData = [];
                this.setState({
                    writeData:buffer.buffer,
                    text:'',
                })
                setTimeout(function(){
                    BluetoothManager.readIS(4)
                        .then(data=>{
                            console.log("读取成功:")
                            console.log(data)
                            ToastAndroid.show("发送断开指令成功", ToastAndroid.SHORT);
                            setTimeout(function () {
                                that.getWifiStatus()
                            },500)
                        })
                        .catch(err=>{
                            that.alert('读取失败');
                        })
                },10)
            })
            .catch(err=>{
                this.alert('发送失败');
            })
    }
    getWifiStatus= () =>{
        let that = this;
        let type = bleParams.SUBTYPE_GET_WIFI_STATUS;
        let data = [];
        console.log("getWifiStatus: start")
        data = codec.utf8.encode("1234");
        let buffer =  treaty.pottingData(type,1,data,data.length,false,false,true,0,true);
        let array = new Uint8Array(buffer);
        BluetoothManager.write(this.Bytes2Str(array),0)
            .then(()=>{
                console.log("读取成功1:")
                this.seq++
                console.log("读取成功2:")
                setTimeout(function(){
                    console.log("读取成功3:")
                    BluetoothManager.read(4)
                        .then(data=>{
                            console.log("读取成功回调")
                            console.log(data)
                            let wifiStatusModel = JSON.parse(data);

                            if (wifiStatusModel.state===bleParams.WIFI_STATE_ENUM_LIST.WIFI_STATE_IDLE) {
                                that.alert("wifi当前状态断开");
                            } else if(wifiStatusModel.state===bleParams.WIFI_STATE_ENUM_LIST.WIFI_STATE_CONNECTING) {
                                that.alert("wifi正在努力连接中");
                                setTimeout(() => {
                                    that.getWifiStatus()
                                }, 2000);
                            }else if(wifiStatusModel.state===bleParams.WIFI_STATE_ENUM_LIST.WIFI_STATE_CONNECTED_IP_GETTING) {
                                that.alert("已连接，正在获取ip地址中");
                                setTimeout(() => {
                                    that.getWifiStatus()
                                }, 2000);
                            }else if(wifiStatusModel.state===bleParams.WIFI_STATE_ENUM_LIST.WIFI_STATE_CONNECTED_IP_GOT){
                                // that.alert("wifi连接成功");
                                Alert.alert('wifi连接成功','ip:'+wifiStatusModel.ip+'\n'+'gw:'+wifiStatusModel.gw+'\n'+ 'mask:'+wifiStatusModel.mask,[{ text:'确定',onPress:()=>{ } }]);
                            }else if (wifiStatusModel.state===bleParams.WIFI_STATE_ENUM_LIST.WIFI_STATE_PSK_ERROR){
                                that.alert("wifi连接密码错误");
                            }else if (wifiStatusModel.state===bleParams.WIFI_STATE_ENUM_LIST.WIFI_STATE_NO_AP_FOUND){
                                that.alert("未找到该ap");
                            }else {
                                that.alert("其他原因");
                            }

                        })
                        .catch(err=>{
                            ToastAndroid.show("读取失败,正在重试中", ToastAndroid.SHORT);
                            setTimeout(() => {
                                that.getWifiStatus()
                            }, 300);
                        })
                },20)

            })
            .catch(err=>{
                this.alert('发送失败');
            })
    }
    sendPassword= () =>{
        console.log(this.state.password)
        console.log(this.wifiName)
        this.setState({
            displayShuoming: false
        });
        this.showLoading()
        this.send2passwordImpl(null);
    }
    send2passwordImpl(bytes){
        let that = this
        let type
        console.log(this.state.stmp)

        switch(this.state.stmp){
            case 1:
                type = bleParams.SUBTYPE_STA_WIFI_SSID;
                this.state.stmp++;
                this.sen8kDate(this.wifiName,type,this.send2passwordImpl);
                break;
            case 2:
                type = bleParams.SUBTYPE_STA_WIFI_PASSWORD;
                this.state.stmp++;
                this.sen8kDate(this.state.password,type,this.send2passwordImpl);
                break;
            case 3:
                type = bleParams.SUBTYPE_CONNECT_WIFI;
                this.state.stmp = 1;
                let data = [];
                data = codec.utf8.encode("9988");
                let buffer =  treaty.pottingData(type,this.state.seq,data,data.length,false,false,true,0,true);
                console.log(buffer);
                let array = new Uint8Array(buffer);
                BluetoothManager.write(this.Bytes2Str(array),0)
                    .then(()=>{
                        console.log("读取成功1:")
                        this.seq++
                        console.log("读取成功2:")
                        setTimeout(function(){
                            RRCLoading.hide();
                            console.log("读取成功3:")
                            BluetoothManager.readIS(4)
                                .then(data=>{
                                    console.log(data)
                                    that.getWifiStatus()
                                    // that.send2passwordImpl(data)
                                })
                                .catch(err=>{
                                    // that.alert('读取失败');
                                })
                        },1000)

                    })
                    .catch(err=>{
                        // that.alert('发送失败');
                    })
                break;
        }
    }
    sen8kDate(e,type,callback) {
        let that = this;
        let data = [];
        data = codec.utf8.encode(e);
        console.log(data);
        let everyDateLength = 100 - bleParams.everyDateLength;
        let firstDateLength = 100 - bleParams.firstDateLength;

        if (data.length>100) {
            //下面发送第一次数据
            let buffer =  treaty.pottingData(type,data.slice(0,firstDateLength),data.length,true,true,true,0,false);
            console.log(buffer);
            // this.writeToBLE(buffer);
            data = data.slice(firstDateLength);
            let result = this.sliceArr(data, size);
            console.log(result);
            //上面直接将数据分组 下面循环处理剩下数据和发送
            for (let i = 0; i < result.length; i++) {
                if (i===result.length) {
                    buffer = treaty.pottingData(type,result[i],everyDateLength,true,true,false, i+1,true);
                }else{
                    buffer = treaty.pottingData(type,result[i],everyDateLength,true,true,false, i+1,false);
                }
                console.log(buffer);
                let array = new Uint8Array(buffer);
                BluetoothManager.write(this.Bytes2Str(array),0)
                    .then(()=>{
                        console.log("读取成功1:")
                        this.seq++
                        console.log("读取成功2:")
                        setTimeout(function(){
                            console.log("读取成功3:")
                            BluetoothManager.read(4)
                                .then(data=>{
                                    console.log(data)
                                    that.send2passwordImpl(data)
                                })
                                .catch(err=>{
                                    that.alert('读取失败');
                                })
                        },2)

                    })
                    .catch(err=>{
                        that.alert('发送失败');
                    })
            }
        }else{
            let buffer;
            if (data.length<firstDateLength) {
                buffer = treaty.pottingData(type,this.state.seq,data,data.length,false,true,true,0,true);
            } else {
                //暂时未处理
                //buffer = treaty.pottingData(type,this.data.seq,data.slice(0,firstDateLength),firstDateLength,false,true,true,0,true);
            }
            console.log(buffer);
            // this.writeToBLE(buffer,1,callback);
            let array = new Uint8Array(buffer);
            BluetoothManager.write(this.Bytes2Str(array),0)
                .then(()=>{
                    console.log("读取成功1:")
                    this.seq++
                    console.log("读取成功2:")
                    setTimeout(function(){
                        console.log("读取成功3:")
                        BluetoothManager.readIS(4)
                            .then(data=>{
                                console.log(data)
                                that.send2passwordImpl(null)
                            })
                            .catch(err=>{
                                that.alert('读取失败');
                            })
                    },2)

                })
                .catch(err=>{
                    that.alert('发送失败');
                })
        }
    }
    smartConfig = () => {
        let that = this;
        that.SelectData = [];
        let type = bleParams.SUBTYPE_GET_WIFI_LIST;
        let data = [];
        data = codec.utf8.encode("1234");
        let buffer =  treaty.pottingData(type,1,data,data.length,false,false,true,0,true);
        let array = new Uint8Array(buffer);
        BluetoothManager.write(this.Bytes2Str(array),0)
            .then(()=>{
                console.log("读取成功1:")
                this.seq++
                console.log("读取成功2:")
                setTimeout(function(){
                    console.log("读取成功3:")
                    BluetoothManager.readIS(4)
                        .then(data=>{
                            console.log(data)
                            that.showLoading()
                            setTimeout(function () {
                                that.getWIFILISTDate()
                            },3000)
                        })
                        .catch(err=>{
                            that.alert('读取失败');
                        })
                 },10)

            })
            .catch(err=>{
                this.alert('发送失败');
            })
    }
    getDateResults: '';
    getWIFILISTDate(){
        let that = this;
        console.log("getWIFILISTDate start:")
        let type = bleParams.SUBTYPE_GET_WIFI_EVERY_LIST;
        let data = [];
        data = codec.utf8.encode("1234");
        let buffer =  treaty.pottingData(type,this.seq,data,data.length,false,false,true,0,true);
        console.log("读取成功5:")
        let array = new Uint8Array(buffer);
        BluetoothManager.write(this.Bytes2Str(array),0)
            .then(()=>{
                console.log("读取成功6:")
                that.seq++
                setTimeout(function(){
                    BluetoothManager.read(4)
                        .then(data=>{
                            console.log("读取成功:")
                            console.log(data)
                            let wifiModel = JSON.parse(data);
                            console.log('json解析ok')
                            console.log(wifiModel)
                            console.log(wifiModel.bssid)
                            //+wifiModel.bssid
                            that.SelectData.push({name:wifiModel.ssid,id:wifiModel.bssid+"   强度:"+wifiModel.rssi});
                            console.log(that.SelectData)
                            that.setState({
                                displayShuoming: true
                            });
                            that.getWIFILISTDate();
                        })
                        .catch(err=>{
                            console.log(err);
                            if (err==="date2Stringis0"){
                                RRCLoading.hide();
                                ToastAndroid.show("数据接受完成", ToastAndroid.LONG);
                            }else if (err==="acd!=0"){
                                ToastAndroid.show("缓冲中，正在传输数据", ToastAndroid.SHORT);
                                setTimeout(function () {
                                    that.getWIFILISTDate();
                                },200)
                            }else {
                                ToastAndroid.show("读取失败", ToastAndroid.LONG);
                            }

                        })
                },10)

            })
            .catch(err=>{
                console.log('发送失败');
                setTimeout(function () {
                    that.getWIFILISTDate();
                },100)
            })
    }

    getVersion = () =>{
        let type = bleParams.SUBTYPE_GET_VERSION;
        let data = codec.utf8.encode("1234");
        let buffer =  treaty.pottingData(type,1,data,data.length,false,false,true,0,true);
        let array = new Uint8Array(buffer);
        BluetoothManager.write(this.Bytes2Str(array),0)
            .then(()=>{
                this.bluetoothReceiveData = [];
                this.setState({
                    writeData:buffer.buffer,
                    text:'',
                })
                setTimeout(function(){
                    BluetoothManager.read(4)
                        .then(data=>{
                            console.log("读取成功:")
                            console.log(data)
                            ToastAndroid.show("版本号为："+data, ToastAndroid.SHORT);
                        })
                        .catch(err=>{
                            this.alert('读取失败');
                        })
                },10)
            })
            .catch(err=>{
                this.alert('发送失败');
            })
    };
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
    wifiName: string;
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
    sliceArr(array, size) {
        let result = [];
        for (let x = 0; x < Math.ceil(array.length / size); x++) {
            let start = x * size;
            let end = start + size;
            result.push(array.slice(start, end));
        }
        return result;
    }
    Uint8ArrayToString(fileData){
        var dataString = "";
        for (var i = 0; i < fileData.length; i++) {
            dataString += String.fromCharCode(fileData[i]);
        }
        return dataString
    }
    bitGet( dater, num){
        return ((dater & (1<<(num))) >> num) == 1 ? 1 : 0
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
    showLoading(){
        RRCLoading.setLoadingOptions({
            text: '正在传输，请等待',
            loadingBackgroundColor: 'rgba(0,0,0,0.0)',
            loadingViewStyle: {backgroundColor: 'rgba(0,0,0,0.8)'},
            loadingTextStyle: {}
        })
      
        RRCLoading.show();
    }
    showOrHide() {
        console.log(this.state.animating)
        if (this.state.animating) {
          this.setState({
            animating: false
          });
        } else {
          this.setState({
            animating: true
          });
        }
    }

    

    opens(v){//接收子组件传递过来的数据
        let that = this;
        console.log('在这里处理子组件返回的值');
        console.log(v);
        console.log(v.key);
        console.log(v.value);
        for (const key in v) {
            console.log(v[key]);
            that.wifiName = v[key].toString();
            console.log(that.wifiName);
        }
    }

    componentDidMount(){
        BluetoothManager.start();  //蓝牙初始化
        this.updateStateListener = BluetoothManager.addListener('BleManagerDidUpdateState',this.handleUpdateState);
        this.stopScanListener = BluetoothManager.addListener('BleManagerStopScan',this.handleStopScan);
        this.discoverPeripheralListener = BluetoothManager.addListener('BleManagerDiscoverPeripheral',this.handleDiscoverPeripheral);
	    this.connectPeripheralListener = BluetoothManager.addListener('BleManagerConnectPeripheral',this.handleConnectPeripheral);
        this.disconnectPeripheralListener = BluetoothManager.addListener('BleManagerDisconnectPeripheral',this.handleDisconnectPeripheral);
        this.updateValueListener = BluetoothManager.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValue);
        this._checkPermission();
    }
    // 使用步骤
    _checkPermission = async () => {
        console.log("_checkPermission")
        const permissions = [permission.ACCESS_FINE_LOCATION,permission.ACCESS_COARSE_LOCATION];
        // 检查权限  等待异步函数的返回值
        console.log("_checkPermission2")
        const granted = await checkPermission(permission.ACCESS_FINE_LOCATION);
        console.log("_checkPermission3")
        if (granted) {
            // 有权限 --> 实现业务逻辑
            ToastAndroid.show("开始扫描附近设备", ToastAndroid.SHORT);
            // this.scan();
        } else {
            // 没有权限 --> 获取权限  a --> true 授权了
            let granted = await requestMultiplePermission(permissions);
            if (granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted') {
                console.log('通过权限 可以使用该功能');
                ToastAndroid.show("请点击扫描", ToastAndroid.SHORT);
                this.scan();
            } else {
                console.log('拒绝了权限 无法使用该功能');
                ToastAndroid.show("拒绝了权限 无法使用该功能", ToastAndroid.LONG);
            }
        }
    };


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
                BleManager.requestMTU(item.item.id, 220)
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
                    {/*{this.renderWriteView('写数据(write)：','发送',BluetoothManager.writeWithResponseCharacteristicUUID,this.write,this.state.writeData)}*/}
                    {/*{this.renderWriteView('写数据(writeWithoutResponse)：','发送',BluetoothManager.writeWithoutResponseCharacteristicUUID,this.writeWithoutResponse,this.state.writeData)}*/}
                    {/*{this.renderReceiveView('读取的数据：','读取',BluetoothManager.readCharacteristicUUID,this.read,this.state.readData)}*/}
                    {/*{this.renderReceiveView('通知监听接收的数据：'+`${this.state.isMonitoring?'监听已开启':'监听未开启'}`,'开启通知',BluetoothManager.nofityCharacteristicUUID,this.notify,this.state.receiveData)}*/}

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

    SelectData = [

    ]
    render () {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#15127e" />
                <View style={styles.container}>
                    <View style={styles.buttonContainer}>
                        <Button
                            onPress={this.smartConfig}
                            title="点我获取wifi列表"
                            color="#841584"
                        />
                        <Button
                            onPress={this.getWifiStatus}
                            title="查看wifi状态"

                        />
                        <Button
                            onPress={this.getVersion}
                            title="查看VERSION"

                        />
                        <Button
                            onPress={this.disconnectSta}
                            title="断开wifi"
                            color="#841584"
                        />

                    </View>
                    {/*<View style={styles.buttonContainer}>*/}
                    {/*</View>*/}

                    {/* <ActivityIndicator
                            animating={this.state.animating}
                            style={[styles.centering, {height: 120}]}
                            size="large" /> */}

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

                {this.state.displayShuoming ? (
 
                        <View >

                        <Selectmore
                            opens={this.opens.bind(this)}
                            SelectData={this.SelectData}
                            style={{flexWrap:'wrap',padding:6}}
                            TextColor={{color:'#666',fontSize:13}}/>

                        <TextInput
                            style={styles.input}
                            placeholder='请输入密码'
                            placeholderTextColor={"#CCC"}
                            returnKeyType='done'
                            clearButtonMode='while-editing'
                            enablesReturnKeyAutomatically={true}
                            editable={true}
                            maxLength={100}
                            keyboardType='default'
                            onFocus={()=> console.log("--获取焦点触发事件--")}
                            onBlur={()=> console.log("--失去焦点触发事件--")}
                            onChange={() =>
                                console.log("---当文本发生改变时，调用该函数--")
                                }
                            onEndEditing={() => console.log("--当结束编辑时，调用该函数--")}
                            onSubmitEditing={ () => console.log("--当结束编辑后，点击键盘的提交按钮时触发事件--")}
                            onChangeText={(text) => {
                                    this.state.password = text
                                }}
                        />

                        <Button
                            onPress={this.sendPassword}
                            title="发送密码"
                            color="#841584"
                        />
                        </View>
            
                ) : null}
              
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
    centering: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
      },
})


