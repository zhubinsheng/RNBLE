import React from 'react';
import {Checkbox} from 'antd-mobile-rn';

import {View,Text,Image,TouchableOpacity,Modal,TextInput,FlatList,ToastAndroid} from 'react-native';

export default class Selectmore extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            SelectData: this.props.SelectData,//数据源
            visible: false,//控制model显示隐藏
            activeItemObj: {},//选中的元素
        }
    }

    componentWillReceiveProps(nxprops) {//接收新的props
        this.state.SelectData = nxprops.SelectData;
    }

    showListData() {//选中的内容显示
        let activeItem = this.state.activeItemObj;
        let display = [];
        for (let i in activeItem) {
            if (activeItem[i]) {
                display.push(activeItem[i]);
            }
        }
        if (display.length > 0) {
            return display.map((v, i) => <Text key={i} style={{width: '90%'}}>{v}</Text>);
        } else {
            return <Text>点击选择wifi</Text>
        }
    }

    option() {//点击确定---关闭model---数据返回父组件
        this.setState({
            visible: false,
            SelectData: this.props.SelectData
        });
        let activeItemObj = this.state.activeItemObj;
        let actives = {};
        for (let i in activeItemObj) {//过滤掉空的数据
            if (!!activeItemObj[i]) {//如果存在数据，取出数据
                actives[i] = activeItemObj[i];
            }
        }
        this.props.opens(actives)
    }

    cansol() {//取消之后将model关闭，数据清空
        this.setState({
            visible: false,
            activeItemObj: {}
        });
        this.props.opens({});
    }

    selects(e, item) {//选中元素---判断当前元素是否选中，选中将选中的元素添加到一个新的对象里面，否则设为空
        let s = e.target.checked;
        this.state.activeItemObj[item.id] = s ? item.name : null;
        this.forceUpdate();
    }


    render() {
        let {color, fontSize} = {...this.props.TextColor}
        return (<View>
                <TouchableOpacity onPress={() => this.setState({visible: true})}>
                    <View style={{...this.props.style, backgroundColor: 'white', minWidth: "95%", maxWidth: '95%'}}>
                        {this.showListData()}
                    </View>
                </TouchableOpacity>
                {this.state.visible &&
                <Modal animationType={'slide'} transparent={true} onRequestClose={() => this.option()}>
                    <View style={{backgroundColor: 'rgba(0,0,0,.3)', width: '100%', height: '100%'}}>
                        <TouchableOpacity style={{width: '100%', height: '40%'}} onPress={() => {
                            this.setState({visible: false});
                        }}></TouchableOpacity>
                        <View style={{
                            width: '100%',
                            backgroundColor: 'white',
                            height: '60%',
                            borderTopStartRadius: 5,
                            borderTopEndRadius: 5
                        }}>
                            <View style={{
                                justifyContent: 'space-between',
                                flexDirection: 'row',
                                padding: 7,
                                alignItems: 'center',
                                borderTopStartRadius: 5,
                                borderTopEndRadius: 5,
                                backgroundColor: '#0390e8'
                            }}>
                                <Text style={{color: 'white', fontSize: 16}} onPress={() => this.cansol()}>取消</Text>
                                <Text style={{color: 'white', fontSize: 16}} onPress={() => this.option()}>确定</Text>
                            </View>
                            <FlatList style={{height: '100%', marginTop: 8}} data={this.state.SelectData}
                                      keyExtractor={(item, index) => index.toString()}
                                      renderItem={({item, index}) => {
                                          let isChecked = this.state.activeItemObj[item.id];
                                          if (isChecked == undefined) {
                                              isChecked = this.state.activeItemObj[item.id] = false;
                                          }
                                          return (<View key={index} style={{
                                              marginLeft: 9,
                                              marginBottom: 8,
                                              flexDirection: 'row',
                                              padding: 5,
                                              width: '95%'
                                          }}>
                                              <Checkbox checked={!!isChecked} onChange={(e) => this.selects(e, item)}>
                                                  <Text style={{
                                                      width: '92%',
                                                      left: 5,
                                                      color: 'black',
                                                      fontSize: fontSize ? fontSize : 18,
                                                      borderBottomColor: '#ccc',
                                                      borderBottomWidth: 1,
                                                      borderStyle: 'solid',
                                                      paddingTop: 8,
                                                      paddingBottom: 8
                                                  }}>{item.name+"   mac:"+item.id}</Text>
                                              </Checkbox>
                                          </View>)
                                      }}
                            />
                        </View>
                    </View>
                </Modal>}
            </View>
        )
    }
}
